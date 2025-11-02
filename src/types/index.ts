/**
 * Type Definitions
 * Aligned with SPEC_MASTER.md §18
 */

// =============================================================================
// 18.1 Enums
// =============================================================================

export type Department =
  | 'finance'
  | 'admissions'
  | 'registrar'
  | 'it_support'
  | 'student_affairs'
  | 'general';

export type Role =
  | 'admin'
  | 'manager'
  | 'agent'
  | 'student';

export type CaseStatus =
  | 'open'
  | 'pending'
  | 'resolved'
  | 'closed'
  | 'spam';

export type Priority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export type Channel =
  | 'email'
  | 'whatsapp'
  | 'webchat'
  | 'student_portal';

export type Locale =
  | 'en'
  | 'ar';

export type SLARisk =
  | 'on_track'
  | 'at_risk'
  | 'breached';

// =============================================================================
// 18.2 Core Types
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: Department | null;
  locale: Locale;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface StudentProfile {
  id: string;
  studentId: string; // e.g., S2024-0001
  name: string;
  email: string;
  phone: string | null;
  locale: Locale;
  enrollmentYear: number;
  accountBalance: number;
  holds: string[];
}

export interface Case {
  id: string;
  ticketNumber: string;
  department: Department;
  subject: string;
  studentId: string;
  studentName: string;
  priority: Priority;
  status: CaseStatus;
  channel: Channel;
  slaRisk: SLARisk;
  slaDeadline: string; // ISO date
  assignee: {
    id: string;
    name: string;
  } | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  messageCount: number;
  duplicateOf?: string | null;
  mergedCases?: string[];
}

export interface SLA {
  firstResponseDueAt: string;
  resolutionDueAt: string;
  riskLevel: 'green' | 'yellow' | 'red';
  breached: boolean;
  percentElapsed: number;
}

export interface Message {
  id: string;
  caseId: string;
  authorId: string;
  authorName: string;
  body: string;
  isInternalNote: boolean;
  createdAt: string;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface Queue {
  id: string;
  name: string;
  department: Department;
  conditions: QueueCondition[];
  assignmentRule: 'round_robin' | 'load_balanced' | 'manual';
}

export interface QueueCondition {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'contains';
  value: string | string[];
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  category: string;
  department: Department;
  tags: string[];
  locale: Locale;
  status: 'draft' | 'published' | 'archived';
  authorId: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
}

export interface FormSchema {
  id: string;
  name: string;
  department: Department;
  fields: FormField[];
  active: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'file' | 'checkbox';
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: string;
  maxLength?: number;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
}

export interface WorkflowTrigger {
  event: 'case_created' | 'case_updated' | 'message_received' | 'sla_warning';
  filters: Record<string, unknown>;
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface WorkflowAction {
  type: 'assign' | 'tag' | 'status_change' | 'send_email' | 'webhook';
  params: Record<string, unknown>;
}

// =============================================================================
// 18.3 API Helpers
// =============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pages: number;
    perPage: number;
  };
}

export interface ListQuery {
  page?: number;
  limit?: number;
  sort?: Sort;
  filters?: Record<string, unknown>;
}

export interface Sort {
  field: string;
  order: 'asc' | 'desc';
}

export type IdempotencyKey = string;

// =============================================================================
// 18.4 Telemetry Event Map
// =============================================================================

export type TelemetryEvent =
  | { event: 'reops.inbox.filter_applied'; props: { filter_type: string; filter_value: string; result_count: number } }
  | { event: 'reops.inbox.view_saved'; props: { view_name: string; filter_count: number; is_default: boolean } }
  | { event: 'reops.inbox.bulk_assign'; props: { case_count: number; assignee_id: string; from_status: string[] } }
  | { event: 'reops.case.opened'; props: { case_id: string; department: Department } }
  | { event: 'reops.case.assigned'; props: { case_id: string; agent_id: string } }
  | { event: 'reops.case.status_changed'; props: { case_id: string; old_status: CaseStatus; new_status: CaseStatus } }
  | { event: 'reops.message.sent'; props: { case_id: string; is_internal: boolean; char_count: number } }
  | { event: 'reops.kb.article_viewed'; props: { article_id: string; source: string } }
  | { event: 'reops.kb.article_helpful'; props: { article_id: string; helpful: boolean } };

// =============================================================================
// 18.5 AI Schemas (stub - will be populated when AI features are implemented)
// =============================================================================

export interface AIClassifyResult {
  department: Department;
  priority: Priority;
  confidence: number;
}

export interface AIDraftResult {
  body: string;
  tone: 'formal' | 'casual' | 'empathetic';
  citations: string[];
}

// =============================================================================
// 18.6 i18n Keyspace (partial)
// =============================================================================

export type I18nKey =
  | 'inbox.title'
  | 'inbox.search.placeholder'
  | 'inbox.filter.department'
  | 'inbox.filter.status'
  | 'inbox.filter.priority'
  | 'case.status.open'
  | 'case.status.pending'
  | 'case.status.resolved'
  | 'case.priority.low'
  | 'case.priority.medium'
  | 'case.priority.high'
  | 'case.priority.urgent';

// =============================================================================
// 18.7 Versioning
// =============================================================================

export const TYPE_VERSION = '1.0.0';