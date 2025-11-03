/**
 * Inbox and Case Management Types
 * Used by both demo fixtures and production API
 */

export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type Status = 'open' | 'pending' | 'snoozed' | 'closed';
export type SLAType = 'first_response' | 'resolution';

export interface Requester {
  id: string;
  name: string;
  email: string;
}

export interface CaseItem {
  id: string;
  subject: string;
  dept: string; // e.g., "Admissions", "Finance"
  status: Status;
  priority: Priority;
  sla: SLAType | null;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
  requester: Requester;
  tags?: string[];
}

export interface CaseMessage {
  id: string;
  caseId: string;
  author: { name: string; role: 'agent' | 'requester' | 'system' };
  body: string;
  createdAt: string;
}

export interface CaseAttachment {
  id: string;
  name: string;
  url: string;
}

export interface CaseDetail extends CaseItem {
  messages: CaseMessage[];
  attachments?: CaseAttachment[];
  timeline?: Array<{ ts: string; text: string }>;
}

export interface InboxListResponse {
  items: CaseItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface MergePreview {
  mergedId: string;
  sourceIds: string[];
  subject: string;
  combinedMessageCount: number;
  dedupedRequester: Requester;
}

export interface ReplyResult {
  ok: true;
  appended: CaseMessage;
}

export interface AnalyticsSummary {
  cards: Array<{ title: string; value: string }>;
  series: Array<{ key: string; points: Array<{ x: string; y: number }> }>;
}