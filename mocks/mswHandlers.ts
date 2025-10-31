// MSW Handlers for Public API Endpoints
// 50 records seeded per entity (see seed.ts)
// Examples shown below: first 5 of each

import { http, HttpResponse, delay } from 'msw';
import {
  kbArticles,
  catalogItems,
  requestTickets,
  announcements
} from './seed';

/**
 * GET /api/kb
 * Query params: q, category, dept, featured, page, limit
 * Returns: Paginated KB articles
 */
export const getKBArticlesHandler = http.get('/api/kb', async ({ request }) => {
  await delay(300); // Simulate network delay

  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.toLowerCase() || '';
  const category = url.searchParams.get('category')?.toLowerCase() || '';
  const dept = url.searchParams.get('dept') || '';
  const featured = url.searchParams.get('featured') === 'true';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  let filtered = kbArticles;

  if (query) {
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.summary.toLowerCase().includes(query) ||
        a.tags.some((t) => t.toLowerCase().includes(query))
    );
  }

  if (category) {
    filtered = filtered.filter((a) => a.category.toLowerCase() === category);
  }

  if (dept) {
    filtered = filtered.filter((a) => a.department === dept);
  }

  if (featured) {
    filtered = filtered.filter((a) => a.featured);
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginated = filtered.slice(start, end);

  return HttpResponse.json({
    data: paginated,
    meta: {
      total,
      page,
      pages: Math.ceil(total / limit),
      perPage: limit,
    },
  });
});

/**
 * GET /api/kb/:id
 * Returns: Single KB article
 */
export const getKBArticleHandler = http.get('/api/kb/:id', async ({ params }) => {
  await delay(200);

  const { id } = params;
  const article = kbArticles.find((a) => a.id === id || a.slug === id);

  if (!article) {
    return HttpResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Article not found' } },
      { status: 404 }
    );
  }

  return HttpResponse.json({ data: article });
});

/**
 * POST /api/kb/:id/feedback
 * Body: { helpful: boolean, comment?: string }
 * Returns: { success: boolean }
 */
export const submitArticleFeedbackHandler = http.post('/api/kb/:id/feedback', async ({ params, request }) => {
  await delay(150);

  const { id } = params;
  const body = await request.json();
  const { helpful } = body;

  // Update article in mock data
  const article = kbArticles.find((a) => a.id === id);
  if (article) {
    if (helpful) {
      article.helpfulCount += 1;
    } else {
      article.notHelpfulCount += 1;
    }
  }

  console.log(`[MSW] Article ${id} feedback: ${helpful ? 'helpful' : 'not helpful'}`);

  return HttpResponse.json({
    data: { success: true, message: 'Thank you for your feedback!' },
  });
});

/**
 * GET /api/catalog
 * Query params: dept
 * Returns: Catalog items (services)
 */
export const getCatalogHandler = http.get('/api/catalog', async ({ request }) => {
  await delay(250);

  const url = new URL(request.url);
  const dept = url.searchParams.get('dept');

  let filtered = catalogItems;

  if (dept) {
    filtered = filtered.filter((item) => item.department === dept);
  }

  // Only return active items
  filtered = filtered.filter((item) => item.active);

  return HttpResponse.json({ data: filtered });
});

/**
 * POST /api/request
 * Body: { serviceId, studentInfo, formData, attachments? }
 * Returns: RequestTicketPublic
 */
export const createRequestHandler = http.post('/api/request', async ({ request }) => {
  await delay(400);

  const body = await request.json();
  const { serviceId, studentInfo, formData } = body;

  const service = catalogItems.find((s) => s.id === serviceId);
  if (!service) {
    return HttpResponse.json(
      { error: { code: 'INVALID_SERVICE', message: 'Service not found' } },
      { status: 400 }
    );
  }

  const newTicket = {
    id: `req-${Date.now()}`,
    ticketNumber: `TKT-${new Date().getFullYear()}${String(requestTickets.length + 1).padStart(4, '0')}`,
    status: 'Submitted',
    department: service.department,
    serviceName: service.name,
    description: formData.description || formData.reason || 'New service request',
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publicNotes: [],
    canReopen: false,
  };

  requestTickets.push(newTicket);

  console.log(`[MSW] Created ticket: ${newTicket.ticketNumber}`, { studentInfo, formData });

  return HttpResponse.json({ data: newTicket }, { status: 201 });
});

