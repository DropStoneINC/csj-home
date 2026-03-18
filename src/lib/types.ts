export type PersonaType = 'individual' | 'employee' | 'manager' | 'admin'
export type MemberRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer'
export type AssessmentType = 'self' | 'company' | 'email_cloud'
export type AssessmentStatus = 'draft' | 'in_progress' | 'completed'
export type LearningStatus = 'not_started' | 'in_progress' | 'completed'
export type ReportType = 'url' | 'domain' | 'email' | 'sms' | 'file' | 'screenshot'
export type ReportStatus = 'submitted' | 'triaged' | 'confirmed' | 'dismissed'
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical'
export type SimulationType = 'cyber_war' | 'pentest'
export type ContextType = 'general' | 'dashboard' | 'assessment' | 'learning' | 'threat_report' | 'threat_search' | 'simulation'

export interface Profile {
  id: string
  display_name: string
  email: string
  persona_type: PersonaType
  job_title?: string
  industry?: string
  avatar_url?: string
}

export interface UserScore {
  id: string
  user_id: string
  overall_score: number
  awareness_score: number
  email_security_score: number
  cloud_security_score: number
  identity_score: number
  device_score: number
  threat_response_score: number
  learning_score: number
  simulation_score: number
}

export interface Organization {
  id: string
  name: string
  slug?: string
  industry?: string
  employee_size_band?: string
  security_maturity_level: number
}

export interface AssessmentTemplate {
  id: string
  code: string
  name: string
  description?: string
  assessment_type: AssessmentType
}

export interface AssessmentQuestion {
  id: string
  template_id: string
  question_code: string
  question_text: string
  question_type: string
  category: string
  weight: number
  sort_order: number
  options_json?: {
    options: { value: string; label: string; score: number }[]
  }
}

export interface AssessmentSession {
  id: string
  template_id: string
  user_id: string
  status: AssessmentStatus
  raw_score?: number
  normalized_score?: number
  ai_summary?: string
}

export interface LearningCourse {
  id: string
  course_code: string
  title: string
  description?: string
  category: string
  difficulty_level: number
}

export interface LearningLesson {
  id: string
  course_id: string
  lesson_code: string
  title: string
  content_type: string
  estimated_minutes: number
  sort_order: number
}

export interface LearningProgress {
  id: string
  user_id: string
  course_id: string
  lesson_id: string
  status: LearningStatus
  progress_percent: number
  quiz_score?: number
}

export interface ThreatReport {
  id: string
  reporter_user_id: string
  report_type: ReportType
  raw_text?: string
  target_value?: string
  ai_classification?: string
  risk_score: number
  status: ReportStatus
  created_at: string
}

export interface ThreatIndicator {
  id: string
  indicator_type: string
  indicator_value: string
  threat_category: string
  confidence_score: number
  severity: SeverityLevel
  ai_summary?: string
  mitigation_text?: string
  first_seen_at: string
  last_seen_at: string
  report_count: number
}

export interface SimulationSession {
  id: string
  user_id: string
  simulation_type: SimulationType
  scenario_code?: string
  difficulty_level: number
  status: string
  score: number
}

export interface AIConversation {
  id: string
  user_id: string
  context_type: ContextType
  title: string
  created_at: string
}

export interface AIMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  message_text: string
  created_at: string
}

export interface ScoreEvent {
  id: string
  event_type: string
  score_category: string
  delta: number
  reason?: string
  created_at: string
}

export interface NavItem {
  label: string
  href: string
  icon: string
}
