/**
 * Inbox MSW Handlers
 * SPEC §9.10 - GET /api/inbox, bulk actions, merge/split
 */

import { http, HttpResponse, delay } from 'msw';
import { SEED_CASES } from './inbox-seed';
import type { InboxCase, InboxResponse } from '@/lib/inbox-schemas';

// Helper to match filters
function matchesFilters(c: InboxCase, filters: Record<string, any>): boolean {
  if (filters.dept && filters.dept !== 'All' && c.department !== filters.dept) return false;
  if (filters.status && filters.status !== 'All' && c.status !== filters.status) return false;
  if (filters.priority && filters.priority !== 'All' && c.priority !== filters.priority) return false;
  if (filters.slaRisk && filters.slaRisk !== 'All' && c.sla.riskLevel !== filters.slaRisk) return false;
  if (filters.channel && filters.channel !== 'All' && c.channel !== filters.channel) return false;
  if (filters.owner === 'me' && (!c.assignee || c.assignee.id !== 'agent-002')) return false; // Mock current user
  if (filters.owner === 'unassigned' && c.assignee !== null) return false;
  if (filters.tags && filters.tags.length > 0) {
    const hasTag = filters.tags.some((t: string) => c.tags.includes(t));
    if (!hasTag) return false;
  }
  if (filters.search && filters.search.length > 0) {
    const searchLower = filters.search.toLowerCase();
    const matchSubject = c.subject.toLowerCase().includes(searchLower);
    const matchTicket = c.ticketNumber.toLowerCase().includes(searchLower);
    const matchStudent = c.studentName.toLowerCase().includes(searchLower);
    if (!matchSubject && !matchTicket && !matchStudent) return false;
  }
  return true;
}

function sortCases(cases: InboxCase[], sort: string): InboxCase[] {
  const sorted = [...cases];
  if (sort === 'sla_asc') {
    sorted.sort((a, b) => a.sla.percentElapsed - b.sla.percentElapsed);
  } else if (sort === 'updated_desc') {
    sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } else if (sort === 'priority_desc') {
    const priorityMap = { Urgent: 4, High: 3, Normal: 2, Low: 1 };
    sorted.sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);
  }
  return sorted;
}

export const inboxHandlers = [
  // GET /api/inbox
  http.get('/api/inbox', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const filters = {
      dept: url.searchParams.get('dept') || 'All',
      status: url.searchParams.get('status') || 'Open',
      priority: url.searchParams.get('priority') || 'All',
      slaRisk: url.searchParams.get('slaRisk') || 'All',
      channel: url.searchParams.get('channel') || 'All',
      tags: url.searchParams.get('tags')?.split(',').filter(Boolean) || [],
      owner: url.searchParams.get('owner') || 'All',
      dateRange: url.searchParams.get('dateRange') || '7d',
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '50'),
      sort: url.searchParams.get('sort') || 'sla_asc',
      search: url.searchParams.get('search') || '',
    };

    let filtered = SEED_CASES.filter((c) => matchesFilters(c, filters));
    filtered = sortCases(filtered, filters.sort);

    const start = (filters.page - 1) * filters.limit;
    const end = start + filters.limit;
    const paginated = filtered.slice(start, end);

    const response: InboxResponse = {
      data: paginated,
      meta: {
        total: filtered.length,
        page: filters.page,
        pages: Math.ceil(filtered.length / filters.limit),
        perPage: filters.limit,
      },
    };

    console.log('[MSW] GET /api/inbox', { filters, resultCount: filtered.length });
    return HttpResponse.json(response);
  }),

  // POST /api/cases/bulk/assign
  http.post('/api/cases/bulk/assign', async ({ request }) => {
    await delay(200);
    const body = await request.json() as any;
    console.log('[MSW] Bulk assign', body);
    return HttpResponse.json({ success: true, updated: body.caseIds.length });
  }),

  // POST /api/cases/bulk/status
  http.post('/api/cases/bulk/status', async ({ request }) => {
    await delay(200);
    const body = await request.json() as any;
    console.log('[MSW] Bulk status change', body);
    return HttpResponse.json({ success: true, updated: body.caseIds.length });
  }),

  // POST /api/cases/bulk/priority
  http.post('/api/cases/bulk/priority', async ({ request }) => {
    await delay(200);
    const body = await request.json() as any;
    console.log('[MSW] Bulk priority change', body);
    return HttpResponse.json({ success: true, updated: body.caseIds.length });
  }),

  // POST /api/cases/bulk/tag
  http.post('/api/cases/bulk/tag', async ({ request }) => {
    await delay(200);
    const body = await request.json() as any;
    console.log('[MSW] Bulk tag', body);
    return HttpResponse.json({ success: true, updated: body.caseIds.length });
  }),

  // POST /api/cases/merge
  http.post('/api/cases/merge', async ({ request }) => {
    await delay(500);
    const body = await request.json() as any;
    console.log('[MSW] Merge cases', body);
    return HttpResponse.json({
      success: true,
      primaryCaseId: body.primaryCaseId,
      mergedCaseIds: body.mergeCaseIds,
      audit: {
        type: 'case.merged',
        timestamp: new Date().toISOString(),
      },
    });
  }),

  // POST /api/cases/merge/undo
  http.post('/api/cases/merge/undo', async ({ request }) => {
    await delay(300);
    const body = await request.json() as any;
    console.log('[MSW] Undo merge', body);
    return HttpResponse.json({
      success: true,
      restoredCaseIds: body.mergedCaseIds,
    });
  }),

  // POST /api/cases/split
  http.post('/api/cases/split', async ({ request }) => {
    await delay(400);
    const body = await request.json() as any;
    console.log('[MSW] Split thread', body);
    return HttpResponse.json({
      success: true,
      originalCaseId: body.caseId,
      newCaseId: `CASE-SPLIT-${Date.now()}`,
    });
  }),

  // GET /api/agents (for bulk assign modal)
  http.get('/api/agents', async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const dept = url.searchParams.get('department');

    const agents = [
      { id: 'agent-001', name: 'Sarah Johnson', department: 'Finance', currentLoad: 12 },
      { id: 'agent-002', name: 'David Lee', department: 'Admissions', currentLoad: 8 },
      { id: 'agent-003', name: 'Emily Chen', department: 'IT', currentLoad: 15 },
      { id: 'agent-004', name: 'Michael Brown', department: 'Registrar', currentLoad: 10 },
      { id: 'agent-005', name: 'Lisa Garcia', department: 'Housing', currentLoad: 7 },
    ];

    const filtered = dept ? agents.filter((a) => a.department === dept) : agents;
    return HttpResponse.json({ data: filtered });
  }),
];
