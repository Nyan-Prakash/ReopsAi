import { http, HttpResponse } from 'msw';
import { allCases, first5Cases, generateCaseThread } from './seed-data';
import { Case, Department, CaseStatus, Priority, SLARisk, Paginated } from '@/types';

/**
 * MSW Handlers
 * Aligned with SPEC_MASTER.md §19, §20
 */

// Helper: Parse query params for inbox filtering
interface InboxFilters {
  department?: Department;
  status?: CaseStatus;
  priority?: Priority;
  slaRisk?: SLARisk;
  tags?: string[];
  assignee?: string;
  search?: string;
  page: number;
  limit: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
}

function parseInboxFilters(params: URLSearchParams): InboxFilters {
  return {
    department: params.get('department') as Department | undefined,
    status: params.get('status') as CaseStatus | undefined,
    priority: params.get('priority') as Priority | undefined,
    slaRisk: params.get('slaRisk') as SLARisk | undefined,
    tags: params.get('tags')?.split(',').filter(Boolean),
    assignee: params.get('assignee') || undefined,
    search: params.get('search') || undefined,
    page: parseInt(params.get('page') || '1', 10),
    limit: parseInt(params.get('limit') || '50', 10),
    sortField: params.get('sortField') || 'updatedAt',
    sortOrder: (params.get('sortOrder') as 'asc' | 'desc') || 'desc',
  };
}

// Helper: Filter cases based on criteria
function matchesFilters(filters: InboxFilters) {
  return (c: Case): boolean => {
    if (filters.department && c.department !== filters.department) return false;
    if (filters.status && c.status !== filters.status) return false;
    if (filters.priority && c.priority !== filters.priority) return false;
    if (filters.slaRisk && c.slaRisk !== filters.slaRisk) return false;
    if (filters.assignee && c.assignee?.id !== filters.assignee) return false;
    if (filters.tags && filters.tags.length > 0) {
      const hasAllTags = filters.tags.every((tag) => c.tags.includes(tag));
      if (!hasAllTags) return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSubject = c.subject.toLowerCase().includes(searchLower);
      const matchesTicket = c.ticketNumber.toLowerCase().includes(searchLower);
      const matchesStudent = c.studentName.toLowerCase().includes(searchLower);
      if (!matchesSubject && !matchesTicket && !matchesStudent) return false;
    }
    return true;
  };
}

