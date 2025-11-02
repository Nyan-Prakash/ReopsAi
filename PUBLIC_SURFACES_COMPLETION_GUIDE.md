# Public Surfaces - Completion Guide

## Quick Start Checklist

When resuming this work, follow this order:

1. ✅ **Foundation (DONE)**
   - i18n system with EN/AR translations
   - Zod validation schemas
   - MSW handlers for 6 public endpoints
   - Public layout with language toggle
   - Home page with search
   - useDebounce hook

2. ⏳ **Next 5 Pages (TODO)**
   - [ ] `/kb` - Knowledge Base Browse
   - [ ] `/kb/[id]` - Article Detail
   - [ ] `/catalog` - Service Catalog
   - [ ] `/request/[id]` - Request Status
   - [ ] `/chat` - Chat Stub

3. ⏳ **Shared Components (TODO)**
   - [ ] ArticleCard
   - [ ] ServiceCard
   - [ ] RequestTimeline
   - [ ] RequestForm
   - [ ] EmptyState
   - [ ] LoadingSkeleton

4. ⏳ **Tests (TODO)**
   - [ ] Integration tests (RTL + MSW)
   - [ ] E2E tests (Playwright)

---

## File Templates

### 1. `/kb/page.tsx` - Knowledge Base Browse

```typescript
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDebounce } from '@/hooks/use-debounce';

export default function KnowledgeBasePage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [articles, setArticles] = useState([]);
  const [filters, setFilters] = useState({
    department: searchParams?.get('department') || '',
    category: searchParams?.get('category') || '',
  });
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      ...(debouncedQuery && { q: debouncedQuery }),
      ...(filters.department && { department: filters.department }),
      ...(filters.category && { category: filters.category }),
    });

    fetch(`/api/kb?${params}`)
      .then(res => res.json())
      .then(data => {
        setArticles(data.data || []);
        setLoading(false);
        // Telemetry
        console.log('[Telemetry] reops.public.kb_search', { query: debouncedQuery, resultCount: data.data?.length });
      })
      .catch(() => setLoading(false));
  }, [debouncedQuery, filters]);

  return (
    <div className="container py-8">
      {/* Search + Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder={t('search.placeholder', 'en')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border bg-background px-12 py-3"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="rounded-lg border bg-background px-4 py-2"
          >
            <option value="">{t('kb.filters.department', 'en')}</option>
            <option value="finance">{t('catalog.dept.finance', 'en')}</option>
            <option value="admissions">{t('catalog.dept.admissions', 'en')}</option>
            <option value="registrar">{t('catalog.dept.registrar', 'en')}</option>
            <option value="it_support">{t('catalog.dept.it', 'en')}</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="py-12 text-center" role="status">
          <p className="text-muted-foreground">{t('search.noResults', 'en')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article: any) => (
            <a
              key={article.id}
              href={`/kb/${article.id}`}
              className="rounded-lg border bg-card p-6 hover:border-primary hover:shadow-lg"
            >
              <h3 className="font-semibold">{article.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {article.summary}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. `/kb/[id]/page.tsx` - Article Detail

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ThumbsUp, ThumbsDown, Home, BookOpen } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function ArticlePage() {
  const params = useParams();
  const [article, setArticle] = useState<any>(null);
  const [feedback, setFeedback] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`/api/kb/${params?.id}`)
      .then(res => res.json())
      .then(data => setArticle(data.data));
  }, [params?.id]);

  const handleFeedback = async (helpful: boolean) => {
    setFeedback(helpful);
    await fetch(`/api/kb/${params?.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ helpful }),
    });
    // Telemetry
    console.log('[Telemetry] reops.public.article_feedback', { articleId: params?.id, helpful });
  };

  if (!article) return <div className="container py-8">{t('common.loading', 'en')}</div>;

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <a href="/" className="hover:text-primary"><Home className="h-4 w-4" /></a>
        <span>/</span>
        <a href="/kb" className="hover:text-primary">{t('nav.kb', 'en')}</a>
        <span>/</span>
        <span>{article.title}</span>
      </nav>

      {/* Article */}
      <article className="prose prose-lg max-w-none">
        <h1>{article.title}</h1>
        <div className="text-sm text-muted-foreground">
          {t('article.views', 'en', { count: article.views })} • {t('article.updated', 'en', { date: new Date(article.updatedAt).toLocaleDateString() })}
        </div>
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      </article>

      {/* Feedback */}
      <div className="mt-8 rounded-lg border bg-card p-6">
        <p className="mb-4 font-medium">{t('article.helpful.title', 'en')}</p>
        {feedback === null ? (
          <div className="flex gap-4">
            <button
              onClick={() => handleFeedback(true)}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-primary hover:text-primary-foreground"
            >
              <ThumbsUp className="h-4 w-4" />
              {t('article.helpful.yes', 'en')}
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-destructive hover:text-destructive-foreground"
            >
              <ThumbsDown className="h-4 w-4" />
              {t('article.helpful.no', 'en')}
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('article.helpful.thanks', 'en')}</p>
        )}
      </div>

      {/* Still Need Help */}
      <div className="mt-6 text-center">
        <p className="mb-2 text-sm text-muted-foreground">{t('article.stillNeedHelp', 'en')}</p>
        <a
          href="/catalog"
          className="inline-flex items-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t('article.contactSupport', 'en')}
        </a>
      </div>
    </div>
  );
}
```

### 3. `/catalog/page.tsx` - Service Catalog

```typescript
'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/i18n';
import { Department } from '@/types';

