/**
 * Demo Mode API: GET /api/inbox
 * Returns filtered and paginated list of inbox cases
 * Transforms demo fixtures to match InboxCase schema expected by the UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { CASES } from '@/demo/fixtures/cases';
import { CaseItem } from '@/types/inbox';

// Map demo Priority to UI Priority (capitalized)
function mapPriority(p: string): 'Low' | 'Normal' | 'High' | 'Urgent' {
  const map: Record<string, 'Low' | 'Normal' | 'High' | 'Urgent'> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
  };
  return map[p] || 'Normal';
}

// Map demo Status to UI Status (capitalized)
function mapStatus(s: string): 'New' | 'Open' | 'Waiting' | 'Resolved' | 'Closed' {
  const map: Record<string, 'New' | 'Open' | 'Waiting' | 'Resolved' | 'Closed'> = {
    open: 'Open',
    pending: 'Waiting',
    snoozed: 'Waiting',
    closed: 'Closed',
  };
  return map[s] || 'Open';
}

// Calculate SLA risk based on creation time
function calculateSLARisk(createdAt: string): { riskLevel: 'green' | 'yellow' | 'red'; percentElapsed: number } {
  const created = new Date(createdAt);
  const now = new Date();
  const hoursSince = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

  if (hoursSince > 48) return { riskLevel: 'red', percentElapsed: 100 };
  if (hoursSince > 24) return { riskLevel: 'yellow', percentElapsed: 75 };
  return { riskLevel: 'green', percentElapsed: 30 };
}

function applyFilters(items: CaseItem[], params: URLSearchParams): CaseItem[] {
  let out = items.slice();

  const dept = params.get('dept');
  if (dept && dept !== 'All') out = out.filter((i) => i.dept === dept);

  const status = params.get('status');
  if (status && status !== 'All') out = out.filter((i) => mapStatus(i.status) === status);

  const priority = params.get('priority');
  if (priority && priority !== 'All') out = out.filter((i) => mapPriority(i.priority) === priority);

  const slaRisk = params.get('slaRisk');
  if (slaRisk && slaRisk !== 'All') {
    out = out.filter((i) => calculateSLARisk(i.createdAt).riskLevel === slaRisk);
  }

  const search = params.get('search');
  if (search) {
    const needle = search.toLowerCase();
    out = out.filter(
      (i) =>
        i.subject.toLowerCase().includes(needle) ||
        i.requester.name.toLowerCase().includes(needle) ||
        i.lastMessagePreview.toLowerCase().includes(needle)
    );
  }

  return out;
}

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '50');

  const filtered = applyFilters(CASES, searchParams);
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  // Transform demo CaseItem to InboxCase format
  const transformedData = items.map((item) => {
    const slaRisk = calculateSLARisk(item.createdAt);
    const firstResponseDue = new Date(new Date(item.createdAt).getTime() + 4 * 60 * 60 * 1000); // 4 hours
    const resolutionDue = new Date(new Date(item.createdAt).getTime() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      id: item.id,
      ticketNumber: item.id,
      department: item.dept,
      subject: item.subject,
      studentId: item.requester.id,
      studentName: item.requester.name,
      studentEmail: item.requester.email,
      priority: mapPriority(item.priority),
      status: mapStatus(item.status),
      channel: 'Email',
      sla: {
        firstResponseDueAt: firstResponseDue.toISOString(),
        resolutionDueAt: resolutionDue.toISOString(),
        riskLevel: slaRisk.riskLevel,
        breached: slaRisk.riskLevel === 'red',
        percentElapsed: slaRisk.percentElapsed,
      },
      assignee: null,
      tags: item.tags || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  const payload = {
    data: transformedData,
    meta: {
      total: filtered.length,
      page,
      pages: Math.ceil(filtered.length / limit),
      perPage: limit,
    },
  };

  return NextResponse.json(payload);
}