/**
 * GET /api/request/:id
 * Query params: token (for anonymous access)
 * Returns: RequestTicketPublic
 */
export const getRequestHandler = http.get('/api/request/:id', async ({ params, request }) => {
  await delay(200);

  const { id } = params;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  // In real implementation, validate token
  // For demo, accept any token or no token

  const ticket = requestTickets.find((t) => t.id === id || t.ticketNumber === id);

  if (!ticket) {
    return HttpResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Request not found' } },
      { status: 404 }
    );
  }

  return HttpResponse.json({ data: ticket });
});

/**
 * PATCH /api/request/:id/reopen
 * Body: { reason: string }
 * Returns: RequestTicketPublic
 */
export const reopenRequestHandler = http.patch('/api/request/:id/reopen', async ({ params, request }) => {
  await delay(300);

  const { id } = params;
  const body = await request.json();
  const { reason } = body;

  const ticket = requestTickets.find((t) => t.id === id);

  if (!ticket) {
    return HttpResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Request not found' } },
      { status: 404 }
    );
  }

  if (!ticket.canReopen) {
    return HttpResponse.json(
      { error: { code: 'CANNOT_REOPEN', message: 'This request cannot be reopened' } },
      { status: 400 }
    );
  }

  ticket.status = 'In Progress';
  ticket.updatedAt = new Date().toISOString();
  ticket.publicNotes.push(`Ticket reopened by student: ${reason}`);
  ticket.canReopen = false;

  console.log(`[MSW] Reopened ticket: ${ticket.ticketNumber}`, { reason });

  return HttpResponse.json({ data: ticket });
});

/**
 * POST /api/chat/escalate
 * Body: ChatEscalationPayload
 * Returns: RequestTicketPublic
 */
export const escalateChatHandler = http.post('/api/chat/escalate', async ({ request }) => {
  await delay(350);

  const body = await request.json();
  const { context, department, serviceId, studentInfo, description } = body;

  const service = catalogItems.find((s) => s.id === serviceId);
  const serviceName = service ? service.name : 'General Inquiry';

  const newTicket = {
    id: `req-chat-${Date.now()}`,
    ticketNumber: `TKT-${new Date().getFullYear()}${String(requestTickets.length + 1).padStart(4, '0')}`,
    status: 'Submitted',
    department: department || 'Other',
    serviceName,
    description: `Escalated from chat: ${description}\n\nContext: ${context}`,
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publicNotes: [],
    canReopen: false,
  };

  requestTickets.push(newTicket);

  console.log(`[MSW] Escalated chat to ticket: ${newTicket.ticketNumber}`, { studentInfo });

  return HttpResponse.json({ data: newTicket }, { status: 201 });
});

/**
 * GET /api/announcements
 * Query params: limit
 * Returns: Announcement[]
 */
export const getAnnouncementsHandler = http.get('/api/announcements', async ({ request }) => {
  await delay(150);

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  // Filter active announcements (current date between startDate and endDate)
  const now = new Date();
  const active = announcements.filter(
    (a) => new Date(a.startDate) <= now && new Date(a.endDate) >= now
  );

  // Sort by priority (high -> medium -> low)
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  active.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  const limited = active.slice(0, limit);

  return HttpResponse.json({ data: limited });
});

// Export all handlers
export const handlers = [
  getKBArticlesHandler,
  getKBArticleHandler,
  submitArticleFeedbackHandler,
  getCatalogHandler,
  createRequestHandler,
  getRequestHandler,
  reopenRequestHandler,
  escalateChatHandler,
  getAnnouncementsHandler,
];

// Example output: First 5 KB articles from seed
console.log(`[MSW] Loaded ${kbArticles.length} KB articles. First 5:`);
console.log(kbArticles.slice(0, 5).map((a) => ({ id: a.id, title: a.title })));

// Example output: First 5 catalog items from seed
console.log(`[MSW] Loaded ${catalogItems.length} catalog items. First 5:`);
console.log(catalogItems.slice(0, 5).map((c) => ({ id: c.id, name: c.name, department: c.department })));

// Example output: First 5 request tickets from seed
console.log(`[MSW] Loaded ${requestTickets.length} request tickets. First 5:`);
console.log(requestTickets.slice(0, 5).map((t) => ({ ticketNumber: t.ticketNumber, status: t.status })));
