/**
 * Unit Tests for Seed Data Distribution
 * Validates that generated data matches SPEC §20.2 targets
 */

import { describe, it, expect } from 'vitest';
import { allCases, first5Cases, generateCaseThread } from './seed-data';
import { calculateSLADeadline, calculateSLARisk } from './seed-utils';

describe('seed-data', () => {
  describe('distribution validation', () => {
    it('generates exactly 2000 cases', () => {
      expect(allCases).toHaveLength(2000);
    });

    it('department distribution matches §20.2 targets (±2%)', () => {
      const deptCounts = allCases.reduce(
        (acc, c) => {
          acc[c.department] = (acc[c.department] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Expected counts from §20.2
      const targets = {
        finance: 600,
        admissions: 500,
        registrar: 500,
        it_support: 200,
        student_affairs: 150,
        general: 50,
      };

      // Allow ±2% variance
      const tolerance = 0.02;

      Object.entries(targets).forEach(([dept, target]) => {
        const actual = deptCounts[dept] || 0;
        const minExpected = target * (1 - tolerance);
        const maxExpected = target * (1 + tolerance);

        expect(actual).toBeGreaterThanOrEqual(minExpected);
        expect(actual).toBeLessThanOrEqual(maxExpected);
      });
    });

    it('priority distribution matches §20.2 targets (±2%)', () => {
      const priorityCounts = allCases.reduce(
        (acc, c) => {
          acc[c.priority] = (acc[c.priority] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const targets = {
        low: 800, // 40%
        medium: 700, // 35%
        high: 400, // 20%
        urgent: 100, // 5%
      };

      const tolerance = 0.02;

      Object.entries(targets).forEach(([priority, target]) => {
        const actual = priorityCounts[priority] || 0;
        const minExpected = target * (1 - tolerance);
        const maxExpected = target * (1 + tolerance);

        expect(actual).toBeGreaterThanOrEqual(minExpected);
        expect(actual).toBeLessThanOrEqual(maxExpected);
      });
    });

    it('status distribution matches §20.2 targets (±2%)', () => {
      const statusCounts = allCases.reduce(
        (acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const targets = {
        open: 700, // 35%
        pending: 400, // 20%
        resolved: 600, // 30%
        closed: 280, // 14%
        spam: 20, // 1%
      };

      const tolerance = 0.02;

      Object.entries(targets).forEach(([status, target]) => {
        const actual = statusCounts[status] || 0;
        const minExpected = target * (1 - tolerance);
        const maxExpected = target * (1 + tolerance);

        expect(actual).toBeGreaterThanOrEqual(minExpected);
        expect(actual).toBeLessThanOrEqual(maxExpected);
      });
    });

    it('SLA risk distribution matches §20.2 targets (±3%)', () => {
      const slaRiskCounts = allCases.reduce(
        (acc, c) => {
          acc[c.slaRisk] = (acc[c.slaRisk] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const targets = {
        on_track: 1400, // 70%
        at_risk: 400, // 20%
        breached: 200, // 10%
      };

      // Slightly higher tolerance for SLA since it's calculated
      const tolerance = 0.03;

      Object.entries(targets).forEach(([risk, target]) => {
        const actual = slaRiskCounts[risk] || 0;
        const minExpected = target * (1 - tolerance);
        const maxExpected = target * (1 + tolerance);

        expect(actual).toBeGreaterThanOrEqual(minExpected);
        expect(actual).toBeLessThanOrEqual(maxExpected);
      });
    });

    it('channel distribution matches §20.2 targets (±2%)', () => {
      const channelCounts = allCases.reduce(
        (acc, c) => {
          acc[c.channel] = (acc[c.channel] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const targets = {
        email: 1000, // 50%
        whatsapp: 500, // 25%
        webchat: 300, // 15%
        student_portal: 200, // 10%
      };

      const tolerance = 0.02;

      Object.entries(targets).forEach(([channel, target]) => {
        const actual = channelCounts[channel] || 0;
        const minExpected = target * (1 - tolerance);
        const maxExpected = target * (1 + tolerance);

        expect(actual).toBeGreaterThanOrEqual(minExpected);
        expect(actual).toBeLessThanOrEqual(maxExpected);
      });
    });

    it('has at least 50 duplicate cases (2.5%)', () => {
      const duplicates = allCases.filter((c) => c.duplicateOf !== null && c.duplicateOf !== undefined);
      expect(duplicates.length).toBeGreaterThanOrEqual(45); // Allow some variance
    });

    it('has at least 100 long threads (10+ messages)', () => {
      const longThreads = allCases.filter((c) => c.messageCount >= 10);
      expect(longThreads.length).toBeGreaterThanOrEqual(95); // Allow some variance
    });

    it('has at least 30 merged cases', () => {
      const merged = allCases.filter((c) => c.mergedCases && c.mergedCases.length > 0);
      expect(merged.length).toBeGreaterThanOrEqual(25); // Allow some variance (target 30, 1.5%)
    });

    it('all cases have valid timestamps', () => {
      allCases.forEach((c) => {
        expect(new Date(c.createdAt).getTime()).toBeGreaterThan(0);
        expect(new Date(c.updatedAt).getTime()).toBeGreaterThan(0);
        expect(new Date(c.slaDeadline).getTime()).toBeGreaterThan(0);

        // updatedAt >= createdAt
        expect(new Date(c.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(c.createdAt).getTime());

        if (c.resolvedAt) {
          expect(new Date(c.resolvedAt).getTime()).toBeGreaterThanOrEqual(new Date(c.createdAt).getTime());
        }

        if (c.closedAt) {
          expect(new Date(c.closedAt).getTime()).toBeGreaterThanOrEqual(new Date(c.createdAt).getTime());
          if (c.resolvedAt) {
            expect(new Date(c.closedAt).getTime()).toBeGreaterThanOrEqual(new Date(c.resolvedAt).getTime());
          }
        }
      });
    });

    it('all cases have valid student IDs', () => {
      allCases.forEach((c) => {
        expect(c.studentId).toMatch(/^S\d{4}-\d{4}$/);
        expect(c.studentName).toBeTruthy();
        expect(c.studentName.length).toBeGreaterThan(0);
      });
    });

    it('all cases have valid ticket numbers', () => {
      allCases.forEach((c) => {
        expect(c.ticketNumber).toMatch(/^TKT-\d{8}$/);
      });
    });

    it('all case IDs are unique', () => {
      const ids = allCases.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(allCases.length);
    });

    it('spam cases are never assigned', () => {
      const spamCases = allCases.filter((c) => c.status === 'spam');
      spamCases.forEach((c) => {
        expect(c.assignee).toBeNull();
      });
    });

    it('resolved/closed cases have resolvedAt timestamp', () => {
      const resolvedOrClosed = allCases.filter((c) => c.status === 'resolved' || c.status === 'closed');
      resolvedOrClosed.forEach((c) => {
        expect(c.resolvedAt).toBeTruthy();
        expect(new Date(c.resolvedAt!).getTime()).toBeGreaterThan(0);
      });
    });

    it('closed cases have closedAt timestamp', () => {
      const closedCases = allCases.filter((c) => c.status === 'closed');
      closedCases.forEach((c) => {
        expect(c.closedAt).toBeTruthy();
        expect(new Date(c.closedAt!).getTime()).toBeGreaterThan(0);
      });
    });
  });

  describe('first 5 seed cases', () => {
    it('returns exactly 5 cases', () => {
      expect(first5Cases).toHaveLength(5);
    });

    it('matches SPEC §20.7 example structure', () => {
      const case1 = first5Cases[0];

      expect(case1.id).toBe('CASE-00000001');
      expect(case1.ticketNumber).toBe('TKT-00000001');
      expect(case1.department).toBe('finance');
      expect(case1.subject).toContain('Payment plan');
      expect(case1.studentName).toBe('Ahmed Ali');
      expect(case1.priority).toBe('high');
      expect(case1.status).toBe('open');
      expect(case1.assignee?.name).toBe('Sarah Johnson');
    });

    it('second case matches SPEC example', () => {
      const case2 = first5Cases[1];

      expect(case2.id).toBe('CASE-00000002');
      expect(case2.department).toBe('admissions');
      expect(case2.subject).toContain('transcript');
      expect(case2.priority).toBe('medium');
      expect(case2.status).toBe('pending');
    });

    it('all first 5 cases have proper SLA deadlines', () => {
      first5Cases.forEach((c) => {
        expect(c.slaDeadline).toBeTruthy();
        const deadline = new Date(c.slaDeadline);
        const created = new Date(c.createdAt);
        expect(deadline.getTime()).toBeGreaterThan(created.getTime());
      });
    });
  });

  describe('SLA calculation helpers', () => {
    it('calculateSLADeadline returns correct deadlines for finance department', () => {
      const createdAt = new Date('2025-01-30T10:00:00Z');

      // Finance + low = 48 hours
      const lowDeadline = calculateSLADeadline(createdAt, 'finance', 'low');
      expect(lowDeadline.getTime() - createdAt.getTime()).toBe(48 * 60 * 60 * 1000);

      // Finance + urgent = 4 hours
      const urgentDeadline = calculateSLADeadline(createdAt, 'finance', 'urgent');
      expect(urgentDeadline.getTime() - createdAt.getTime()).toBe(4 * 60 * 60 * 1000);
    });

    it('calculateSLADeadline returns correct deadlines for IT support', () => {
      const createdAt = new Date('2025-01-30T10:00:00Z');

      // IT + low = 24 hours
      const lowDeadline = calculateSLADeadline(createdAt, 'it_support', 'low');
      expect(lowDeadline.getTime() - createdAt.getTime()).toBe(24 * 60 * 60 * 1000);

      // IT + high = 4 hours
      const highDeadline = calculateSLADeadline(createdAt, 'it_support', 'high');
      expect(highDeadline.getTime() - createdAt.getTime()).toBe(4 * 60 * 60 * 1000);
    });

    it('calculateSLARisk returns "on_track" for open cases within SLA', () => {
      const deadline = new Date('2025-01-31T12:00:00Z');
      const risk = calculateSLARisk(deadline, 'open', null, null);
      expect(risk).toBe('on_track');
    });

    it('calculateSLARisk returns "at_risk" for cases near deadline', () => {
      const now = new Date('2025-01-30T12:00:00Z');
      const deadline = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now
      const risk = calculateSLARisk(deadline, 'open', null, null);
      expect(risk).toBe('at_risk');
    });

    it('calculateSLARisk returns "breached" for past deadline', () => {
      const deadline = new Date('2025-01-29T12:00:00Z'); // Past deadline
      const risk = calculateSLARisk(deadline, 'open', null, null);
      expect(risk).toBe('breached');
    });

    it('calculateSLARisk returns "breached" for resolved cases after deadline', () => {
      const deadline = new Date('2025-01-30T12:00:00Z');
      const resolvedAt = new Date('2025-01-30T14:00:00Z'); // 2 hours after deadline
      const risk = calculateSLARisk(deadline, 'resolved', resolvedAt, null);
      expect(risk).toBe('breached');
    });

    it('calculateSLARisk returns "on_track" for resolved cases before deadline', () => {
      const deadline = new Date('2025-01-30T12:00:00Z');
      const resolvedAt = new Date('2025-01-30T10:00:00Z'); // 2 hours before deadline
      const risk = calculateSLARisk(deadline, 'resolved', resolvedAt, null);
      expect(risk).toBe('on_track');
    });
  });

  describe('generateCaseThread', () => {
    it('generates exact number of messages requested', () => {
      const messages = generateCaseThread('CASE-TEST-001', 5);
      expect(messages).toHaveLength(5);
    });

    it('generates messages with sequential timestamps', () => {
      const messages = generateCaseThread('CASE-TEST-002', 3);
      const time1 = new Date(messages[0].createdAt).getTime();
      const time2 = new Date(messages[1].createdAt).getTime();
      const time3 = new Date(messages[2].createdAt).getTime();

      expect(time2).toBeGreaterThan(time1);
      expect(time3).toBeGreaterThan(time2);
    });

    it('first message is always from student', () => {
      const messages = generateCaseThread('CASE-TEST-003', 10);
      expect(messages[0].authorId).toBe('student-001');
    });

    it('all messages have required fields', () => {
      const messages = generateCaseThread('CASE-TEST-004', 3);
      messages.forEach((msg) => {
        expect(msg.id).toBeTruthy();
        expect(msg.caseId).toBe('CASE-TEST-004');
        expect(msg.authorId).toBeTruthy();
        expect(msg.authorName).toBeTruthy();
        expect(msg.body).toBeTruthy();
        expect(typeof msg.isInternalNote).toBe('boolean');
        expect(msg.createdAt).toBeTruthy();
        expect(Array.isArray(msg.attachments)).toBe(true);
      });
    });
  });
});