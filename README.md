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

## 開発

```bash
npm install
cp .env.local.example .env.local   # ANTHROPIC_API_KEY を設定（AI解説を使う場合）
npm run dev
```

## 問題データ

`src/data/questions/*.json` に分野ごとに格納。形式は `src/data/questions/README.md` を参照。
`npm run validate` で形式・ID重複・正解位置の偏りを検証します（`npm run build` でも自動実行）。

## デプロイ（Vercel）

環境変数 `ANTHROPIC_API_KEY`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定してください。未設定でもアプリは動作し、AI解説だけが「準備中」と表示されます。