// Helper: Sort cases
function sortCases(cases: Case[], field: string, order: 'asc' | 'desc'): Case[] {
  const sorted = [...cases].sort((a, b) => {
    let aVal: unknown = a[field as keyof Case];
    let bVal: unknown = b[field as keyof Case];

    // Handle nested assignee.name
    if (field === 'assignee') {
      aVal = a.assignee?.name || '';
      bVal = b.assignee?.name || '';
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  return sorted;
}

// Helper: Paginate results
function paginateResults<T>(items: T[], page: number, limit: number): T[] {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return items.slice(startIndex, endIndex);
}

// Mock KB articles (stub)
const mockArticles = [
  {
    id: 'kb-001',
    title: 'How to Set Up a Payment Plan',
    slug: 'payment-plan-setup',
    content: '<p>Payment plans allow you to pay your tuition in installments...</p>',
    summary: 'Learn how to set up a payment plan for your tuition balance.',
    category: 'Finance',
    department: 'finance' as Department,
    tags: ['payment', 'tuition', 'finance'],
    locale: 'en' as const,
    status: 'published' as const,
    authorId: 'author-001',
    createdAt: '2024-09-01T10:00:00Z',
    updatedAt: '2024-12-15T14:30:00Z',
    views: 1250,
    helpfulCount: 98,
    notHelpfulCount: 5,
  },
  {
    id: 'kb-002',
    title: 'How to Request a Transcript',
    slug: 'request-transcript',
    content: '<p>Official transcripts can be requested through the student portal...</p>',
    summary: 'Step-by-step guide to requesting your official transcript.',
    category: 'Registrar',
    department: 'registrar' as Department,
    tags: ['transcript', 'records', 'registrar'],
    locale: 'en' as const,
    status: 'published' as const,
    authorId: 'author-002',
    createdAt: '2024-08-15T09:00:00Z',
    updatedAt: '2024-11-20T11:15:00Z',
    views: 2100,
    helpfulCount: 145,
    notHelpfulCount: 8,
  },
  {
    id: 'kb-003',
    title: 'Reset Your Student Portal Password',
    slug: 'password-reset',
    content: '<p>If you cannot access your student portal account...</p>',
    summary: 'Instructions for resetting your student portal password.',
    category: 'IT Support',
    department: 'it_support' as Department,
    tags: ['password', 'portal', 'access', 'it'],
    locale: 'en' as const,
    status: 'published' as const,
    authorId: 'author-003',
    createdAt: '2024-07-10T08:00:00Z',
    updatedAt: '2025-01-05T13:00:00Z',
    views: 3400,
    helpfulCount: 210,
    notHelpfulCount: 12,
  },
];

// Mock catalog items (stub)
const mockCatalog = [
  {
    id: 'svc-001',
    name: 'Payment Plan Request',
    description: 'Request a payment plan for your outstanding tuition balance',
    department: 'finance' as Department,
    estimatedResponseTime: '1-2 business days',
    icon: '💳',
    active: true,
  },
  {
    id: 'svc-002',
    name: 'Transcript Request',
    description: 'Order official transcripts for universities or employers',
    department: 'registrar' as Department,
    estimatedResponseTime: '3-5 business days',
    icon: '📄',
    active: true,
  },
  {
    id: 'svc-003',
    name: 'Password Reset',
    description: 'Reset your student portal password',
    department: 'it_support' as Department,
    estimatedResponseTime: '1 business day',
    icon: '🔑',
    active: true,
  },
];

export const handlers = [
  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // GET /api/inbox - List cases with filters, sorting, pagination
  http.get('/api/inbox', ({ request }) => {
    const url = new URL(request.url);
    const filters = parseInboxFilters(url.searchParams);

    // Filter cases
    let filtered = allCases.filter(matchesFilters(filters));

    // Sort cases
    filtered = sortCases(filtered, filters.sortField, filters.sortOrder);

    // Paginate
    const paginated = paginateResults(filtered, filters.page, filters.limit);

    const response: Paginated<Case> = {
      data: paginated,
      meta: {
        total: filtered.length,
        page: filters.page,
        pages: Math.ceil(filtered.length / filters.limit),
        perPage: filters.limit,
      },
    };

    return HttpResponse.json(response);
  }),

  // GET /api/cases/:id - Get single case with full details
  http.get('/api/cases/:id', ({ params }) => {
    const { id } = params;
    const caseData = allCases.find((c) => c.id === id);

    if (!caseData) {
      return HttpResponse.json(
        {
          error: {
            code: 'CASE_NOT_FOUND',
            message: `Case with ID ${id} not found`,
          },
        },
        { status: 404 }
      );
    }

    // For first 5 cases, use the seed examples
    const first5Ids = first5Cases.map((c) => c.id);
    const detailedCase = first5Ids.includes(id as string)
      ? first5Cases.find((c) => c.id === id)
      : caseData;

    // Generate thread messages
    const messages = generateCaseThread(caseData.id, caseData.messageCount);

    return HttpResponse.json({
      data: {
        case: detailedCase,
        messages,
        timeline: [], // Stub for now
      },
    });
  }),

  // GET /api/kb - Search knowledge base
  http.get('/api/kb', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    const department = url.searchParams.get('department') as Department | null;
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    let filtered = mockArticles;

    // Filter by department
    if (department) {
      filtered = filtered.filter((a) => a.department === department);
    }

    // Filter by search
    if (search) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(search) ||
          a.summary.toLowerCase().includes(search) ||
          a.tags.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    // Paginate
    const paginated = paginateResults(filtered, page, limit);

    const response: Paginated<typeof mockArticles[0]> = {
      data: paginated,
      meta: {
        total: filtered.length,
        page,
        pages: Math.ceil(filtered.length / limit),
        perPage: limit,
      },
    };

    return HttpResponse.json(response);
  }),

  // GET /api/catalog - Get service catalog items
  http.get('/api/catalog', ({ request }) => {
    const url = new URL(request.url);
    const department = url.searchParams.get('department') as Department | null;

    let filtered = mockCatalog.filter((item) => item.active);

    // Filter by department
    if (department) {
      filtered = filtered.filter((item) => item.department === department);
    }

    return HttpResponse.json({
      data: filtered,
      meta: {
        total: filtered.length,
      },
    });
  }),
];