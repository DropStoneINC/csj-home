export const REPORT_KIND = {
  wrong_answer: '正解が間違っている',
  explanation: '解説の誤り・分かりにくさ',
  typo: '誤字・脱字',
  outdated: '内容が古い',
  other: 'その他',
} as const

export const REPORT_STATUS = {
  open: { label: '未対応', cls: 'bg-ng-soft text-ng' },
  resolved: { label: '対応済み', cls: 'bg-ok-soft text-ok' },
  dismissed: { label: '対応不要', cls: 'bg-sunken text-muted' },
} as const

export const ANNOUNCEMENT_LEVEL = {
  info: { label: 'お知らせ', cls: 'bg-accent-soft text-accent' },
  warning: { label: '注意', cls: 'bg-warn-soft text-warn' },
  maintenance: { label: 'メンテナンス', cls: 'bg-ng-soft text-ng' },
} as const
