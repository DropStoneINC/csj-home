import { supabase } from './supabase'

// ─── Assessment ───

export async function fetchAssessmentQuestions(templateCode: string) {
  const { data: template } = await supabase
    .from('assessment_templates')
    .select('id, code, name')
    .eq('code', templateCode)
    .single()

  if (!template) return { template: null, questions: [] }

  const { data: questions } = await supabase
    .from('assessment_questions')
    .select('*')
    .eq('template_id', template.id)
    .order('sort_order')

  return { template, questions: questions || [] }
}

export async function createAssessmentSession(userId: string, templateId: string, type: string, orgId?: string) {
  const { data, error } = await supabase
    .from('assessment_sessions')
    .insert({
      user_id: userId,
      template_id: templateId,
      assessment_type: type,
      organization_id: orgId || null,
      status: 'in_progress',
    })
    .select()
    .single()

  if (error) console.error('createAssessmentSession error:', error)
  return data
}

export async function saveAssessmentAnswers(
  sessionId: string,
  answers: { question_id: string; answer_value: string; score: number }[]
) {
  const rows = answers.map(a => ({
    session_id: sessionId,
    question_id: a.question_id,
    answer_value: a.answer_value,
    score: a.score,
  }))

  const { error } = await supabase.from('assessment_answers').insert(rows)
  if (error) console.error('saveAssessmentAnswers error:', error)
}

export async function completeAssessmentSession(sessionId: string, totalScore: number) {
  const { error } = await supabase
    .from('assessment_sessions')
    .update({ status: 'completed', total_score: totalScore, completed_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) console.error('completeAssessmentSession error:', error)
}

// ─── Score ───

export async function addScoreEvent(
  userId: string,
  delta: number,
  reason: string,
  category: string,
  targetType: 'user' | 'organization' = 'user',
  orgId?: string
) {
  const { error } = await supabase.from('score_events').insert({
    user_id: userId,
    organization_id: orgId || null,
    score_target_type: targetType,
    delta,
    reason,
    category,
  })
  if (error) console.error('addScoreEvent error:', error)
}

export async function recalcUserScore(userId: string) {
  const { error } = await supabase.rpc('recalculate_user_score', { p_user_id: userId })
  if (error) console.error('recalcUserScore error:', error)
}

export async function getUserScore(userId: string) {
  const { data } = await supabase
    .from('user_scores')
    .select('*')
    .eq('user_id', userId)
    .single()

  return data
}

export async function getScoreEvents(userId: string, limit = 10) {
  const { data } = await supabase
    .from('score_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data || []
}

// ─── Activity Log ───

export async function logActivity(userId: string, eventType: string, moduleName: string, payload?: any) {
  await supabase.from('activity_logs').insert({
    user_id: userId,
    event_type: eventType,
    module_name: moduleName,
    payload_json: payload || null,
  })
}
