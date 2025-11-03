/**
 * Demo Mode API: POST /api/merge
 * Returns a preview of merging multiple cases
 */

import { NextRequest, NextResponse } from 'next/server';
import { CASE_DETAILS } from '@/demo/fixtures/cases';
import { MergePreview } from '@/types/inbox';

export async function POST(req: NextRequest) {
  const { sourceIds } = (await req.json()) as { sourceIds: string[] };
  const existing = sourceIds.map((id: string) => CASE_DETAILS[id]).filter(Boolean);

  if (!existing.length) {
    return NextResponse.json({ error: 'No valid source cases found' }, { status: 400 });
  }

  const mergedId = `CAS-MERGED-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const subject = existing.map((c) => c.subject).join(' / ');
  const combinedMessageCount = existing.reduce((n, c) => n + (c.messages?.length ?? 0), 0);
  const dedupedRequester =
    existing[0]?.requester ?? { id: 'U-x', name: 'Unknown', email: 'unknown@example.com' };

  const preview: MergePreview = {
    mergedId,
    sourceIds,
    subject,
    combinedMessageCount,
    dedupedRequester,
  };

  // In demo mode, we do not mutate fixtures; just return preview
  return NextResponse.json(preview);
}