// 問題データの検証: node scripts/validate-questions.mjs [file...]
import fs from 'node:fs'
import path from 'node:path'

const dir = path.join(path.dirname(new URL(import.meta.url).pathname), '../src/data/questions')
const CATS = ['basics', 'threats', 'crypto', 'isms', 'risk', 'measures', 'network', 'incident', 'law', 'management', 'case']
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => path.join(dir, f))

let errors = 0
const ids = new Set()
for (const file of files) {
  let data
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')) } catch (e) { console.error(`${file}: JSON parse error: ${e.message}`); errors++; continue }
  if (!Array.isArray(data)) { console.error(`${file}: not an array`); errors++; continue }
  const dist = [0, 0, 0, 0]
  const levels = { 1: 0, 2: 0, 3: 0 }
  for (const q of data) {
    const where = `${path.basename(file)}:${q.id}`
    const err = m => { console.error(`${where}: ${m}`); errors++ }
    if (typeof q.id !== 'string' || !/^[a-z]+-\d{3}$/.test(q.id)) err('bad id')
    if (ids.has(q.id)) err('duplicate id'); ids.add(q.id)
    if (!CATS.includes(q.category)) err(`bad category ${q.category}`)
    if (![1, 2, 3].includes(q.level)) err('bad level')
    if (!['A', 'B'].includes(q.subject)) err('bad subject')
    if (typeof q.question !== 'string' || q.question.length < 10) err('question too short')
    if (!Array.isArray(q.choices) || q.choices.length !== 4 || q.choices.some(c => typeof c !== 'string' || !c.trim())) err('choices must be 4 non-empty strings')
    else if (new Set(q.choices).size !== 4) err('duplicate choices')
    if (![0, 1, 2, 3].includes(q.answer)) err('bad answer'); else dist[q.answer]++
    if (typeof q.explanation !== 'string' || q.explanation.length < 30) err('explanation too short')
    levels[q.level] = (levels[q.level] || 0) + 1
  }
  const n = data.length
  const skew = n >= 8 && dist.some(d => d / n > 0.4)
  console.log(`${path.basename(file)}: ${n}問 level=${JSON.stringify(levels)} 正解分布=${dist.join('/')}${skew ? '  ⚠ 正解位置が偏っています' : ''}`)
  if (skew) errors++
}
console.log(errors ? `\n✗ ${errors} 件のエラー` : `\n✓ OK (${ids.size}問)`)
process.exit(errors ? 1 : 0)
