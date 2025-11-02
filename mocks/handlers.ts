import { http, HttpResponse } from 'msw';

/**
 * MSW Handlers
 * Aligned with SPEC_MASTER.md §19, §20
 */
export const handlers = [
  // Placeholder handler - will be extended in future tasks
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];