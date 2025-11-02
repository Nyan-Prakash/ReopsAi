/**
 * Seed Data Generators
 * Generates 2,000 cases with distributions aligned with SPEC §20.2
 */

import { Case, Message, Department, Priority, CaseStatus, Channel, SLARisk } from '@/types';
import {
  pick,
  pickN,
  dateWithSeasonality,
  calculateSLADeadline,
  calculateSLARisk,
  generateName,
  generateStudentId,
  NOW,
  random,
} from './seed-utils';

// Constants from §20.2
const TOTAL_CASES = 2000;
const CASE_START_DATE = new Date('2024-06-01T00:00:00Z');
const CASE_END_DATE = NOW;

// Agent pool
const AGENTS = [
  { id: 'agent-001', name: 'John Smith', department: 'finance' },
  { id: 'agent-002', name: 'Sarah Johnson', department: 'finance' },
  { id: 'agent-003', name: 'David Lee', department: 'registrar' },
  { id: 'agent-004', name: 'Emily Chen', department: 'it_support' },
  { id: 'agent-005', name: 'Michael Brown', department: 'admissions' },
  { id: 'agent-006', name: 'Lisa Wang', department: 'student_affairs' },
  { id: 'agent-007', name: 'Ahmed Al-Rashid', department: 'finance' },
  { id: 'agent-008', name: 'Maria Garcia', department: 'admissions' },
  { id: 'agent-009', name: 'Robert Taylor', department: 'registrar' },
  { id: 'agent-010', name: 'Jennifer Lee', department: 'general' },
];

// Subject templates by department
const SUBJECT_TEMPLATES: Record<Department, string[]> = {
  finance: [
    'Payment plan request for ${amount} balance',
    'Refund request for dropped course ${course}',
    'Financial aid disbursement inquiry',
    'Outstanding tuition balance - need extension',
    'Scholarship application status check',
    'Fee waiver request for application',
    'Invoice discrepancy - duplicate charge',
    'Late payment fee appeal',
  ],
  admissions: [
    'Missing high school transcript',
    'Transfer credit evaluation status',
    'Application deadline extension request',
    'International student visa documentation',
    'Duplicate application submission',
    'Recommendation letter not received',
    'Test score submission confirmation',
    'Early decision status inquiry',
  ],
  registrar: [
    'Enrollment verification letter request',
    'Course registration issue - section full',
    'Grade change request for ${course}',
    'Transcript request - urgent',
    'Degree audit discrepancy',
    'Course withdrawal after deadline',
    'Name change on official records',
    'Graduation application status',
  ],
  it_support: [
    'Cannot access student portal - password reset',
    'Email account locked after failed logins',
    'Canvas LMS not loading properly',
    'Multi-factor authentication setup issue',
    'VPN connection failure from home',
    'Student ID card printing error',
    'Library database access denied',
    'WiFi connectivity issues on campus',
  ],
  student_affairs: [
    'Housing assignment change request',
    'Student organization registration',
    'Parking permit not received',
    'Health services appointment scheduling',
    'Student conduct hearing appeal',
    'Disability accommodation request',
    'Campus event registration issue',
    'Mental health counseling waitlist',
  ],
  general: [
    'General inquiry about campus services',
    'Lost and found item report',
    'Visitor parking pass request',
    'Campus map and directions',
    'Contact information update',
    'General complaint',
  ],
};

// Tag pools by department
const TAG_POOLS: Record<Department, string[]> = {
  finance: ['payment_plan', 'refund', 'scholarship', 'financial_aid', 'invoice', 'late_fee', 'waiver'],
  admissions: ['transcript', 'transfer', 'visa', 'documents_pending', 'deadline', 'test_scores'],
  registrar: ['verification', 'enrollment', 'transcript', 'grades', 'withdrawal', 'graduation'],
  it_support: ['password', 'portal_access', 'canvas', 'mfa', 'vpn', 'wifi', 'library'],
  student_affairs: ['housing', 'parking', 'health', 'disability', 'counseling', 'events'],
  general: ['inquiry', 'complaint', 'lost_found', 'parking', 'contact_update'],
};

/**
 * Generate all 2,000 cases with exact distribution targets
 */
