/**
 * Public Surfaces Integration Tests
 * Tests all public-facing pages with RTL + MSW
 * SPEC §5.6 - Integration test requirements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

// Import pages
import HomePage from './page';
import KnowledgeBasePage from './kb/page';
import ArticleDetailPage from './kb/[id]/page';
import ServiceCatalogPage from './catalog/page';
import RequestStatusPage from './request/[id]/page';
import ChatPage from './chat/page';

// Mock Next.js router
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({
    id: 'kb-001',
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/',
}));

describe('Public Surfaces Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.set('token', 'test-token-123');
  });

  /**
   * Test 1: Search debounce (300ms)
   * Requirement: Search input should debounce for 300ms before making API call
   */
  describe('Search Debounce', () => {
    it('should debounce search input for 300ms on home page', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'log');

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/search for help/i);

      // Type quickly (should not trigger immediate searches)
      await user.type(searchInput, 'enrollment');

      // Should not have navigated yet (debounce in progress)
      expect(mockPush).not.toHaveBeenCalled();

      // Wait for debounce (300ms)
      await waitFor(
        () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            '[Telemetry] reops.public.search',
            expect.objectContaining({ query: 'enrollment' })
          );
        },
        { timeout: 500 }
      );

      // Should redirect to KB page with query
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/kb?q=enrollment');
      });

      consoleSpy.mockRestore();
    });

    it('should debounce search on KB page', async () => {
      const user = userEvent.setup();

      // Mock KB API response
      server.use(
        http.get('/api/kb', () => {
          return HttpResponse.json({
            data: [
              {
                id: 'kb-001',
                title: 'How to Enroll',
                summary: 'Enrollment guide',
                category: 'registration',
                department: 'registrar',
                views: 1250,
                updatedAt: '2025-01-15T10:00:00Z',
              },
            ],
            total: 1,
          });
        })
      );

      render(<KnowledgeBasePage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search for help/i);

      // Type quickly
      await user.type(searchInput, 'payment');

      // Wait for debounce
      await waitFor(
        () => {
          expect(screen.getByText(/1 results found/i)).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });
  });

  /**
   * Test 2: Helpful vote fires telemetry
   * Requirement: Article feedback should emit analytics event
   */
  describe('Article Feedback', () => {
    it('should emit telemetry event when helpful vote is clicked', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'log');

      // Mock article API
      server.use(
        http.get('/api/kb/:id', () => {
          return HttpResponse.json({
            data: {
              id: 'kb-001',
              title: 'How to Reset Your Password',
              content: '<p>Follow these steps to reset your password...</p>',
              category: 'account',
              department: 'it_support',
              views: 5420,
              updatedAt: '2025-01-20T10:00:00Z',
              relatedArticles: [],
            },
          });
        }),
        http.post('/api/kb/:id/feedback', () => {
          return HttpResponse.json({ data: { success: true } });
        })
      );

      render(<ArticleDetailPage />);

      // Wait for article to load
      await waitFor(() => {
        expect(screen.getByText(/How to Reset Your Password/i)).toBeInTheDocument();
      });

      // Click "Yes" helpful button
      const yesButton = screen.getByRole('button', { name: /yes/i });
      await user.click(yesButton);

      // Should emit telemetry
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[Telemetry] reops.public.article_feedback',
          expect.objectContaining({
            articleId: 'kb-001',
            helpful: true,
          })
        );
      });

      // Should show thank you message
      expect(screen.getByText(/thank you for your feedback/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should emit telemetry for not helpful vote', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'log');

      server.use(
        http.get('/api/kb/:id', () => {
          return HttpResponse.json({
            data: {
              id: 'kb-001',
              title: 'Test Article',
              content: '<p>Content</p>',
              category: 'test',
              department: 'general',
              views: 100,
              updatedAt: '2025-01-01T10:00:00Z',
            },
          });
        }),
        http.post('/api/kb/:id/feedback', () => {
          return HttpResponse.json({ data: { success: true } });
        })
      );

      render(<ArticleDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Test Article/i)).toBeInTheDocument();
      });

      const noButton = screen.getByRole('button', { name: /no/i });
      await user.click(noButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[Telemetry] reops.public.article_feedback',
          expect.objectContaining({
            articleId: 'kb-001',
            helpful: false,
          })
        );
      });

      consoleSpy.mockRestore();
    });
  });

  /**
   * Test 3: Catalog filters update results
   * Requirement: Department/category filters should update results without page reload
   */
  describe('Catalog Filters', () => {
    it('should update results when department filter changes', async () => {
      const user = userEvent.setup();

      let requestedDept = '';

      server.use(
        http.get('/api/catalog', ({ request }) => {
          const url = new URL(request.url);
          requestedDept = url.searchParams.get('department') || 'all';

          const services =
            requestedDept === 'finance'
              ? [
                  {
                    id: 'srv-finance-001',
                    name: 'Tuition Payment',
                    description: 'Pay your tuition fees',
                    department: 'finance',
                    category: 'payment',
                    estimatedResponseTime: '1-2 days',
                  },
                ]
              : [
                  {
                    id: 'srv-it-001',
                    name: 'Password Reset',
                    description: 'Reset your account password',
                    department: 'it_support',
                    category: 'account',
                    estimatedResponseTime: '1 hour',
                  },
                ];

          return HttpResponse.json({ data: services });
        })
      );

      render(<ServiceCatalogPage />);

      await waitFor(() => {
        expect(screen.getByText(/Password Reset/i)).toBeInTheDocument();
      });

      // Change to Finance department
      const financeTab = screen.getByRole('button', { name: /finance/i });
      await user.click(financeTab);

      // Should show finance services
      await waitFor(() => {
        expect(screen.getByText(/Tuition Payment/i)).toBeInTheDocument();
        expect(screen.queryByText(/Password Reset/i)).not.toBeInTheDocument();
      });

      expect(requestedDept).toBe('finance');
    });
  });

  /**
   * Test 4: Request form validation (Zod)
   * Requirement: Form should validate using Zod schema and show inline errors
   */
  describe('Request Form Validation', () => {
    it('should validate form fields with Zod schema', async () => {
      const user = userEvent.setup();

      server.use(
        http.get('/api/catalog', () => {
          return HttpResponse.json({
            data: [
              {
                id: 'srv-001',
                name: 'Test Service',
                description: 'Test',
                department: 'general',
                category: 'test',
                estimatedResponseTime: '1 day',
              },
            ],
          });
        })
      );

      render(<ServiceCatalogPage />);

      await waitFor(() => {
        expect(screen.getByText(/Test Service/i)).toBeInTheDocument();
      });

      // Click service to open form
      const requestButton = screen.getByRole('button', { name: /submit request/i });
      await user.click(requestButton);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
      });

      // Try to submit empty form
      const submitButton = screen.getAllByRole('button', { name: /submit request/i })[1];
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
        expect(screen.getByText(/description must be at least 10 characters/i)).toBeInTheDocument();
      });

      // Fill in valid data
      const nameInput = screen.getByPlaceholderText(/enter your full name/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const descInput = screen.getByPlaceholderText(/please describe your request/i);

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(descInput, 'I need help with my enrollment process');

      // Accept consent
      const consentCheckbox = screen.getByRole('checkbox');
      await user.click(consentCheckbox);

      // Errors should clear
      await waitFor(() => {
        expect(screen.queryByText(/name must be at least 2 characters/i)).not.toBeInTheDocument();
      });
    });

    it('should validate student ID format', async () => {
      const user = userEvent.setup();

      server.use(
        http.get('/api/catalog', () => {
          return HttpResponse.json({
            data: [
              {
                id: 'srv-001',
                name: 'Test Service',
                description: 'Test',
                department: 'general',
                category: 'test',
                estimatedResponseTime: '1 day',
              },
            ],
          });
        })
      );

      render(<ServiceCatalogPage />);

      await waitFor(() => {
        expect(screen.getByText(/Test Service/i)).toBeInTheDocument();
      });

      const requestButton = screen.getByRole('button', { name: /submit request/i });
      await user.click(requestButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
      });

      // Enter invalid student ID
      const studentIdInput = screen.getByPlaceholderText(/S2024-0001/i);
      await user.type(studentIdInput, 'INVALID');

      const nameInput = screen.getByPlaceholderText(/enter your full name/i);
      await user.type(nameInput, 'Test');

      // Submit to trigger validation
      const submitButton = screen.getAllByRole('button', { name: /submit request/i })[1];
      await user.click(submitButton);

      // Should show student ID format error
      await waitFor(() => {
        expect(screen.getByText(/format: S2024-0001/i)).toBeInTheDocument();
      });
    });
  });

  /**
   * Test 5: Reopen button visible if resolved <7 days
   * Requirement: Reopen button should only appear for requests resolved within 7 days
   */
  describe('Request Reopen', () => {
    it('should show reopen button for recently resolved requests', async () => {
      const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago

      server.use(
        http.get('/api/request/:id', () => {
          return HttpResponse.json({
            data: {
              id: 'req-001',
              ticketNumber: 'TKT-12345678',
              status: 'resolved',
              name: 'John Doe',
              email: 'john@example.com',
              department: 'finance',
              serviceName: 'Tuition Payment',
              description: 'Need help with payment',
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: recentDate,
              resolvedAt: recentDate,
              timeline: [
                { status: 'submitted', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
                { status: 'resolved', timestamp: recentDate },
              ],
            },
          });
        })
      );

      render(<RequestStatusPage />);

      await waitFor(() => {
        expect(screen.getByText(/TKT-12345678/i)).toBeInTheDocument();
      });

      // Should show reopen button
      expect(screen.getByRole('button', { name: /reopen request/i })).toBeInTheDocument();
    });

    it('should NOT show reopen button for old resolved requests', async () => {
      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago

      server.use(
        http.get('/api/request/:id', () => {
          return HttpResponse.json({
            data: {
              id: 'req-002',
              ticketNumber: 'TKT-87654321',
              status: 'resolved',
              name: 'Jane Smith',
              email: 'jane@example.com',
              department: 'it_support',
              serviceName: 'Password Reset',
              description: 'Cannot login',
              createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: oldDate,
              resolvedAt: oldDate,
              timeline: [
                { status: 'submitted', timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
                { status: 'resolved', timestamp: oldDate },
              ],
            },
          });
        })
      );

      render(<RequestStatusPage />);

      await waitFor(() => {
        expect(screen.getByText(/TKT-87654321/i)).toBeInTheDocument();
      });

      // Should show "cannot reopen" message instead
      expect(screen.queryByRole('button', { name: /reopen request/i })).not.toBeInTheDocument();
      expect(screen.getByText(/cannot be reopened.*more than 7 days/i)).toBeInTheDocument();
    });
  });

  /**
   * Test 6: Chat → escalate → request flow
   * Requirement: Chat page should allow escalation to ticket creation
   */
  describe('Chat Escalation', () => {
    it('should escalate chat to ticket with pre-filled context', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'log');

      server.use(
        http.post('/api/chat/escalate', async ({ request }) => {
          const body = (await request.json()) as any;

          return HttpResponse.json({
            data: {
              id: 'req-chat-001',
              ticketNumber: 'TKT-99887766',
              token: 'tok-escalated-123',
              status: 'submitted',
              createdAt: new Date().toISOString(),
            },
          });
        })
      );

      render(<ChatPage />);

      // Click escalate button
      const escalateButton = screen.getByRole('button', { name: /create ticket instead/i });
      await user.click(escalateButton);

      // Modal should open
      await waitFor(() => {
        expect(screen.getByText(/create support ticket/i)).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByPlaceholderText(/enter your full name/i);
      const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
      const descInput = screen.getByPlaceholderText(/please describe your request/i);

      await user.type(nameInput, 'Alice Johnson');
      await user.type(emailInput, 'alice@example.com');
      await user.type(descInput, 'I was chatting but need urgent help with registration');

      // Submit
      const submitButton = screen.getByRole('button', { name: /submit request/i });
      await user.click(submitButton);

      // Should emit telemetry
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[Telemetry] reops.public.chat_escalated',
          expect.objectContaining({
            ticketId: 'req-chat-001',
          })
        );
      });

      // Should redirect to request status
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/request/req-chat-001?token=tok-escalated-123');
      });

      consoleSpy.mockRestore();
    });
  });

  /**
   * Additional: Error states and loading states
   */
  describe('Error and Loading States', () => {
    it('should show loading skeleton on KB page', () => {
      render(<KnowledgeBasePage />);

      // Should show loading skeletons
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show error state when article not found', async () => {
      server.use(
        http.get('/api/kb/:id', () => {
          return HttpResponse.json(
            { error: { code: 'ARTICLE_NOT_FOUND', message: 'Not found' } },
            { status: 404 }
          );
        })
      );

      render(<ArticleDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/doesn't exist or has been removed/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no services match filter', async () => {
      server.use(
        http.get('/api/catalog', () => {
          return HttpResponse.json({ data: [] });
        })
      );

      render(<ServiceCatalogPage />);

      await waitFor(() => {
        expect(screen.getByText(/no services found/i)).toBeInTheDocument();
      });
    });
  });
});
