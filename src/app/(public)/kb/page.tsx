/**
 * Knowledge Base Browse Page
 * SPEC §5.2 - "/kb" route
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, X, Grid3x3, List } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  department: string;
  views: number;
  updatedAt: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'relevance' | 'date' | 'views';

export default function KnowledgeBasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const pageSize = 20;

  // Fetch articles
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (categoryFilter) params.set('category', categoryFilter);
      if (departmentFilter) params.set('department', departmentFilter);
      if (sortBy !== 'relevance') params.set('sort', sortBy);
      params.set('page', String(page));
      params.set('limit', String(pageSize));

      // Emit telemetry
      if (debouncedSearch) {
        console.log('[Telemetry] reops.public.kb_search', {
          query: debouncedSearch,
          category: categoryFilter,
          department: departmentFilter,
          sort: sortBy,
        });
      }

      try {
        const response = await fetch(`/api/kb?${params.toString()}`);
        const data = await response.json();

        setArticles(data.data || []);
        setTotalResults(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / pageSize));
      } catch (error) {
        console.error('Failed to fetch articles:', error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [debouncedSearch, categoryFilter, departmentFilter, sortBy, page]);

  // Update URL with search query
  useEffect(() => {
    if (debouncedSearch && debouncedSearch !== initialQuery) {
      const params = new URLSearchParams();
      params.set('q', debouncedSearch);
      router.push(`/kb?${params.toString()}`, { scroll: false });
    }
  }, [debouncedSearch]);

  const clearFilters = () => {
    setCategoryFilter('');
    setDepartmentFilter('');
    setSortBy('relevance');
    setPage(1);
  };

  const hasActiveFilters = categoryFilter || departmentFilter || sortBy !== 'relevance';

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalResults);

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('kb.title', 'en')}</h1>
        <p className="mt-2 text-muted-foreground">{t('kb.browse', 'en')}</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder={t('search.placeholder', 'en')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1); // Reset to first page on new search
            }}
            className="w-full rounded-lg border bg-background px-12 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={t('search.placeholder', 'en')}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters and View Controls */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={t('kb.filters.category', 'en')}
          >
            <option value="">{t('kb.filters.category', 'en')}: All</option>
            <option value="account">Account</option>
            <option value="registration">Registration</option>
            <option value="financial_aid">Financial Aid</option>
            <option value="technical">Technical</option>
            <option value="academic">Academic</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={t('kb.filters.department', 'en')}
          >
            <option value="">{t('kb.filters.department', 'en')}: All</option>
            <option value="admissions">Admissions</option>
            <option value="finance">Finance</option>
            <option value="registrar">Registrar</option>
            <option value="it_support">IT Support</option>
            <option value="student_affairs">Student Affairs</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as SortOption);
              setPage(1);
            }}
            className="rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Sort by"
          >
            <option value="relevance">{t('kb.sort.relevance', 'en')}</option>
            <option value="date">{t('kb.sort.date', 'en')}</option>
            <option value="views">{t('kb.sort.views', 'en')}</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <X className="h-4 w-4" />
              {t('kb.filters.clear', 'en')}
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 rounded-lg border p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'rounded p-2 transition-colors',
              viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
            aria-label="Grid view"
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'rounded p-2 transition-colors',
              viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Results Count */}
      {!loading && (
        <div className="mb-4 text-sm text-muted-foreground" role="status" aria-live="polite">
          {totalResults > 0 ? (
            t('search.results', 'en', { count: totalResults })
          ) : (
            t('search.noResults', 'en')
          )}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div
          className={cn(
            'grid gap-6',
            viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          )}
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg bg-muted"
              role="status"
            >
              <span className="sr-only">{t('common.loading', 'en')}</span>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        /* Empty State */
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">{t('search.noResults', 'en')}</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('kb.filters.clear', 'en')}
            </button>
          )}
        </div>
      ) : (
        /* Articles Grid/List */
        <>
          <div
            className={cn(
              'grid gap-6',
              viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}
          >
            {articles.map((article) => (
              <a
                key={article.id}
                href={`/kb/${article.id}`}
                className={cn(
                  'group rounded-lg border bg-card transition-all hover:border-primary hover:shadow-lg',
                  viewMode === 'grid' ? 'p-6' : 'flex gap-4 p-4'
                )}
              >
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded bg-muted px-2 py-0.5">{article.category}</span>
                    <span>•</span>
                    <span>{article.department}</span>
                  </div>
                  <h3 className="font-semibold group-hover:text-primary">{article.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {article.summary}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{t('article.views', 'en', { count: article.views })}</span>
                    <span>•</span>
                    <span>
                      {t('article.updated', 'en', {
                        date: new Date(article.updatedAt).toLocaleDateString(),
                      })}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <div className="text-sm text-muted-foreground">
                {t('kb.pagination.showing', 'en', {
                  start: startIndex,
                  end: endIndex,
                  total: totalResults,
                })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Previous page"
                >
                  {t('common.previous', 'en')}
                </button>
                <span className="px-4 text-sm text-muted-foreground">
                  {t('kb.pagination.page', 'en', { page, pages: totalPages })}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Next page"
                >
                  {t('common.next', 'en')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