const DEPARTMENTS: Department[] = ['finance', 'admissions', 'registrar', 'it_support', 'student_affairs'];

export default function CatalogPage() {
  const [selectedDept, setSelectedDept] = useState<Department>('finance');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/catalog?department=${selectedDept}`)
      .then(res => res.json())
      .then(data => {
        setServices(data.data || []);
        setLoading(false);
      });
  }, [selectedDept]);

  return (
    <div className="container py-8">
      <h1 className="mb-2 text-3xl font-bold">{t('catalog.title', 'en')}</h1>
      <p className="mb-8 text-muted-foreground">{t('catalog.subtitle', 'en')}</p>

      {/* Department Tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto border-b">
        {DEPARTMENTS.map(dept => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-4 py-2 font-medium ${
              selectedDept === dept
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(`catalog.dept.${dept}`, 'en')}
          </button>
        ))}
      </div>

      {/* Services */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service: any) => (
            <div key={service.id} className="rounded-lg border bg-card p-6">
              <div className="mb-2 text-3xl">{service.icon}</div>
              <h3 className="mb-2 font-semibold">{service.name}</h3>
              <p className="mb-4 text-sm text-muted-foreground">{service.description}</p>
              <p className="mb-4 text-xs text-muted-foreground">
                {t('catalog.service.requestTime', 'en', { time: service.estimatedResponseTime })}
              </p>
              <a
                href={`/catalog/${service.id}/request`}
                className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t('catalog.service.request', 'en')}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4. `/request/[id]/page.tsx` - Request Status

```typescript
'use client';

import { useState, useEffect } from 'use';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function RequestStatusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const [request, setRequest] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/request/${params?.id}?token=${token}`)
      .then(res => res.json())
      .then(data => setRequest(data.data));
  }, [params?.id, token]);

  if (!request) return <div className="container py-8">{t('common.loading', 'en')}</div>;

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="mb-2 text-2xl font-bold">{t('request.title', 'en')}</h1>
      <p className="mb-8 text-muted-foreground">
        {t('request.ticketNumber', 'en', { number: request.ticketNumber })}
      </p>

      {/* Timeline */}
      <div className="mb-8 rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">{t('request.timeline.title', 'en')}</h2>
        <div className="space-y-4">
          {request.timeline.map((event: any, idx: number) => (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                {idx < request.timeline.length - 1 && (
                  <div className="w-px flex-1 bg-border" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{event.message}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">{t('request.details.title', 'en')}</h2>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium">Status</dt>
            <dd className="text-muted-foreground">{request.status}</dd>
          </div>
          <div>
            <dt className="font-medium">Department</dt>
            <dd className="text-muted-foreground">{request.department}</dd>
          </div>
          <div>
            <dt className="font-medium">Description</dt>
            <dd className="text-muted-foreground">{request.description}</dd>
          </div>
        </dl>

        {/* Reopen Button */}
        {request.canReopen && (
          <button className="mt-6 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground">
            {t('request.reopen', 'en')}
          </button>
        )}
      </div>
    </div>
  );
}
```

### 5. `/chat/page.tsx` - Chat Stub

```typescript
'use client';

import { MessageCircle } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function ChatPage() {
  const handleEscalate = () => {
    // Redirect to catalog with pre-filled context
    window.location.href = '/catalog?context=chat_escalation';
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="rounded-lg border bg-card p-8 text-center">
        <MessageCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold">{t('chat.title', 'en')}</h1>
        <p className="mb-4 text-muted-foreground">{t('chat.comingSoon', 'en')}</p>
        <p className="mb-8 text-sm text-muted-foreground">{t('chat.disclaimer', 'en')}</p>

        <button
          onClick={handleEscalate}
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t('chat.escalate', 'en')}
        </button>
      </div>
    </div>
  );
}
```

---

## Integration Test Template

Create `src/app/(public)/public-surfaces.integration.test.tsx`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/mocks/server';
import HomePage from './page';
import KnowledgeBasePage from './kb/page';

describe('Public Surfaces Integration', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('search debounces 300ms', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const searchInput = screen.getByPlaceholderText(/search for help/i);
    await user.type(searchInput, 'payment');

    // Should not trigger immediately
    expect(window.location.href).not.toContain('payment');

    // Should trigger after 300ms
    await waitFor(() => {
      expect(window.location.href).toContain('payment');
    }, { timeout: 500 });
  });

  it('helpful vote fires telemetry', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    render(<ArticlePage params={{ id: 'kb-001' }} />);

    await waitFor(() => screen.getByText(/was this helpful/i));

    const yesButton = screen.getByRole('button', { name: /yes/i });
    fireEvent.click(yesButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('reops.public.article_feedback'),
        expect.objectContaining({ articleId: 'kb-001', helpful: true })
      );
    });
  });

  // Add more tests...
});
```

---

## E2E Test Template

Create `e2e/public-surfaces.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Public Surfaces E2E', () => {
  test('full flow: search → article → catalog → submit', async ({ page }) => {
    // 1. Land on home
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /how can we help/i })).toBeVisible();

    // 2. Search
    const searchInput = page.getByPlaceholder(/search for help/i);
    await searchInput.fill('payment');
    await page.waitForURL(/\/kb\?q=payment/);

    // 3. Click article
    await page.getByRole('link', { name: /payment plan/i }).first().click();
    await expect(page.getByRole('heading', { name: /payment plan/i })).toBeVisible();

    // 4. Navigate to catalog
    await page.getByRole('link', { name: /contact support/i }).click();
    await expect(page).toHaveURL('/catalog');

    // 5. Submit request (stub validation)
    await page.getByRole('button', { name: /finance/i }).click();
    await page.getByRole('link', { name: /submit request/i }).first().click();

    // Form should be visible
    await expect(page.getByLabel(/full name/i)).toBeVisible();
  });

  test('AR locale: RTL mirrored', async ({ page }) => {
    await page.goto('/');

    // Toggle to Arabic
    await page.getByRole('button', { name: /العربية/i }).click();

    // Check dir="rtl"
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Check Arabic text
    await expect(page.getByText(/كيف يمكننا مساعدتك/i)).toBeVisible();
  });
});
```

---

## Telemetry Events Checklist

Add these console.log calls throughout:

- `reops.public.search` - On search submit
- `reops.public.kb_search` - On KB search
- `reops.public.article_viewed` - On article page load
- `reops.public.article_feedback` - On helpful/not-helpful click
- `reops.public.catalog_viewed` - On catalog page load
- `reops.public.service_selected` - On service card click
- `reops.public.request_submitted` - On form submit
- `reops.public.request_viewed` - On status page load
- `reops.public.chat_escalated` - On escalate button click

---

## Estimated Time to Complete

- **Pages** (5 × 2h): ~10 hours
- **Shared Components**: ~4 hours
- **Integration Tests**: ~3 hours
- **E2E Tests**: ~2 hours
- **Telemetry**: ~1 hour
- **QA + Fixes**: ~3 hours

**Total**: ~23 hours

---

## Dependencies Still Needed

Check if these exist, if not install:

```bash
npm install @testing-library/user-event --save-dev
npm install clsx --save  # For className merging
```

---

## Notes for RTL Support

In `src/app/(public)/layout.tsx`, the locale state is client-side only. For production, consider:

1. Cookie-based persistence
2. Next.js middleware for locale routing
3. Server-side locale detection

---

## Final Checklist Before Marking Complete

- [ ] All 5 pages render without errors
- [ ] EN ↔ AR toggle works on all pages
- [ ] Search debounce works (300ms)
- [ ] All forms validate with Zod
- [ ] MSW handlers return realistic data
- [ ] Telemetry events fire on all interactions
- [ ] Integration tests pass (>80% coverage)
- [ ] E2E tests pass in Chrome, Firefox, Safari
- [ ] Axe accessibility audit passes (0 violations)
- [ ] Mobile responsive (<768px tested)
- [ ] RTL layout correct in AR locale

---

## Success Criteria (SPEC §5.6)

When all checkboxes in PUBLIC_SURFACES_IMPLEMENTATION.md AC section are checked, task is complete.
