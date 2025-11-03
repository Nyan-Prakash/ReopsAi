/**
 * Knowledge Base Article Detail Page
 * SPEC §5.3 - "/kb/[id]" route
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChevronRight, ThumbsUp, ThumbsDown, ArrowRight, Home } from 'lucide-react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  department: string;
  views: number;
  updatedAt: string;
  relatedArticles?: Array<{
    id: string;
    title: string;
    summary: string;
  }>;
}

type FeedbackType = 'helpful' | 'not_helpful' | null;

export default function ArticleDetailPage() {
  const params = useParams();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch article
  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/kb/${articleId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError(t('error.notFound', 'en'));
          } else {
            setError(t('error.serverError', 'en'));
          }
          return;
        }

        const data = await response.json();
        setArticle(data.data);

        // Emit telemetry
        console.log('[Telemetry] reops.public.article_viewed', {
          articleId,
          title: data.data.title,
          category: data.data.category,
        });
      } catch (err) {
        console.error('Failed to fetch article:', err);
        setError(t('error.network', 'en'));
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  const handleFeedback = async (isHelpful: boolean) => {
    const feedbackType = isHelpful ? 'helpful' : 'not_helpful';
    setFeedback(feedbackType);

    try {
      // Submit feedback
      await fetch(`/api/kb/${articleId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful: isHelpful }),
      });

      // Emit telemetry
      console.log('[Telemetry] reops.public.article_feedback', {
        articleId,
        helpful: isHelpful,
      });

      setFeedbackSubmitted(true);

      // Hide thank you message after 3 seconds
      setTimeout(() => {
        setFeedbackSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="container py-8">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb skeleton */}
          <div className="mb-6 h-4 w-64 animate-pulse rounded bg-muted" />

          {/* Title skeleton */}
          <div className="mb-4 h-10 w-3/4 animate-pulse rounded bg-muted" />

          {/* Metadata skeleton */}
          <div className="mb-8 flex gap-4">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>

          {/* Content skeleton */}
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !article) {
    return (
      <div className="container py-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h2 className="mb-2 text-2xl font-bold">{error || t('error.notFound', 'en')}</h2>
          <p className="mb-6 text-muted-foreground">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <a
            href="/kb"
            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t('common.back', 'en')} to Knowledge Base
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <a href="/" className="hover:text-foreground">
            <Home className="h-4 w-4" />
            <span className="sr-only">{t('article.breadcrumb.home', 'en')}</span>
          </a>
          <ChevronRight className="h-4 w-4" />
          <a href="/kb" className="hover:text-foreground">
            {t('article.breadcrumb.kb', 'en')}
          </a>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{article.category}</span>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          <h1 className="mb-4 text-4xl font-bold">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="rounded bg-muted px-3 py-1">{article.category}</span>
            <span>{article.department}</span>
            <span>•</span>
            <span>{t('article.views', 'en', { count: article.views })}</span>
            <span>•</span>
            <span>
              {t('article.updated', 'en', {
                date: new Date(article.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
              })}
            </span>
          </div>
        </header>

        {/* Article Content */}
        <article
          className="prose prose-neutral max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Feedback Section */}
        <div className="mt-12 rounded-lg border bg-muted/40 p-8">
          <h2 className="mb-4 text-center text-lg font-semibold">
            {t('article.helpful.title', 'en')}
          </h2>

          {feedbackSubmitted ? (
            <div className="text-center text-sm text-muted-foreground">
              {t('article.helpful.thanks', 'en')}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleFeedback(true)}
                disabled={feedback !== null}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-6 py-3 font-medium transition-all',
                  feedback === 'helpful'
                    ? 'border-green-600 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
                    : 'hover:border-primary hover:bg-primary/5',
                  feedback !== null && feedback !== 'helpful' && 'opacity-50'
                )}
                aria-label={t('article.helpful.yes', 'en')}
              >
                <ThumbsUp className="h-5 w-5" />
                {t('article.helpful.yes', 'en')}
              </button>
              <button
                onClick={() => handleFeedback(false)}
                disabled={feedback !== null}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-6 py-3 font-medium transition-all',
                  feedback === 'not_helpful'
                    ? 'border-red-600 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                    : 'hover:border-primary hover:bg-primary/5',
                  feedback !== null && feedback !== 'not_helpful' && 'opacity-50'
                )}
                aria-label={t('article.helpful.no', 'en')}
              >
                <ThumbsDown className="h-5 w-5" />
                {t('article.helpful.no', 'en')}
              </button>
            </div>
          )}
        </div>

        {/* Still Need Help CTA */}
        <div className="mt-8 rounded-lg border bg-card p-8 text-center">
          <h3 className="mb-2 text-lg font-semibold">{t('article.stillNeedHelp', 'en')}</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Browse our service catalog to submit a request
          </p>
          <a
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t('article.contactSupport', 'en')}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Related Articles */}
        {article.relatedArticles && article.relatedArticles.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-semibold">{t('article.related.title', 'en')}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {article.relatedArticles.map((related) => (
                <a
                  key={related.id}
                  href={`/kb/${related.id}`}
                  className="group rounded-lg border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
                >
                  <h3 className="font-semibold group-hover:text-primary">{related.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {related.summary}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
