/**
 * Demo Mode API: GET /api/cases/[id]
 * Returns detailed case information including messages and timeline
 */

import { NextResponse } from 'next/server';
import { CASE_DETAILS } from '@/demo/fixtures/cases';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = CASE_DETAILS[params.id];
  if (!data) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }
  return NextResponse.json(data);
}