-- 旧 Cyber Shield Agent（csj-home 旧版）と旧SGクイズ（csj-learn-sg）のスキーマを削除（本番DBに適用済み）
-- 残すもの: study_progress / 管理画面(admin_console) / cybershield.jp の threat_reports 一式

-- 新規登録時に profiles へ書き込む旧トリガー（テーブル削除後に登録が失敗しないよう先に外す）
drop trigger if exists on_auth_user_created on auth.users;

drop table if exists
  public.attempt_answers, public.attempt_questions, public.attempts, public.wrong_questions, public.sg_questions,
  public.sg_quiz_results, public.sg_mock_results, public.sg_wrong_answers,
  public.activity_logs, public.ai_messages, public.ai_conversations, public.simulation_sessions,
  public.threat_search_logs, public.threat_indicators, public.threat_reports_v2,
  public.learning_progress, public.learning_lessons, public.learning_courses,
  public.assessment_answers, public.assessment_sessions, public.assessment_questions, public.assessment_templates,
  public.score_events, public.organization_scores, public.user_scores,
  public.organization_settings, public.organization_members, public.organizations, public.profiles
  cascade;

drop function if exists public.handle_new_user();
drop function if exists public.handle_new_organization();
drop function if exists public.recalculate_user_score(uuid);

drop type if exists
  public.persona_type, public.member_role, public.member_status, public.assessment_type, public.question_type,
  public.assessment_status, public.learning_status, public.report_type, public.report_status, public.indicator_type,
  public.threat_category_v2, public.severity_level, public.source_type, public.simulation_type, public.simulation_status,
  public.context_type, public.message_role, public.score_target_type;
