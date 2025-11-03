/**
 * Request Status Tracking Page
 * SPEC §5.5 - "/request/[id]" route
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, Clock, AlertCircle, XCircle, FileText, User, Calendar } from 'lucide-react';
import { t } from '@/lib/i18n';
import { ReopenRequestSchema, type ReopenRequestInput } from '@/lib/validators';
import { cn } from '@/lib/utils';

interface RequestDetails {
  id: string;
  ticketNumber: string;
  status: 'submitted' | 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  name: string;
  email: string;
  studentId?: string;
  department: string;
  serviceName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  timeline: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  agentNotes?: string;
}

type RequestStatus = RequestDetails['status'];

export default function RequestStatusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const requestId = params.id as string;
  const token = searchParams.get('token');

  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenError, setReopenError] = useState('');
  const [reopening, setReopening] = useState(false);

  // Fetch request details
  useEffect(() => {
    const fetchRequest = async () => {
      setLoading(true);
      setError(null);

      if (!token) {
        setError('Access token is required. Please check your email for the status link.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/request/${requestId}?token=${token}`);

        if (!response.ok) {
          if (response.status === 401) {
            setError('Invalid or expired access token.');
          } else if (response.status === 404) {
            setError(t('error.notFound', 'en'));
          } else {
            setError(t('error.serverError', 'en'));
          }
          return;
        }

        const data = await response.json();
        setRequest(data.data);

        // Emit telemetry
        console.log('[Telemetry] reops.public.request_viewed', {
          requestId,
          status: data.data.status,
        });
      } catch (err) {
        console.error('Failed to fetch request:', err);
        setError(t('error.network', 'en'));
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId, token]);

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    setReopenError('');
    setReopening(true);

    try {
      // Validate
      const validated = ReopenRequestSchema.parse({ reason: reopenReason });

      const response = await fetch(`/api/request/${requestId}/reopen?token=${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to reopen request');
      }

      const data = await response.json();
      setRequest(data.data);
      setShowReopenForm(false);
      setReopenReason('');

      // Show success message (could use a toast notification)
      alert(t('request.reopen.success', 'en'));
    } catch (error: any) {
      if (error.name === 'ZodError') {
        setReopenError(error.errors[0]?.message || 'Invalid input');
      } else {
        setReopenError(error.message || t('error.unknown', 'en'));
      }
    } finally {
      setReopening(false);
    }
  };

  const canReopen = (): boolean => {
    if (!request || request.status !== 'resolved') return false;
    if (!request.resolvedAt) return false;

    const resolvedDate = new Date(request.resolvedAt);
    const daysSinceResolved = (Date.now() - resolvedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceResolved < 7;
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'submitted':
      case 'open':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'in_progress':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'closed':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: RequestStatus): string => {
    return t(`request.status.${status}` as any, 'en');
  };

  // Loading State
  if (loading) {
    return (
      <div className="container py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="space-y-6">
            <div className="h-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-96 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !request) {
    return (
      <div className="container py-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-2xl font-bold">{error || t('error.notFound', 'en')}</h2>
          <p className="mb-6 text-muted-foreground">
            Please check your email for the correct status link, or contact support if you need help.
          </p>
          <a
            href="/"
            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t('common.back', 'en')} to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">
            {t('request.ticketNumber', 'en', { number: request.ticketNumber })}
          </h1>
          <div className="flex items-center gap-3">
            {getStatusIcon(request.status)}
            <span className="text-lg font-medium">{getStatusLabel(request.status)}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-8 rounded-lg border bg-card p-6">
          <h2 className="mb-6 text-xl font-semibold">{t('request.timeline.title', 'en')}</h2>
          <div className="space-y-6">
            {request.timeline.map((event, index) => {
              const isLast = index === request.timeline.length - 1;
              const isCurrent = event.status === request.status;

              return (
                <div key={index} className="relative flex gap-4">
                  {/* Timeline line */}
                  {!isLast && (
                    <div
                      className={cn(
                        'absolute left-[11px] top-8 h-full w-0.5',
                        isCurrent ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      'relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2',
                      isCurrent
                        ? 'border-primary bg-primary'
                        : 'border-muted bg-background'
                    )}
                  >
                    {isCurrent && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between">
                      <h3
                        className={cn(
                          'font-medium',
                          isCurrent ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {getStatusLabel(event.status as RequestStatus)}
                      </h3>
                      <time className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    {event.note && (
                      <p className="mt-1 text-sm text-muted-foreground">{event.note}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Request Details */}
        <div className="mb-8 rounded-lg border bg-card p-6">
          <h2 className="mb-6 text-xl font-semibold">{t('request.details.title', 'en')}</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Information</p>
                <p className="mt-1 font-medium">{request.name}</p>
                <p className="text-sm text-muted-foreground">{request.email}</p>
                {request.studentId && (
                  <p className="text-sm text-muted-foreground">Student ID: {request.studentId}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Service</p>
                <p className="mt-1 font-medium">{request.serviceName}</p>
                <p className="text-sm text-muted-foreground">{request.department}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                <p className="mt-1">
                  {new Date(request.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{request.description}</p>
            </div>

            {request.agentNotes && (
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Agent Notes</p>
                <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                  {request.agentNotes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Reopen Button */}
        {canReopen() && !showReopenForm && (
          <div className="rounded-lg border bg-muted/40 p-6">
            <h3 className="mb-2 font-semibold">Need to reopen this request?</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              If your issue wasn't fully resolved, you can reopen this request within 7 days.
            </p>
            <button
              onClick={() => setShowReopenForm(true)}
              className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('request.reopen', 'en')}
            </button>
          </div>
        )}

        {/* Cannot Reopen Message */}
        {request.status === 'resolved' && !canReopen() && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {t('request.cannotReopen', 'en')}
            </p>
          </div>
        )}

        {/* Reopen Form */}
        {showReopenForm && (
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Reopen Request</h3>
            <form onSubmit={handleReopen} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Reason for reopening <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Please explain why you need to reopen this request..."
                  rows={4}
                  className={cn(
                    'w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary',
                    reopenError && 'border-red-500'
                  )}
                />
                {reopenError ? (
                  <p className="mt-1 text-xs text-red-500">{reopenError}</p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Minimum 10 characters</p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowReopenForm(false);
                    setReopenReason('');
                    setReopenError('');
                  }}
                  disabled={reopening}
                  className="flex-1 rounded-lg border px-4 py-2 font-medium hover:bg-muted disabled:opacity-50"
                >
                  {t('form.cancel', 'en')}
                </button>
                <button
                  type="submit"
                  disabled={reopening}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {reopening ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Reopening...
                    </>
                  ) : (
                    'Reopen Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
