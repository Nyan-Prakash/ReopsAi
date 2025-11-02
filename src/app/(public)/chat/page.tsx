/**
 * Chat Assistant Stub Page
 * SPEC §5.6 - "/chat" route
 *
 * NOTE: Per SPEC, this is a stub implementation with NO bot logic.
 * Only the "Escalate to Ticket" functionality is active.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Ticket, X, CheckCircle } from 'lucide-react';
import { t } from '@/lib/i18n';
import { ChatEscalationSchema, type ChatEscalationInput } from '@/lib/validators';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const router = useRouter();
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [formData, setFormData] = useState<Partial<ChatEscalationInput>>({
    name: '',
    email: '',
    studentId: '',
    department: 'general',
    context: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleFormChange = (field: keyof ChatEscalationInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);

    try {
      // Validate with Zod
      const validated = ChatEscalationSchema.parse({
        ...formData,
        context: 'Escalated from chat assistant',
      });

      // Submit escalation
      const response = await fetch('/api/chat/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        throw new Error('Failed to escalate to ticket');
      }

      const data = await response.json();

      // Emit telemetry
      console.log('[Telemetry] reops.public.chat_escalated', {
        department: validated.department,
        ticketId: data.data.id,
      });

      // Redirect to request status page
      router.push(`/request/${data.data.id}?token=${data.data.token}`);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const errors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          errors[field] = err.message;
        });
        setFormErrors(errors);
      } else {
        console.error('Failed to escalate:', error);
        setFormErrors({ submit: t('error.unknown', 'en') });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">{t('chat.title', 'en')}</h1>
          <p className="mt-2 text-muted-foreground">{t('chat.disclaimer', 'en')}</p>
        </div>

        {/* Chat Interface (Disabled Stub) */}
        <div className="mb-8 rounded-lg border bg-card">
          {/* Chat Header */}
          <div className="border-b bg-muted/40 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-lg font-semibold">AI</span>
              </div>
              <div>
                <h2 className="font-semibold">ReOps Assistant</h2>
                <p className="text-xs text-muted-foreground">Available soon</p>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex h-[500px] flex-col items-center justify-center p-8 text-center">
            <div className="mb-6 rounded-full bg-muted p-8">
              <Send className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">{t('chat.comingSoon', 'en')}</h3>
            <p className="mb-8 max-w-md text-sm text-muted-foreground">
              Our AI-powered chat assistant is currently under development. In the meantime, you can
              browse our Knowledge Base, explore the Service Catalog, or create a ticket directly.
            </p>

            {/* Placeholder Messages */}
            <div className="w-full max-w-2xl space-y-4 opacity-50">
              {/* Bot Message */}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  AI
                </div>
                <div className="rounded-lg bg-muted px-4 py-3 text-left text-sm">
                  <p>Hello! I'm the ReOps Assistant. How can I help you today?</p>
                </div>
              </div>

              {/* User Message */}
              <div className="flex justify-end gap-3">
                <div className="rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground">
                  <p>I need help with my enrollment...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Input (Disabled) */}
          <div className="border-t bg-muted/20 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message... (Coming soon)"
                disabled
                className="flex-1 rounded-lg border bg-muted px-4 py-3 text-muted-foreground opacity-50"
              />
              <button
                disabled
                className="rounded-lg bg-muted px-6 py-3 text-muted-foreground opacity-50"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Escalate to Ticket CTA */}
        <div className="rounded-lg border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Ticket className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">Need Help Right Away?</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Create a support ticket and our team will get back to you as soon as possible.
          </p>
          <button
            onClick={() => setShowEscalateForm(true)}
            className="rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t('chat.escalate', 'en')}
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href="/kb"
            className="rounded-lg border bg-card p-6 transition-all hover:border-primary hover:shadow-md"
          >
            <h4 className="mb-2 font-semibold">Browse Knowledge Base</h4>
            <p className="text-sm text-muted-foreground">
              Find answers to common questions in our help articles
            </p>
          </a>
          <a
            href="/catalog"
            className="rounded-lg border bg-card p-6 transition-all hover:border-primary hover:shadow-md"
          >
            <h4 className="mb-2 font-semibold">View Service Catalog</h4>
            <p className="text-sm text-muted-foreground">
              Browse available services and submit requests
            </p>
          </a>
        </div>
      </div>

      {/* Escalation Form Modal */}
      {showEscalateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Create Support Ticket</h2>
                <p className="text-sm text-muted-foreground">
                  {t('chat.escalated', 'en')}
                </p>
              </div>
              <button
                onClick={() => setShowEscalateForm(false)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEscalate} className="space-y-6">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('form.name', 'en')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder={t('form.name.placeholder', 'en')}
                  className={cn(
                    'w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary',
                    formErrors.name && 'border-red-500'
                  )}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('form.email', 'en')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder={t('form.email.placeholder', 'en')}
                  className={cn(
                    'w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary',
                    formErrors.email && 'border-red-500'
                  )}
                />
                {formErrors.email && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>
                )}
              </div>

              {/* Student ID */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('form.studentId', 'en')} <span className="text-muted-foreground">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => handleFormChange('studentId', e.target.value)}
                  placeholder={t('form.studentId.placeholder', 'en')}
                  className={cn(
                    'w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary',
                    formErrors.studentId && 'border-red-500'
                  )}
                />
                {formErrors.studentId && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.studentId}</p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('form.department', 'en')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => handleFormChange('department', e.target.value)}
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="general">{t('catalog.dept.other', 'en')}</option>
                  <option value="admissions">{t('catalog.dept.admissions', 'en')}</option>
                  <option value="finance">{t('catalog.dept.finance', 'en')}</option>
                  <option value="registrar">{t('catalog.dept.registrar', 'en')}</option>
                  <option value="it_support">{t('catalog.dept.it', 'en')}</option>
                  <option value="student_affairs">{t('catalog.dept.student_affairs', 'en')}</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t('form.description', 'en')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder={t('form.description.placeholder', 'en')}
                  rows={6}
                  className={cn(
                    'w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary',
                    formErrors.description && 'border-red-500'
                  )}
                />
                <div className="mt-1 flex items-center justify-between text-xs">
                  {formErrors.description ? (
                    <p className="text-red-500">{formErrors.description}</p>
                  ) : (
                    <p className="text-muted-foreground">Minimum 10 characters</p>
                  )}
                  <p className="text-muted-foreground">{formData.description?.length || 0}/2000</p>
                </div>
              </div>

              {/* Submit Error */}
              {formErrors.submit && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950">
                  {formErrors.submit}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowEscalateForm(false)}
                  disabled={submitting}
                  className="flex-1 rounded-lg border px-4 py-3 font-medium hover:bg-muted disabled:opacity-50"
                >
                  {t('form.cancel', 'en')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t('form.submitting', 'en')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {t('form.submit', 'en')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