export function generateAllCases(): Case[] {
  const cases: Case[] = [];

  // Pre-allocate exact distributions per §20.2
  const deptTargets = { finance: 600, admissions: 500, registrar: 500, it_support: 200, student_affairs: 150, general: 50 };
  const priorityTargets = { low: 800, medium: 700, high: 400, urgent: 100 };
  const statusTargets = { open: 700, pending: 400, resolved: 600, closed: 280, spam: 20 };
  const channelTargets = { email: 1000, whatsapp: 500, webchat: 300, student_portal: 200 };

  // Build allocation arrays
  const deptAlloc: Department[] = [];
  Object.entries(deptTargets).forEach(([dept, count]) => {
    for (let i = 0; i < count; i++) {
      deptAlloc.push(dept as Department);
    }
  });

  const priorityAlloc: Priority[] = [];
  Object.entries(priorityTargets).forEach(([priority, count]) => {
    for (let i = 0; i < count; i++) {
      priorityAlloc.push(priority as Priority);
    }
  });

  const statusAlloc: CaseStatus[] = [];
  Object.entries(statusTargets).forEach(([status, count]) => {
    for (let i = 0; i < count; i++) {
      statusAlloc.push(status as CaseStatus);
    }
  });

  const channelAlloc: Channel[] = [];
  Object.entries(channelTargets).forEach(([channel, count]) => {
    for (let i = 0; i < count; i++) {
      channelAlloc.push(channel as Channel);
    }
  });

  // Shuffle allocations for randomness
  const shuffleArray = <T,>(arr: T[]): T[] => [...arr].sort(() => random() - 0.5);
  const deptShuffled = shuffleArray(deptAlloc);
  const priorityShuffled = shuffleArray(priorityAlloc);
  const statusShuffled = shuffleArray(statusAlloc);
  const channelShuffled = shuffleArray(channelAlloc);

  // Generate cases with exact distributions
  for (let i = 0; i < TOTAL_CASES; i++) {
    const caseNumber = i + 1;
    const id = `CASE-${String(caseNumber).padStart(8, '0')}`;
    const ticketNumber = `TKT-${String(caseNumber).padStart(8, '0')}`;

    const department = deptShuffled[i];
    const priority = priorityShuffled[i];
    const status = statusShuffled[i];
    const channel = channelShuffled[i];

    const createdAt = dateWithSeasonality(CASE_START_DATE, CASE_END_DATE);
    const slaDeadline = calculateSLADeadline(createdAt, department, priority);

    let resolvedAt: Date | null = null;
    let closedAt: Date | null = null;
    let updatedAt = createdAt;

    if (status === 'resolved' || status === 'closed') {
      const minResolutionHours = priority === 'urgent' ? 1 : priority === 'high' ? 4 : 12;
      const maxResolutionHours = priority === 'urgent' ? 24 : priority === 'high' ? 48 : 96;
      const resolutionHours = minResolutionHours + random() * (maxResolutionHours - minResolutionHours);

      resolvedAt = new Date(createdAt);
      resolvedAt.setHours(resolvedAt.getHours() + resolutionHours);
      updatedAt = resolvedAt;

      if (status === 'closed') {
        closedAt = new Date(resolvedAt);
        closedAt.setHours(closedAt.getHours() + 24);
        updatedAt = closedAt;
      }
    } else if (status === 'pending') {
      const hoursSinceCreation = (NOW.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation > 24) {
        updatedAt = new Date(createdAt.getTime() + random() * (NOW.getTime() - createdAt.getTime()));
      }
    } else if (status === 'open') {
      if (random() < 0.5) {
        const hoursSinceCreation = (NOW.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreation > 1) {
          updatedAt = new Date(createdAt.getTime() + random() * (NOW.getTime() - createdAt.getTime()));
        }
      }
    }

    const slaRisk = calculateSLARisk(slaDeadline, status, resolvedAt, closedAt);

    const studentIndex = Math.floor(random() * 500) + 1;
    const studentName = generateName('en');
    const studentId = generateStudentId(studentIndex);

    let assignee: { id: string; name: string } | null = null;
    if (status !== 'spam' && random() < 0.7) {
      const matchingAgents = AGENTS.filter((a) => a.department === department);
      if (matchingAgents.length > 0) {
        const agent = pick(matchingAgents);
        assignee = { id: agent.id, name: agent.name };
      } else {
        const agent = pick(AGENTS);
        assignee = { id: agent.id, name: agent.name };
      }
    }

    const template = pick(SUBJECT_TEMPLATES[department]);
    const subject = template
      .replace('${amount}', `$${Math.floor(random() * 5000 + 500)}`)
      .replace('${course}', pick(['BIO 201', 'CHEM 101', 'MATH 250', 'ENG 102', 'PHYS 301']));

    const tagCount = Math.floor(random() * 3) + 1;
    const tags = pickN(TAG_POOLS[department], Math.min(tagCount, TAG_POOLS[department].length));

    let messageCount = 1;
    if (status === 'pending' || status === 'open') {
      messageCount += Math.floor(random() * 5);
    } else if (status === 'resolved' || status === 'closed') {
      messageCount += Math.floor(random() * 8) + 2;
    }

    const isDuplicate = random() < 0.025;
    const isMerged = random() < 0.015;

    let duplicateOf: string | null = null;
    let mergedCases: string[] | undefined = undefined;

    if (isDuplicate && caseNumber > 10) {
      const earlierCaseNum = Math.floor(random() * (caseNumber - 1)) + 1;
      duplicateOf = `CASE-${String(earlierCaseNum).padStart(8, '0')}`;
    }

    if (isMerged && caseNumber > 20) {
      const childCount = Math.floor(random() * 2) + 2;
      mergedCases = Array.from({ length: childCount }, (_, j) => {
        const childNum = caseNumber + 1000 + j;
        return `CASE-${String(childNum).padStart(8, '0')}`;
      });
    }

    cases.push({
      id,
      ticketNumber,
      department,
      subject,
      studentId,
      studentName,
      priority,
      status,
      channel,
      slaRisk,
      slaDeadline: slaDeadline.toISOString(),
      assignee,
      tags,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      resolvedAt: resolvedAt?.toISOString() || null,
      closedAt: closedAt?.toISOString() || null,
      messageCount,
      duplicateOf,
      mergedCases,
    });
  }

  // Post-process SLA risk to match exact targets (70% on_track, 20% at_risk, 10% breached)
  const slaTargets = { on_track: 1400, at_risk: 400, breached: 200 };
  const slaAlloc: SLARisk[] = [];
  Object.entries(slaTargets).forEach(([risk, count]) => {
    for (let i = 0; i < count; i++) {
      slaAlloc.push(risk as SLARisk);
    }
  });

  // Shuffle and assign SLA risks
  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => random() - 0.5);
  const slaShuffled = shuffle(slaAlloc);
  cases.forEach((c, idx) => {
    c.slaRisk = slaShuffled[idx];
  });

  // Ensure ~100 long threads (10+ messages)
  let longThreadCount = 0;
  for (const c of cases) {
    if (longThreadCount >= 100) break;
    if ((c.status === 'resolved' || c.status === 'closed') && c.messageCount < 10) {
      c.messageCount = 10 + Math.floor(random() * 5);
      longThreadCount++;
    }
  }

  return cases;
}

