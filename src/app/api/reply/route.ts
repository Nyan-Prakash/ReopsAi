/**
 * Demo Mode API: POST /api/reply
 * Appends a new message to a case thread
 */

import { NextRequest, NextResponse } from 'next/server';
import { CASE_DETAILS, MESSAGES } from '@/demo/fixtures/cases';
import { ReplyResult } from '@/types/inbox';

export async function POST(req: NextRequest) {
  const { caseId, body } = await req.json();
  const detail = CASE_DETAILS[caseId];

  if (!detail) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const msg = {
    id: `MSG-${Math.random().toString(36).slice(2, 8)}`,
    caseId,
    author: { name: 'You', role: 'agent' as const },
    body: String(body ?? '').trim() || '(empty)',
    createdAt: new Date().toISOString(),
  };

  // Append to both the messages map and the case detail
  (MESSAGES[caseId] = MESSAGES[caseId] ?? []).push(msg);
  detail.messages.push(msg);

  const res: ReplyResult = { ok: true, appended: msg };
  return NextResponse.json(res);
}