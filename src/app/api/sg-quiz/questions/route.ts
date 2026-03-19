import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/sg-quiz/questions?category=xxx&level=1&mode=mock&limit=30
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const level = searchParams.get("level");
    const mode = searchParams.get("mode");
    const limit = searchParams.get("limit");
    const deviceId = searchParams.get("deviceId");

    let query = supabase.from("sg_questions").select("*");

    if (category) query = query.eq("category", category);
    if (level) query = query.eq("level", Number(level));

    // 模擬試験: ランダム30問
    if (mode === "mock") {
      const { data: allQ } = await query;
      if (!allQ) return NextResponse.json([]);
      const shuffled = allQ.sort(() => Math.random() - 0.5).slice(0, Number(limit) || 30);
      return NextResponse.json(shuffled);
    }

    // 間違い復習: 過去に間違えた問題
    if (mode === "wrong" && deviceId) {
      const { data: wrongIds } = await supabase
        .from("sg_answers")
        .select("question_id")
        .eq("device_id", deviceId)
        .eq("correct", false);
      if (!wrongIds || wrongIds.length === 0) return NextResponse.json([]);
      const ids = Array.from(new Set(wrongIds.map(w => w.question_id)));
      const { data } = await supabase.from("sg_questions").select("*").in("id", ids);
      return NextResponse.json(data || []);
    }

    // 通常の学習モード
    query = query.order("question_no", { ascending: true });
    if (limit) query = query.limit(Number(limit));

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (e) {
    console.error("SG questions error:", e);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
