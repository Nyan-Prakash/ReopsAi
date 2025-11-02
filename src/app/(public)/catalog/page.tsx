/**
 * Service Catalog Page
 * SPEC §5.4 - "/catalog" route
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, CheckCircle } from 'lucide-react';
import { t } from '@/lib/i18n';
import { StudentRequestSchema, type StudentRequestInput } from '@/lib/validators';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description: string;
  department: string;
  estimatedResponseTime: string;
  category: string;
}

type Department = 'all' | 'admissions' | 'finance' | 'registrar' | 'it_support' | 'student_affairs' | 'general';

export default function ServiceCatalogPage() {
  const router = useRouter();
  const [activeDept, setActiveDept] = useState<Department>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<StudentRequestInput>>({
    name: '',
    email: '',
    studentId: '',
    department: 'general',
    serviceId: '',
    description: '',
    consent: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);

      const params = new URLSearchParams();
      if (activeDept !== 'all') params.set('department', activeDept);
      if (searchQuery) params.set('q', searchQuery);

      try {
        const response = await fetch(`/api/catalog?${params.toString()}`);
        const data = await response.json();
        setServices(data.data || []);

        // Emit telemetry
        console.log('[Telemetry] reops.public.catalog_viewed', {
          department: activeDept,
          search: searchQuery,
        });
      } catch (error) {
        console.error('Failed to fetch services:', error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [activeDept, searchQuery]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setFormData((prev) => ({
      ...prev,
      serviceId: service.id,
      department: service.department as any,
    }));
    setShowRequestForm(true);

    // Emit telemetry
    console.log('[Telemetry] reops.public.service_selected', {
      serviceId: service.id,
      serviceName: service.name,
      department: service.department,
    });
  };

  const handleFormChange = (field: keyof StudentRequestInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);

    try {
      // Validate with Zod
      const validated = StudentRequestSchema.parse(formData);

      // Submit request
      const response = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      const data = await response.json();

      // Emit telemetry
      console.log('[Telemetry] reops.public.request_submitted', {
        serviceId: validated.serviceId,
        department: validated.department,
        ticketId: data.data.id,
      });

      // Redirect to request status page
      router.push(`/request/${data.data.id}?token=${data.data.token}`);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        // Extract Zod validation errors
        const errors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          errors[field] = err.message;
        });
        setFormErrors(errors);
      } else {
        console.error('Failed to submit request:', error);
        setFormErrors({ submit: t('error.unknown', 'en') });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const departments: Array<{ id: Department; label: string }> = [
    { id: 'all', label: 'All Departments' },
    { id: 'admissions', label: t('catalog.dept.admissions', 'en') },
    { id: 'finance', label: t('catalog.dept.finance', 'en') },
    { id: 'registrar', label: t('catalog.dept.registrar', 'en') },
    { id: 'it_support', label: t('catalog.dept.it', 'en') },
    { id: 'student_affairs', label: t('catalog.dept.student_affairs', 'en') },
    { id: 'general', label: t('catalog.dept.other', 'en') },
  ];

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('catalog.title', 'en')}</h1>
        <p className="mt-2 text-muted-foreground">{t('catalog.subtitle', 'en')}</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border bg-background px-12 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Department Tabs */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-2 border-b">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setActiveDept(dept.id)}
              className={cn(
                'whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeDept === dept.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {dept.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No services found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or browse a different department.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="flex flex-col rounded-lg border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
            >
              <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-muted px-2 py-0.5">{service.category}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {service.estimatedResponseTime}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">{service.name}</h3>
              <p className="mb-4 flex-1 text-sm text-muted-foreground">{service.description}</p>
              <button
                onClick={() => handleServiceSelect(service)}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t('catalog.service.request', 'en')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Request Form Modal */}
      {showRequestForm && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedService.name}</h2>
                <p className="text-sm text-muted-foreground">Complete the form to submit your request</p>
              </div>
              <button
                onClick={() => setShowRequestForm(false)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Consent */}
              <div>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.consent}
                    onChange={(e) => handleFormChange('consent', e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">
                    {t('form.consent', 'en')} <span className="text-red-500">*</span>
                  </span>
                </label>
                {formErrors.consent && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.consent}</p>
                )}
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
                  onClick={() => setShowRequestForm(false)}
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
