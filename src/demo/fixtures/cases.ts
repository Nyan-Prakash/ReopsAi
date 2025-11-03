/**
 * Demo Mode Fixtures
 * Realistic, deterministic fake data for inbox cases, messages, and analytics
 */

import { CaseDetail, CaseItem, CaseMessage, AnalyticsSummary } from '@/types/inbox';

const now = new Date();
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => iso(new Date(now.getTime() - n * 24 * 60 * 60 * 1000));

export const CASES: CaseItem[] = [
  {
    id: 'CAS-1001',
    subject: 'Scholarship payment not received',
    dept: 'Finance',
    status: 'open',
    priority: 'high',
    sla: 'first_response',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(0),
    lastMessagePreview: 'I have not received my stipend for October…',
    requester: { id: 'U-1', name: 'Maya Hassan', email: 'maya.hassan@univ.edu' },
    tags: ['scholarship', 'urgent'],
  },
  {
    id: 'CAS-1002',
    subject: 'Transfer credits evaluation timeline',
    dept: 'Admissions',
    status: 'open',
    priority: 'normal',
    sla: 'resolution',
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1),
    lastMessagePreview: 'How long will credit evaluation take?',
    requester: { id: 'U-2', name: 'Leo Kim', email: 'leo.kim@univ.edu' },
  },
  {
    id: 'CAS-1003',
    subject: 'Course registration access issue',
    dept: 'Registrar',
    status: 'pending',
    priority: 'urgent',
    sla: 'first_response',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(0),
    lastMessagePreview: 'Cannot access registration portal for Spring 2024',
    requester: { id: 'U-3', name: 'Sarah Johnson', email: 'sarah.j@univ.edu' },
    tags: ['registration', 'portal'],
  },
  {
    id: 'CAS-1004',
    subject: 'Financial aid appeal status',
    dept: 'Finance',
    status: 'open',
    priority: 'high',
    sla: 'resolution',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(2),
    lastMessagePreview: 'Checking on my aid appeal submitted two weeks ago',
    requester: { id: 'U-4', name: 'Ahmed Al-Rashid', email: 'ahmed.r@univ.edu' },
    tags: ['financial-aid', 'appeal'],
  },
  {
    id: 'CAS-1005',
    subject: 'Transcript request for graduate application',
    dept: 'Registrar',
    status: 'closed',
    priority: 'normal',
    sla: null,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(7),
    lastMessagePreview: 'Need official transcript sent to Stanford',
    requester: { id: 'U-5', name: 'Emily Chen', email: 'emily.chen@univ.edu' },
  },
  {
    id: 'CAS-1006',
    subject: 'Housing assignment for Fall semester',
    dept: 'Student Affairs',
    status: 'open',
    priority: 'normal',
    sla: 'resolution',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    lastMessagePreview: 'Requesting on-campus housing for next semester',
    requester: { id: 'U-6', name: 'Marcus Williams', email: 'marcus.w@univ.edu' },
    tags: ['housing'],
  },
  {
    id: 'CAS-1007',
    subject: 'VPN access for remote research',
    dept: 'IT Support',
    status: 'open',
    priority: 'low',
    sla: 'first_response',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(3),
    lastMessagePreview: 'Need VPN credentials for library database access',
    requester: { id: 'U-7', name: 'Priya Sharma', email: 'priya.s@univ.edu' },
    tags: ['vpn', 'it'],
  },
  {
    id: 'CAS-1008',
    subject: 'Grade dispute for MATH-301',
    dept: 'Registrar',
    status: 'pending',
    priority: 'high',
    sla: 'resolution',
    createdAt: daysAgo(8),
    updatedAt: daysAgo(5),
    lastMessagePreview: 'Formal grade appeal for final exam',
    requester: { id: 'U-8', name: 'David Park', email: 'david.park@univ.edu' },
    tags: ['grade-dispute', 'academic'],
  },
  {
    id: 'CAS-1009',
    subject: 'International student orientation date',
    dept: 'Admissions',
    status: 'open',
    priority: 'normal',
    sla: 'first_response',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    lastMessagePreview: 'When is the mandatory orientation for F-1 students?',
    requester: { id: 'U-9', name: 'Yuki Tanaka', email: 'yuki.t@univ.edu' },
    tags: ['international', 'orientation'],
  },
  {
    id: 'CAS-1010',
    subject: 'Parking permit renewal',
    dept: 'Student Affairs',
    status: 'snoozed',
    priority: 'low',
    sla: null,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(12),
    lastMessagePreview: 'Need to renew my student parking pass',
    requester: { id: 'U-10', name: 'Jessica Brown', email: 'jessica.b@univ.edu' },
    tags: ['parking'],
  },
  {
    id: 'CAS-1011',
    subject: 'Study abroad program eligibility',
    dept: 'Admissions',
    status: 'open',
    priority: 'normal',
    sla: 'resolution',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(4),
    lastMessagePreview: 'Am I eligible for the Spain exchange program?',
    requester: { id: 'U-11', name: 'Carlos Mendez', email: 'carlos.m@univ.edu' },
    tags: ['study-abroad'],
  },
  {
    id: 'CAS-1012',
    subject: 'Lab equipment access request',
    dept: 'IT Support',
    status: 'open',
    priority: 'urgent',
    sla: 'first_response',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(0),
    lastMessagePreview: 'Need access to Chemistry lab computers for thesis',
    requester: { id: 'U-12', name: 'Nina Patel', email: 'nina.p@univ.edu' },
    tags: ['lab-access', 'research'],
  },
  {
    id: 'CAS-1013',
    subject: 'Tuition payment plan options',
    dept: 'Finance',
    status: 'closed',
    priority: 'normal',
    sla: null,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(18),
    lastMessagePreview: 'What payment plan options are available?',
    requester: { id: 'U-13', name: 'Robert Lee', email: 'robert.lee@univ.edu' },
  },
  {
    id: 'CAS-1014',
    subject: 'Course withdrawal deadline extension',
    dept: 'Registrar',
    status: 'pending',
    priority: 'high',
    sla: 'resolution',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    lastMessagePreview: 'Medical emergency - need to withdraw from two courses',
    requester: { id: 'U-14', name: 'Lisa Anderson', email: 'lisa.a@univ.edu' },
    tags: ['withdrawal', 'medical'],
  },
  {
    id: 'CAS-1015',
    subject: 'Campus ID card replacement',
    dept: 'Student Affairs',
    status: 'open',
    priority: 'low',
    sla: 'first_response',
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2),
    lastMessagePreview: 'Lost my student ID, need replacement',
    requester: { id: 'U-15', name: 'Mohammed Ali', email: 'mohammed.a@univ.edu' },
    tags: ['id-card'],
  },
];

