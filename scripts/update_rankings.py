import json
import urllib.request
from datetime import datetime, timezone, timedelta

# Liveheats GraphQL API
API_URL = "https://liveheats.com/api/graphql"

# 対象の4部門 (提示されたURLの series と division)
DIVISIONS = [
    {"key": "ski_men", "title": "Ski Men", "series": "17943", "division": "167931"},
    {"key": "ski_women", "title": "Ski Women", "series": "17943", "division": "167964"},
    {"key": "snowboard_men", "title": "Snowboard Men", "series": "17943", "division": "167965"},
    {"key": "snowboard_women", "title": "Snowboard Women", "series": "17943", "division": "132194"},
]

GRAPHQL_QUERY = """
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
    """Liveheatsから指定部門のランキング生データを取得"""
    payload = {
        "operationName": "getSeriesRankings",
        "query": GRAPHQL_QUERY,
        "variables": {
            "id": series_id,
            "divisionId": division_id,
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
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data.get("data", {}).get("series", {}).get("rankings", [])

def is_japanese_athlete(display_prop):
    """国籍表示（displayProperty）が日本かどうか判定"""
    if not display_prop:
        return False
    prop_clean = str(display_prop).strip().upper()
    # Liveheats上で「JPN」「JAPAN」「JP」等で登録されているケースに対応
    return prop_clean in ["JPN", "JAPAN", "JP"] or "JPN" in prop_clean or "JAPAN" in prop_clean

def main():
    # 日本時間 (JST) で更新日時を記録
    jst = timezone(timedelta(hours=9))
    updated_at = datetime.now(jst).strftime("%Y年%m月%d日 %H:%M")

    result_json = {
        "lastUpdated": updated_at,
        "categories": {}
    }

    for d in DIVISIONS:
        raw_list = fetch_rankings(d["series"], d["division"])
        jp_athletes = []
        current_jp_rank = 1

        for item in raw_list:
            display_prop = item.get("displayProperty", "")
            
            # 国籍が日本の選手のみ抽出
            if is_japanese_athlete(display_prop):
                athlete = item.get("athlete") or {}
                jp_athletes.append({
                    "japanRank": current_jp_rank,
                    "worldRank": item.get("place"),
                    "name": athlete.get("name"),
                    "athleteId": athlete.get("id"),
                    "points": item.get("points"),
                    "country": display_prop,
                    "image": athlete.get("image")
                })
                current_jp_rank += 1

        result_json["categories"][d["key"]] = {
            "title": d["title"],
            "count": len(jp_athletes),
            "athletes": jp_athletes
        }
        print(f"[{d['title']}] 日本人選手: {len(jp_athletes)}名を抽出しました")

    # rankings.json に上書き保存
    with open("rankings.json", "w", encoding="utf-8") as f:
        json.dump(result_json, f, ensure_ascii=False, indent=2)

    print("rankings.json の生成が完了しました！")

if __name__ == "__main__":
    main()