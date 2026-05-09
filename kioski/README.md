# キオスキ（SnowPass）モック版 – Supabaseのみ

静的HTML（`ticket.html` / `dashboard.html`）から **Supabase（Postgres）だけ** を使って、購入→QR表示→「発券」ボタンで利用（消費）→管理画面反映まで通すモックです。

## 1) Supabase プロジェクト作成
- Supabaseで新規プロジェクトを作成
- `Project Settings` → `API` から以下を控える
  - **Project URL**
  - **anon public key**

## 2) DBスキーマ適用
- Supabaseの `SQL Editor` を開く
- このリポジトリの `supabase/schema.sql` を貼り付けて実行

対象ファイル:
- `supabase/schema.sql`

## 3) フロントにSupabase設定を反映
以下2ファイルの先頭付近にある設定を自分のプロジェクト値へ置き換えます。

- `ticket.html`
- `dashboard.html`

置換箇所（両方にあります）:

```js
const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

## 4) ローカル起動（静的サーバ）
このフォルダで簡易サーバを起動します。

```bash
python -m http.server 8000
```

ブラウザで開きます:
- 購入画面: `http://localhost:8000/ticket.html`
- 管理画面: `http://localhost:8000/dashboard.html`

## 使い方（モック）
### 購入 → QR表示
- `ticket.html` で商品数量を選択
- メールを入力して「支払いを確定する」→DBに `orders` / `order_items` / `tickets` を作成
- 最初の `ticket_code` をQRとして表示します（複数枚購入でも表示は先頭1枚）

### 発券ボタン（=利用/消費トリガー）
- QRの下の **「発券する（モック：利用処理を実行）」** を押すと、DB関数 `redeem_ticket(ticket_code)` が呼ばれます
- **同一 `ticket_code` は1回だけ** `used_at` が入ります（2回目はエラー）

### 管理画面
- `dashboard.html` は `tickets` を `orders` / `products` とJOINして表示します
- 検索・フィルタはクライアント側で簡易的に効きます
- 右上の更新ボタンで再読み込みできます

## 本番との差分（重要）
このモックは **「無料・簡易」優先** のため、本番運用に必要なセキュリティを省略しています。

- **anonキーがフロントに露出**します（本番不可）
- **認証なし**でDBを直接叩きます（本番不可）
- RLS（Row Level Security）や端末認証、署名付きQRなどが未実装です

本番の想定（タブレット発券機/ゲート端末）では、少なくとも以下が必要です。
- 端末（発券機）認証
- RLSの適用
- QRの改ざん防止（署名/期限/nonce等）
- Edge Functions もしくは独自APIサーバでの検証・利用処理

