/**
 * Demo Mode API: GET /api/analytics
 * Returns dashboard analytics summary with cards and time-series data
 */

import { NextResponse } from 'next/server';
import { ANALYTICS } from '@/demo/fixtures/cases';

export function GET() {
  return NextResponse.json(ANALYTICS);
}