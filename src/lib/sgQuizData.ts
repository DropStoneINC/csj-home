// 情報セキュリティマネジメント試験 270問データ
// 9カテゴリ × 3レベル × 10問

export type SGQuestion = {
  id: number;
  category: string;
  level: number;  // 1=基礎, 2=応用, 3=実践
  questionNo: number;
  text: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};

export const SG_CATEGORIES = [
  "情報セキュリティの基礎",
  "情報セキュリティ関連法規",
  "情報セキュリティ管理",
  "リスクマネジメント",
  "情報セキュリティ対策（技術）",
  "情報セキュリティ対策（人的・組織的）",
  "ネットワークとセキュリティ",
  "インシデント対応と事業継続",
  "テクノロジ系基礎（システム・DB等）",
] as const;

export const LEVEL_NAMES = ["基礎", "応用", "実践"] as const;

// dscss-sg DBから問題データを取得するAPI
export async function fetchSGQuestions(category?: string, level?: number): Promise<SGQuestion[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (level) params.set("level", String(level));
  const res = await fetch(`/api/sg-quiz/questions?${params}`);
  if (!res.ok) return [];
  return res.json();
}

// クイズ結果をSupabaseに保存
export async function saveSGQuizResult(data: {
  deviceId: string;
  mode: "learn" | "mock" | "wrong";
  category?: string;
  level?: number;
  score: number;
  total: number;
  answers: { questionId: number; selectedIndex: number; correct: boolean }[];
}) {
  const res = await fetch("/api/sg-quiz/result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// デバイスIDの取得・生成
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("sg_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("sg_device_id", id);
  }
  return id;
}

// 学習サマリーの取得
export async function fetchSGSummary(deviceId: string) {
  const res = await fetch(`/api/sg-quiz/summary?deviceId=${deviceId}`);
  if (!res.ok) return null;
  return res.json();
}
