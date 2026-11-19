# CSJ 資格ラボ

情報セキュリティマネジメント試験（SG）の対策に特化した学習アプリ。Next.js 14 (App Router) + Tailwind CSS。

## 機能

- **おすすめ出題** — 未解答の問題と、忘れかけている問題を間隔反復で自動選択
- **分野別演習** — 10分野 × 3レベル＋科目B事例問題。1問ごとに正誤と解説を表示
- **模擬試験** — 本番形式（科目A 48問＋科目B 12問・120分）とミニ模試（20問・40分）。中断・再開に対応
- **復習** — 苦手問題（前回不正解／正答率が低い問題）、ブックマーク、学習履歴、日別の学習量
- **AI解説** — 問題ごとに Claude に質問できる（`/api/ask`）

学習記録はログイン不要で、端末のブラウザ（localStorage）に保存されます。
メールアドレスでログイン（Supabase Auth のマジックリンク）すると、Supabase の `study_progress` テーブルに保存され、複数の端末で同期されます（RLS で本人の行のみ読み書き可）。

## 運用者用管理画面（`/admin`）

| 画面 | できること |
|---|---|
| ダッシュボード | 利用者数・解答数・模試/演習の完了数・AI解説の質問数（日別）、正答率の低い問題、AIへの質問が多い問題、分野別の正答率 |
| 問題管理 | 検索・絞り込み、編集（変更箇所を元データと比較表示）、追加、非公開化、元データに戻す、分野ごとの JSON 書き出し、正解位置の偏りチェック |
| 誤り報告 | 学習者が解説画面の「問題の誤りを報告」から送った内容の確認・対応状況の管理 |
| お知らせ | アプリ上部に出すお知らせ／メンテナンス告知の作成、表示期間の指定、公開・非公開 |

### しくみ

- データは Supabase（Postgres）に保存し、Next.js のサーバー側から `service_role` キーでのみ読み書きします。全テーブルで RLS を有効にし、ポリシーは作っていない（公開キーからは読み書きできない）。
- **問題データ**: `src/data/questions/*.json` が元データ。管理画面で編集・追加した問題だけが DB の `questions` テーブルに入り、元データより優先されます。保存すると数秒でアプリに反映されます。DB に障害があっても元データだけで動きます。
  編集内容をリポジトリに取り込むときは、問題管理画面の「JSON」で分野ごとに書き出して `src/data/questions/` に置き、コミット後に管理画面で「元データに戻す」を押して上書きを外してください。
- **利用ログ**: 端末ごとのランダムな匿名ID・解答の正誤・演習の完了・AI解説の質問回数だけを `events` テーブルに送ります（氏名・メールアドレス・IP アドレスは保存しません）。
- **ログイン**: Google ログイン（OpenID Connect・PKCE）。`ADMIN_ALLOWED_DOMAINS`（既定 `dropstone.co.jp`）の Google Workspace アカウントだけが入れます（個人の Gmail は不可。例外は `ADMIN_ALLOWED_EMAILS` で個別に許可）。予備として `ADMIN_PASSWORD` を設定するとパスワードログインも使えます。セッションは12時間の署名付き Cookie。`/admin` と `/api/admin` は middleware で保護し、変更系の API はクロスサイトからの送信を拒否します。

### セットアップ

1. Supabase でプロジェクトを作成し、SQL Editor で `supabase/migrations/20261119000001_admin.sql` を実行する（Supabase CLI なら `supabase db push`）
2. Google Cloud Console（dropstone.co.jp の組織）で OAuth クライアント ID を作成する
   - OAuth 同意画面: ユーザーの種類「内部」（dropstone.co.jp のユーザーだけに限定される）
   - 認証情報 → OAuth クライアント ID →「ウェブアプリケーション」
   - 承認済みのリダイレクト URI: `https://app.cybershield.jp/api/admin/google/callback`（ローカル開発なら `http://localhost:3000/api/admin/google/callback` も）
3. Vercel の Environment Variables に `SUPABASE_URL`・`SUPABASE_SERVICE_ROLE_KEY`・`GOOGLE_CLIENT_ID`・`GOOGLE_CLIENT_SECRET`・`ADMIN_SESSION_SECRET` を設定して再デプロイする
4. `https://app.cybershield.jp/admin` を開き「Google でログイン」から dropstone.co.jp のアカウントでログインする

環境変数が未設定の場合、学習アプリはこれまでどおり動作し、管理画面・誤り報告・利用ログだけが無効になります。

## 開発

```bash
npm install
cp .env.local.example .env.local   # AI解説・管理画面を使う場合は各キーを設定
npm run dev
```

## 問題データ

`src/data/questions/*.json` に分野ごとに格納。形式は `src/data/questions/README.md` を参照。
`npm run validate` で形式・ID重複・正解位置の偏りを検証します（`npm run build` でも自動実行）。

## デプロイ（Vercel）

環境変数 `ANTHROPIC_API_KEY`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定してください。未設定でもアプリは動作し、AI解説だけが「準備中」と表示されます。管理画面を使う場合は上記「運用者用管理画面」のセットアップも行ってください。