/**
 * Get first 5 seed cases matching SPEC §20.7 examples
 */
export function getFirst5Cases(): Case[] {
  return [
    {
      id: 'CASE-00000001',
      ticketNumber: 'TKT-00000001',
      department: 'finance',
      subject: 'Payment plan request for $2,400 balance',
      studentId: 'S2024-0001',
      studentName: 'Ahmed Ali',
      priority: 'high',
      status: 'open',
      channel: 'webchat',
      slaRisk: 'at_risk',
      slaDeadline: new Date('2025-01-30T17:00:00Z').toISOString(),
      assignee: { id: 'agent-002', name: 'Sarah Johnson' },
      tags: ['payment_plan'],
      createdAt: new Date('2025-01-30T09:15:00Z').toISOString(),
      updatedAt: new Date('2025-01-30T14:22:00Z').toISOString(),
      resolvedAt: null,
      closedAt: null,
      messageCount: 3,
      duplicateOf: null,
    },
    {
      id: 'CASE-00000002',
      ticketNumber: 'TKT-00000002',
      department: 'admissions',
      subject: 'Missing high school transcript',
      studentId: 'S2024-0002',
      studentName: 'Sara Khalil',
      priority: 'medium',
      status: 'pending',
      channel: 'email',
      slaRisk: 'on_track',
      slaDeadline: new Date('2025-01-31T11:00:00Z').toISOString(),
      assignee: null,
      tags: ['documents_pending', 'transcript'],
      createdAt: new Date('2025-01-29T11:00:00Z').toISOString(),
      updatedAt: new Date('2025-01-30T10:15:00Z').toISOString(),
      resolvedAt: null,
      closedAt: null,
      messageCount: 2,
      duplicateOf: null,
    },
    {
      id: 'CASE-00000003',
      ticketNumber: 'TKT-00000003',
      department: 'registrar',
      subject: 'Enrollment verification letter request',
      studentId: 'S2024-0003',
      studentName: 'Mohammed Hassan',
      priority: 'medium',
      status: 'open',
      channel: 'student_portal',
      slaRisk: 'on_track',
      slaDeadline: new Date('2025-01-31T08:00:00Z').toISOString(),
      assignee: { id: 'agent-003', name: 'David Lee' },
      tags: ['verification'],
      createdAt: new Date('2025-01-30T08:00:00Z').toISOString(),
      updatedAt: new Date('2025-01-30T08:00:00Z').toISOString(),
      resolvedAt: null,
      closedAt: null,
      messageCount: 1,
      duplicateOf: null,
    },
    {
      id: 'CASE-00000004',
      ticketNumber: 'TKT-00000004',
      department: 'it_support',
      subject: 'Cannot access student portal - password reset',
      studentId: 'S2024-0004',
      studentName: 'Layla Ibrahim',
      priority: 'urgent',
      status: 'open',
      channel: 'whatsapp',
      slaRisk: 'on_track',
      slaDeadline: new Date('2025-01-30T17:00:00Z').toISOString(),
      assignee: { id: 'agent-004', name: 'Emily Chen' },
      tags: ['password', 'portal_access'],
      createdAt: new Date('2025-01-30T13:00:00Z').toISOString(),
      updatedAt: new Date('2025-01-30T13:45:00Z').toISOString(),
      resolvedAt: null,
      closedAt: null,
      messageCount: 2,
      duplicateOf: null,
    },
    {
      id: 'CASE-00000005',
      ticketNumber: 'TKT-00000005',
      department: 'finance',
      subject: 'Refund request for dropped course BIO 201',
      studentId: 'S2024-0005',
      studentName: 'Omar Farid',
      priority: 'medium',
      status: 'resolved',
      channel: 'email',
      slaRisk: 'on_track',
      slaDeadline: new Date('2025-01-29T10:00:00Z').toISOString(),
      assignee: { id: 'agent-002', name: 'Sarah Johnson' },
      tags: ['refund', 'course_drop'],
      createdAt: new Date('2025-01-28T10:00:00Z').toISOString(),
      updatedAt: new Date('2025-01-29T16:30:00Z').toISOString(),
      resolvedAt: new Date('2025-01-29T16:30:00Z').toISOString(),
      closedAt: null,
      messageCount: 4,
      duplicateOf: null,
    },
  ];
}

/**
 * Generate case thread (messages)
 */
export function generateCaseThread(caseId: string, count: number): Message[] {
  const messages: Message[] = [];
  const baseTime = new Date('2025-01-30T10:00:00Z');

  for (let i = 0; i < count; i++) {
    const messageTime = new Date(baseTime);
    messageTime.setMinutes(baseTime.getMinutes() + i * 30);

    const isFromStudent = i === 0 || random() < 0.4;
    const isInternalNote = !isFromStudent && random() < 0.2;

    messages.push({
      id: `msg-${caseId}-${String(i + 1).padStart(3, '0')}`,
      caseId,
      authorId: isFromStudent ? 'student-001' : pick(AGENTS).id,
      authorName: isFromStudent ? 'Student' : pick(AGENTS).name,
      body: isFromStudent
        ? `Student message ${i + 1}`
        : isInternalNote
          ? `Internal note ${i + 1}`
          : `Agent response ${i + 1}`,
      isInternalNote,
      createdAt: messageTime.toISOString(),
      attachments: [],
    });
  }

  return messages;
}

// Export the generated cases
export const allCases = generateAllCases();
export const first5Cases = getFirst5Cases();