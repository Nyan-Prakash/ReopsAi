/**
 * Help Center Landing Page
 * SPEC §5.1 - "/" route
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useDebounce } from '@/hooks/use-debounce';

interface Article {
  id: string;
  title: string;
  summary: string;
  views: number;
}

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    // Fetch featured articles
    fetch('/api/kb?featured=true&limit=6')
      .then((res) => res.json())
      .then((data) => {
        setFeaturedArticles(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debouncedSearch) {
      // Emit telemetry event
      console.log('[Telemetry] reops.public.search', { query: debouncedSearch });
      router.push(`/kb?q=${encodeURIComponent(debouncedSearch)}`);
    }
  }, [debouncedSearch, router]);

  return (
    <div className="container py-12">
      {/* Hero Section */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {t('home.hero.title', 'en')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t('home.hero.subtitle', 'en')}
        </p>

        {/* Search Bar */}
        <div className="mt-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder={t('search.placeholder', 'en')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border bg-background px-12 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={t('search.placeholder', 'en')}
            />
          </div>
        </div>
      </div>

      {/* Featured Articles */}
      <div className="mt-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t('home.featured.title', 'en')}</h2>
          <a
            href="/kb"
            className="flex items-center text-sm font-medium text-primary hover:underline"
          >
            {t('common.viewAll', 'en')}
            <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" role="status">
                <span className="sr-only">{t('common.loading', 'en')}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredArticles.map((article) => (
              <a
                key={article.id}
                href={`/kb/${article.id}`}
                className="group rounded-lg border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
              >
                <h3 className="font-semibold group-hover:text-primary">{article.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {article.summary}
                </p>
                <div className="mt-4 text-xs text-muted-foreground">
                  {t('article.views', 'en', { count: article.views })}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="mt-16">
        <h2 className="mb-8 text-2xl font-semibold">{t('home.quickLinks.title', 'en')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/catalog"
            className="rounded-lg border bg-card p-6 transition-all hover:border-primary hover:shadow-md"
          >
            <h3 className="font-semibold">{t('catalog.title', 'en')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('catalog.subtitle', 'en')}</p>
          </a>
          <a
            href="/kb"
            className="rounded-lg border bg-card p-6 transition-all hover:border-primary hover:shadow-md"
          >
            <h3 className="font-semibold">{t('kb.title', 'en')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('kb.browse', 'en')}</p>
          </a>
          <a
            href="/chat"
            className="rounded-lg border bg-card p-6 transition-all hover:border-primary hover:shadow-md"
          >
            <h3 className="font-semibold">{t('chat.title', 'en')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('chat.disclaimer', 'en')}</p>
          </a>
        </div>
      </div>
    </div>
  );
}
