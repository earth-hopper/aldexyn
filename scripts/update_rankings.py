import json
import time
import urllib.request
from datetime import datetime, timezone, timedelta

API_URL = "https://liveheats.com/api/graphql"

DIVISIONS = [
    {"key": "ski_men", "title": "Ski Men", "series": "17943", "division": "167931"},
    {"key": "ski_women", "title": "Ski Women", "series": "17943", "division": "167964"},
    {"key": "snowboard_men", "title": "Snowboard Men", "series": "17943", "division": "167965"},
    {"key": "snowboard_women", "title": "Snowboard Women", "series": "17943", "division": "132194"},
]

# 総合ランキング取得クエリ
RANKINGS_QUERY = """
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

# 選手ごとの大会別戦績・ポイント内訳取得クエリ
RESULTS_QUERY = """
query getSeriesResults($id: ID!, $divisionId: ID!, $athleteId: ID!, $filter: String) {
  series(id: $id) {
    id
    athleteRankingResults(
      divisionId: $divisionId
      athleteId: $athleteId
      filter: $filter
    ) {
      results {
        id
        place
        points
        dropped
        eventDivision {
          event {
            name
            date
          }
        }
      }
    }
  }
}
"""

def execute_graphql(payload):
    """GraphQLリクエスト共通関数"""
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0"
        }
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def fetch_rankings(series_id, division_id):
    """部門全体のランキングを取得"""
    payload = {
        "operationName": "getSeriesRankings",
        "query": RANKINGS_QUERY,
        "variables": {
            "id": str(series_id),
            "divisionId": str(division_id),
            "filter": None
        }
    }
    try:
        data = execute_graphql(payload)
        return data.get("data", {}).get("series", {}).get("rankings", [])
    except Exception as e:
        print(f"[Error] ランキング取得失敗: {e}")
        return []

def fetch_athlete_breakdown(series_id, division_id, athlete_id):
    """特定選手の各大会リザルト・獲得ポイント内訳を取得"""
    payload = {
        "operationName": "getSeriesResults",
        "query": RESULTS_QUERY,
        "variables": {
            "id": str(series_id),
            "divisionId": str(division_id),
            "athleteId": str(athlete_id),
            "filter": None
        }
    }
    try:
        data = execute_graphql(payload)
        res_container = data.get("data", {}).get("series", {}).get("athleteRankingResults") or {}
        raw_results = res_container.get("results") or []
        
        breakdown = []
        for r in raw_results:
            event_data = (r.get("eventDivision") or {}).get("event") or {}
            breakdown.append({
                "eventName": event_data.get("name") or "Tournament",
                "place": r.get("place"),
                "points": r.get("points", 0),
                "counted": not r.get("dropped", False),  # droppedがFalseならカウント対象(有効)
                "date": event_data.get("date")
            })
        return breakdown
    except Exception as e:
        print(f"  [Warning] 選手ID {athlete_id} の内訳取得失敗: {e}")
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
        print(f"\n==============================")
        print(f"取得開始: {d['title']}")
        print(f"==============================")
        
        raw_list = fetch_rankings(d["series"], d["division"])
        jp_athletes = []
        current_jp_rank = 1

        # まず日本人選手を抽出
        target_athletes = []
        for item in raw_list:
            display_prop = item.get("displayProperty", "")
            if is_japanese_athlete(display_prop):
                target_athletes.append(item)

        print(f"-> 日本人選手 {len(target_athletes)} 名を検出。各大会の内訳を取得中...")

        for item in target_athletes:
            athlete = item.get("athlete") or {}
            athlete_id = athlete.get("id")
            name = athlete.get("name")

            # 大会別ポイント内訳の取得
            breakdown = fetch_athlete_breakdown(d["series"], d["division"], athlete_id)
            time.sleep(0.1)  # サーバー保護のための短い待機

            jp_athletes.append({
                "japanRank": current_jp_rank,
                "worldRank": item.get("place"),
                "name": name,
                "athleteId": athlete_id,
                "points": item.get("points"),
                "image": athlete.get("image"),
                "breakdown": breakdown
            })
            current_jp_rank += 1

        result_json["categories"][d["key"]] = {
            "title": d["title"],
            "count": len(jp_athletes),
            "athletes": jp_athletes
        }
        print(f"-> {d['title']} 完了: {len(jp_athletes)}名登録")

    with open("rankings.json", "w", encoding="utf-8") as f:
        json.dump(result_json, f, ensure_ascii=False, indent=2)

    print("\n[完了] すべての内訳データを含んだ rankings.json を正常に生成しました。")

if __name__ == "__main__":
    main()