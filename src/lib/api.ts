/**
 * Unified API abstraction for demo mode
 * Routes calls to local Next.js API routes in demo mode
 */

type HttpMethod = 'GET' | 'POST';

export async function api<T>(
  path: string,
  init?: { method?: HttpMethod; body?: unknown; signal?: AbortSignal }
): Promise<T> {
  const method = init?.method ?? 'GET';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const url = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    body: method === 'POST' ? JSON.stringify(init?.body ?? {}) : undefined,
    signal: init?.signal,
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`API ${method} ${url} failed: ${res.status}`);
  return (await res.json()) as T;
}