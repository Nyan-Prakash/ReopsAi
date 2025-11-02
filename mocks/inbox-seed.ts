/**
 * Inbox MSW Seed Data Generator
 * SPEC §9.10 - Deterministic seed of ~2000 cases
 */

import type { InboxCase } from '@/lib/inbox-schemas';

// Deterministic random using seed
function seededRandom(seed: number) {
  let state = seed;
  return function() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const random = seededRandom(42);

const departments = ['Admissions', 'Finance', 'Registrar', 'Housing', 'IT'];
const deptWeights = [0.25, 0.30, 0.20, 0.15, 0.10]; // SPEC distribution

const priorities = ['Low', 'Normal', 'High', 'Urgent'];
const priorityWeights = [0.10, 0.60, 0.25, 0.05];

const statuses = ['New', 'Open', 'Waiting', 'Resolved', 'Closed'];
const statusWeights = [0.05, 0.50, 0.15, 0.20, 0.10];

const channels = ['Chat', 'Email', 'Phone', 'Form', 'Walk-in'];

const slaRisks: Array<'green' | 'yellow' | 'red'> = ['green', 'yellow', 'red'];
const slaWeights = [0.70, 0.18, 0.12];

const firstNames = ['Ahmed', 'Sara', 'Mohammed', 'Layla', 'Omar', 'Fatima', 'Ali', 'Nour', 'Hassan', 'Amira'];
const lastNames = ['Ali', 'Khalil', 'Hassan', 'Ibrahim', 'Farid', 'Mahmoud', 'Salem', 'Mansour'];

const tags = [
  'payment_plan',
  'financial_hardship',
  'documents_pending',
  'transcript',
  'verification',
  'password',
  'portal_access',
  'refund',
  'course_drop',
  'enrollment',
  'housing',
  'meal_plan',
];

const subjectTemplates: Record<string, string[]> = {
  'Admissions': [
    'Missing high school transcript',
    'Application status inquiry',
    'Transfer credit evaluation',
    'Documents pending review',
    'Admissions decision timeline',
  ],
  'Finance': [
    'Payment plan request for ${amount} balance',
    'Refund request for dropped course {course}',
    'Scholarship disbursement question',
    'Tuition payment deadline extension',
    'Financial aid verification documents',
  ],
  'Registrar': [
    'Enrollment verification letter request',
    'Grade dispute for {course}',
    'Course registration error',
    'Transcript request for graduate application',
    'Add/drop period extension request',
  ],
  'Housing': [
    'Room assignment change request',
    'Maintenance issue in dorm {building}',
    'Housing contract cancellation',
    'Roommate conflict resolution',
    'Move-out inspection appointment',
  ],
  'IT': [
    'Cannot access student portal - password reset',
    'Email account not receiving messages',
    'WiFi connectivity issues in {building}',
    'Software license activation problem',
    'Two-factor authentication setup help',
  ],
};

const agents = [
  { id: 'agent-001', name: 'Sarah Johnson', email: 'sarah.j@university.edu' },
  { id: 'agent-002', name: 'David Lee', email: 'david.l@university.edu' },
  { id: 'agent-003', name: 'Emily Chen', email: 'emily.c@university.edu' },
  { id: 'agent-004', name: 'Michael Brown', email: 'michael.b@university.edu' },
  { id: 'agent-005', name: 'Lisa Garcia', email: 'lisa.g@university.edu' },
];

function weightedChoice<T>(items: T[], weights: number[]): T {
  const r = random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (r < sum) return items[i];
  }
  return items[items.length - 1];
}

function generateStudent(index: number) {
  const firstName = firstNames[Math.floor(random() * firstNames.length)];
  const lastName = lastNames[Math.floor(random() * lastNames.length)];
  return {
    id: `S${String(2024000 + index).padStart(7, '0')}`,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.edu`,
  };
}

function generateSubject(dept: string): string {
  const templates = subjectTemplates[dept];
  const template = templates[Math.floor(random() * templates.length)];
  return template
    .replace('{amount}', String(Math.floor(random() * 5000) + 500))
    .replace('{course}', ['BIO 201', 'MATH 301', 'ENG 102', 'CS 150'][Math.floor(random() * 4)])
    .replace('{building}', ['North Hall', 'South Tower', 'East Residence'][Math.floor(random() * 3)]);
}

function generateSLA(priority: string, createdAt: Date): InboxCase['sla'] {
  const risk = weightedChoice(slaRisks, slaWeights);
  const percent = risk === 'green' ? random() * 50 : risk === 'yellow' ? 50 + random() * 30 : 80 + random() * 20;

  // First response: 1-4h depending on priority
  const frMinutes = priority === 'Urgent' ? 60 : priority === 'High' ? 120 : priority === 'Normal' ? 240 : 480;
  const firstResponseDue = new Date(createdAt.getTime() + frMinutes * 60 * 1000);

  // Resolution: 4-48h depending on priority
  const resMinutes = priority === 'Urgent' ? 240 : priority === 'High' ? 1440 : priority === 'Normal' ? 2880 : 5760;
  const resolutionDue = new Date(createdAt.getTime() + resMinutes * 60 * 1000);

  return {
    firstResponseDueAt: firstResponseDue.toISOString(),
    resolutionDueAt: resolutionDue.toISOString(),
    riskLevel: risk,
    breached: random() < 0.05, // 5% breached
    percentElapsed: Math.round(percent),
  };
}

export function generateInboxCases(count: number = 2000): InboxCase[] {
  const cases: InboxCase[] = [];
  const now = new Date('2025-01-30T14:00:00Z'); // Fixed "current" time

  for (let i = 0; i < count; i++) {
    const dept = weightedChoice(departments, deptWeights);
    const priority = weightedChoice(priorities, priorityWeights);
    const status = weightedChoice(statuses, statusWeights);
    const student = generateStudent(i);

    // Create date: last 7-30 days
    const daysAgo = Math.floor(random() * 30);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Updated: between created and now
    const updatedOffset = Math.floor(random() * (now.getTime() - createdAt.getTime()));
    const updatedAt = new Date(createdAt.getTime() + updatedOffset);

    const caseData: InboxCase = {
      id: `CASE-${String(20250001 + i).padStart(8, '0')}`,
      ticketNumber: `TKT-${String(20250001 + i).padStart(8, '0')}`,
      department: dept,
      subject: generateSubject(dept),
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      priority: priority as any,
      status: status as any,
      channel: channels[Math.floor(random() * channels.length)],
      sla: generateSLA(priority, createdAt),
      assignee: random() < 0.70 ? agents[Math.floor(random() * agents.length)] : null, // 70% assigned
      tags: Array.from({ length: Math.floor(random() * 3) }, () => tags[Math.floor(random() * tags.length)]),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };

    cases.push(caseData);
  }

  // Add 10 duplicate pairs for merge demo
  for (let i = 0; i < 10; i++) {
    const original = cases[i * 100]; // Every 100th case
    const duplicate: InboxCase = {
      ...original,
      id: `CASE-DUP-${i}`,
      ticketNumber: `TKT-DUP-${i}`,
      createdAt: new Date(new Date(original.createdAt).getTime() + 3600000).toISOString(), // 1h later
      tags: [...original.tags, 'potential_duplicate'],
    };
    cases.push(duplicate);
  }

  return cases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Pre-generate for consistent MSW responses
export const SEED_CASES = generateInboxCases(2010); // 2000 + 10 duplicates