export const MESSAGES: Record<string, CaseMessage[]> = {
  'CAS-1001': [
    {
      id: 'MSG-1001-1',
      caseId: 'CAS-1001',
      author: { name: 'Maya Hassan', role: 'requester' },
      body: 'Hi, I have not received my October scholarship stipend. The payment was supposed to be deposited on the 15th, but it is now the 20th and nothing has appeared in my account. Can you please check on this urgently?',
      createdAt: daysAgo(2),
    },
    {
      id: 'MSG-1001-2',
      caseId: 'CAS-1001',
      author: { name: 'Finance Bot', role: 'system' },
      body: 'Ticket created and assigned to Finance team. Target response time: 4 hours.',
      createdAt: daysAgo(2),
    },
  ],
  'CAS-1002': [
    {
      id: 'MSG-1002-1',
      caseId: 'CAS-1002',
      author: { name: 'Leo Kim', role: 'requester' },
      body: 'I submitted my transfer credit evaluation request two weeks ago. How long does the evaluation process typically take? I need to register for courses soon.',
      createdAt: daysAgo(4),
    },
    {
      id: 'MSG-1002-2',
      caseId: 'CAS-1002',
      author: { name: 'Jennifer Martinez', role: 'agent' },
      body: 'Thank you for your patience. Transfer credit evaluations typically take 2-3 weeks. Your request is currently under review by our academic evaluators. We will notify you as soon as it is complete.',
      createdAt: daysAgo(3),
    },
  ],
  'CAS-1003': [
    {
      id: 'MSG-1003-1',
      caseId: 'CAS-1003',
      author: { name: 'Sarah Johnson', role: 'requester' },
      body: 'I cannot access the course registration portal for Spring 2024. When I try to log in, I get an error message saying "Access Denied - Contact Registrar". This is urgent as registration closes tomorrow!',
      createdAt: daysAgo(1),
    },
  ],
  'CAS-1004': [
    {
      id: 'MSG-1004-1',
      caseId: 'CAS-1004',
      author: { name: 'Ahmed Al-Rashid', role: 'requester' },
      body: 'I submitted a financial aid appeal two weeks ago and haven\'t heard back. Can you provide an update on the status?',
      createdAt: daysAgo(5),
    },
    {
      id: 'MSG-1004-2',
      caseId: 'CAS-1004',
      author: { name: 'Finance Team', role: 'agent' },
      body: 'Your appeal is being reviewed by the financial aid committee. We should have a decision within the next week.',
      createdAt: daysAgo(2),
    },
  ],
  'CAS-1005': [
    {
      id: 'MSG-1005-1',
      caseId: 'CAS-1005',
      author: { name: 'Emily Chen', role: 'requester' },
      body: 'I need an official transcript sent to Stanford University for my graduate application. The deadline is next week.',
      createdAt: daysAgo(10),
    },
    {
      id: 'MSG-1005-2',
      caseId: 'CAS-1005',
      author: { name: 'Registrar Bot', role: 'system' },
      body: 'Transcript request processed. Sent to Stanford University on 2024-10-25. Case closed.',
      createdAt: daysAgo(7),
    },
  ],
};

