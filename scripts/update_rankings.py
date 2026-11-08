import json
import urllib.request
from datetime import datetime, timezone, timedelta

API_URL = "https://liveheats.com/api/graphql"

DIVISIONS = [
    {"key": "ski_men", "title": "Ski Men", "series": "17943", "division": "167931"},
    {"key": "ski_women", "title": "Ski Women", "series": "17943", "division": "167964"},
    {"key": "snowboard_men", "title": "Snowboard Men", "series": "17943", "division": "167965"},
    {"key": "snowboard_women", "title": "Snowboard Women", "series": "17943", "division": "132194"},
]

# 最初に確実に成功していたベースのGraphQLクエリ
BASE_QUERY = """
query getSeriesRankings($id: ID!, $divisionId: ID!, $filter: String) {
  series(id: $id) {
    id
    rankings(divisionId: $divisionId, filter: $filter) {
      athlete {
        id
        name
        image
        __typename
      }
      displayProperty
      place
      points
      __typename
    }
    __typename
  }
}
"""

def fetch_rankings(series_id, division_id):
    payload = {
        "operationName": "getSeriesRankings",
        "query": BASE_QUERY,
        "variables": {
            "id": str(series_id),
            "divisionId": str(division_id),
            "filter": None
        }
    }
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0"
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if "errors" in data:
                print(f"[API Warning] GraphQL Errors for series {series_id}, division {division_id}:", data["errors"])
            
            series_data = data.get("data", {}).get("series") or {}
            rankings = series_data.get("rankings", [])
            print(f"-> 取得成功: {len(rankings)}件のレコードを受信")
            return rankings
    except Exception as e:
        print(f"[API Error] リクエスト失敗: {e}")
        return []

def is_japanese_athlete(display_prop):
    if not display_prop:
        return False
    prop_clean = str(display_prop).strip().upper()
    return prop_clean in ["JPN", "JAPAN", "JP"] or "JPN" in prop_clean or "JAPAN" in prop_clean

def main():
    jst = timezone(timedelta(hours=9))
    updated_at = datetime.now(jst).strftime("%Y年%m月%d日 %H:%M")

    result_json = {
        "lastUpdated": updated_at,
        "categories": {}
    }

    for d in DIVISIONS:
        print(f"\n--- {d['title']} の取得開始 ---")
        raw_list = fetch_rankings(d["series"], d["division"])
        jp_athletes = []
        current_jp_rank = 1

        for item in raw_list:
            display_prop = item.get("displayProperty", "")
            
            if is_japanese_athlete(display_prop):
                athlete = item.get("athlete") or {}
                
                jp_athletes.append({
                    "japanRank": current_jp_rank,
                    "worldRank": item.get("place"),
                    "name": athlete.get("name"),
                    "athleteId": athlete.get("id"),
                    "points": item.get("points"),
                    "image": athlete.get("image"),
                    "breakdown": []  # 内訳はスキーマ確定後に安全に追加
                })
                current_jp_rank += 1

        result_json["categories"][d["key"]] = {
            "title": d["title"],
            "count": len(jp_athletes),
            "athletes": jp_athletes
        }
        print(f"[{d['title']}] 完了: 日本人選手 {len(jp_athletes)}名を登録")

    with open("rankings.json", "w", encoding="utf-8") as f:
        json.dump(result_json, f, ensure_ascii=False, indent=2)

    print("\n[完了] rankings.json を正常に生成しました。")

if __name__ == "__main__":
    main()