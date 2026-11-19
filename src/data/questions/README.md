# 問題データ形式

各ファイルは `Question[]` の JSON 配列。

```ts
{
  "id": "basics-001",        // <カテゴリID>-<3桁連番>
  "category": "basics",      // カテゴリID（src/data/exam.ts の CATEGORIES）
  "level": 1,                // 1=基礎 2=標準 3=応用
  "subject": "A",            // "A"=科目A形式（知識） / "B"=科目B形式（事例）
  "question": "問題文",       // 改行は \n
  "choices": ["ア", "イ", "ウ", "エ"],  // 必ず4つ
  "answer": 0,               // 正解のインデックス 0-3
  "explanation": "解説",      // 正解の理由と、主な誤答がなぜ誤りか
  "tags": ["キーワード"]      // 任意
}
```

`node scripts/validate-questions.mjs` で検証できる。