export const CASE_DETAILS: Record<string, CaseDetail> = Object.fromEntries(
  CASES.map((c) => [
    c.id,
    {
      ...c,
      messages: MESSAGES[c.id] ?? [
        {
          id: `${c.id}-default-msg`,
          caseId: c.id,
          author: { name: c.requester.name, role: 'requester' as const },
          body: c.lastMessagePreview,
          createdAt: c.createdAt,
        },
      ],
      attachments:
        c.id === 'CAS-1001'
          ? [{ id: 'ATT-1', name: 'bank_statement.pdf', url: '#' }]
          : c.id === 'CAS-1008'
            ? [
                { id: 'ATT-2', name: 'exam_paper.pdf', url: '#' },
                { id: 'ATT-3', name: 'grade_report.pdf', url: '#' },
              ]
            : [],
      timeline: [
        { ts: c.createdAt, text: 'Case opened' },
        { ts: c.updatedAt, text: 'Last activity' },
        ...(c.status === 'closed' ? [{ ts: c.updatedAt, text: 'Case closed' }] : []),
      ],
    },
  ])
);

export const ANALYTICS: AnalyticsSummary = {
  cards: [
    { title: 'Open Cases', value: String(CASES.filter((c) => c.status === 'open').length) },
    { title: 'SLA Breaches Today', value: '2' },
    { title: 'Avg First Response (24h)', value: '1h 42m' },
    { title: 'Cases Closed This Week', value: String(CASES.filter((c) => c.status === 'closed').length) },
  ],
  series: [
    {
      key: 'cases_opened',
      points: Array.from({ length: 7 }, (_, i) => ({ x: daysAgo(6 - i), y: 12 + i })),
    },
    {
      key: 'sla_breached',
      points: Array.from({ length: 7 }, (_, i) => ({ x: daysAgo(6 - i), y: i % 2 ? 1 : 2 })),
    },
  ],
};