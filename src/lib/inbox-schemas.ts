/**
 * Inbox Schemas and Types
 * SPEC §9.2 - Filters, Saved Views, Zod validation
 */

import { z } from 'zod';
import type { Department, Priority, Channel } from '@/types';

// =============================================================================
// Zod Schemas
// =============================================================================

export const InboxFiltersSchema = z.object({
  dept: z.enum(['All', 'Admissions', 'Finance', 'Registrar', 'Housing', 'IT']).default('All'),
  status: z.enum(['All', 'New', 'Open', 'Waiting', 'Resolved', 'Closed']).default('All'),
  priority: z.enum(['All', 'Low', 'Normal', 'High', 'Urgent']).default('All'),
  slaRisk: z.enum(['All', 'green', 'yellow', 'red']).default('All'),
  channel: z.enum(['All', 'Chat', 'Email', 'Phone', 'Form', 'Walk-in']).default('All'),
  tags: z.array(z.string()).default([]),
  owner: z.union([z.enum(['All', 'me', 'unassigned']), z.string()]).default('All'),
  dateRange: z.enum(['7d', '30d', '90d', 'all']).default('7d'),
  page: z.number().int().positive().default(1),
  sort: z.enum(['sla_asc', 'updated_desc', 'priority_desc']).default('sla_asc'),
  search: z.string().default(''),
});

export type InboxFilters = z.infer<typeof InboxFiltersSchema>;

// Bulk action schemas
export const BulkAssignSchema = z.object({
  caseIds: z.array(z.string()).min(1),
  assigneeId: z.string(),
});

export const BulkStatusChangeSchema = z.object({
  caseIds: z.array(z.string()).min(1),
  status: z.enum(['New', 'Open', 'Waiting', 'Resolved', 'Closed']),
  reason: z.string().optional(), // Required for 'Waiting' status
});

export const BulkPriorityChangeSchema = z.object({
  caseIds: z.array(z.string()).min(1),
  priority: z.enum(['Low', 'Normal', 'High', 'Urgent']),
});

export const BulkTagSchema = z.object({
  caseIds: z.array(z.string()).min(1),
  tags: z.array(z.string()).min(1),
});

export const MergeCasesSchema = z.object({
  primaryCaseId: z.string(),
  mergeCaseIds: z.array(z.string()).min(1),
});

export const SplitThreadSchema = z.object({
  caseId: z.string(),
  messageIds: z.array(z.string()).min(1),
  department: z.string(),
  subject: z.string().optional(),
});

// =============================================================================
// TypeScript Types
// =============================================================================

export interface InboxCase {
  id: string;
  ticketNumber: string;
  department: string;
  subject: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  status: 'New' | 'Open' | 'Waiting' | 'Resolved' | 'Closed';
  channel: string;
  sla: {
    firstResponseDueAt: string;
    resolutionDueAt: string;
    riskLevel: 'green' | 'yellow' | 'red';
    breached: boolean;
    percentElapsed: number;
  };
  assignee: {
    id: string;
    name: string;
    avatarUrl?: string;
  } | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  mergedInto?: string | null;
  mergedCases?: string[];
}

export interface InboxResponse {
  data: InboxCase[];
  meta: {
    total: number;
    page: number;
    pages: number;
    perPage: number;
  };
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  department: string;
  avatarUrl?: string;
  currentLoad: number; // number of open cases
}

// Merge wizard state
export interface MergeWizardState {
  step: 1 | 2 | 3;
  selectedCases: InboxCase[];
  primaryCaseId: string | null;
  consolidatedTimeline: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  type: 'message' | 'status_change' | 'assignment' | 'note' | 'merge';
  timestamp: string;
  author?: string;
  content: string;
  fromCaseId?: string; // For merged messages
}
