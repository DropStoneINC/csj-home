'use client'
// 模擬試験の途中経過（リロードや中断後に再開するため）
const KEY = 'csj-mock-inprogress-v1'

export interface MockState {
  ids: string[]
  answers: (number | null)[]
  flags: number[]
  endsAt: number
  minutes: number
  title: string
  idx: number
}

export function loadMock(): MockState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as MockState
    // 制限時間を過ぎて1日以上たったものは破棄
    if (s.endsAt < Date.now() - 86_400_000) {
      localStorage.removeItem(KEY)
      return null
    }
    return s
  } catch {
    return null
  }
}

export function saveMock(s: MockState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {}
}

export function clearMock() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
