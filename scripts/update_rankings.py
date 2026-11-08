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

# breakdown (大会別の内訳データ) を取得するように拡張したクエリ
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
      breakdown {
        event {
          id
          name
        }
        place
        points
        counted
      }
      __typename
    }
    __typename
  }
}
"""

def fetch_rankings(series_id, division_id):
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
        raw_list = fetch_rankings(d["series"], d["division"])
        jp_athletes = []
        current_jp_rank = 1

        for item in raw_list:
            display_prop = item.get("displayProperty", "")
            
            if is_japanese_athlete(display_prop):
                athlete = item.get("athlete") or {}
                
                # 大会別リザルトの整形
                raw_breakdown = item.get("breakdown") or []
                breakdown_list = []
                for b in raw_breakdown:
                    event = b.get("event") or {}
                    breakdown_list.append({
                        "eventName": event.get("name") or "大会名未定",
                        "place": b.get("place"),
                        "points": b.get("points", 0),
                        "counted": b.get("counted", True)  # 有効ポイントか切り捨てか
                    })

                jp_athletes.append({
                    "japanRank": current_jp_rank,
                    "worldRank": item.get("place"),
                    "name": athlete.get("name"),
                    "athleteId": athlete.get("id"),
                    "points": item.get("points"),
                    "image": athlete.get("image"),
                    "breakdown": breakdown_list  # 内訳配列
                })
                current_jp_rank += 1

        result_json["categories"][d["key"]] = {
            "title": d["title"],
            "count": len(jp_athletes),
            "athletes": jp_athletes
        }
        print(f"[{d['title']}] 日本人選手: {len(jp_athletes)}名を抽出")

    with open("rankings.json", "w", encoding="utf-8") as f:
        json.dump(result_json, f, ensure_ascii=False, indent=2)

    print("rankings.json の更新が完了しました。")

if __name__ == "__main__":
    main()