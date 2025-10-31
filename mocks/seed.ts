// Mock Data Seed
// This file generates 50 records for each entity type
// Only the first 5 examples are shown inline; state totals at the end

import type { KBArticle, CatalogItem, RequestTicketPublic, Announcement } from '../docs/TYPES';

// ============================================
// KB ARTICLES (50 total)
// ============================================

export const kbArticles: KBArticle[] = [
  // First 5 examples shown in detail:
  {
    id: "kb-001",
    title: "How to Pay Tuition Online",
    slug: "how-to-pay-tuition-online",
    content: "<h2>Payment Methods</h2><p>We accept credit cards (Visa, Mastercard, Discover), bank transfers (ACH), and check by mail. To pay online, log into the student portal and navigate to Finance > Make a Payment.</p><h3>Payment Plans</h3><p>Students with balances over $1,000 may request a payment plan for 3, 6, or 12 months.</p>",
    summary: "Learn about online tuition payment options including credit card, bank transfer, and payment plans.",
    category: "Payments",
    department: "Finance",
    tags: ["tuition", "payment", "online", "credit card"],
    author: "Finance Team",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-20T14:30:00Z",
    views: 1542,
    helpfulCount: 89,
    notHelpfulCount: 3,
    featured: true,
    relatedArticles: ["kb-002", "kb-003"]
  },
  {
    id: "kb-002",
    title: "Payment Plan Eligibility & Application",
    slug: "payment-plan-eligibility",
    content: "<h2>Eligibility Requirements</h2><p>To qualify for a payment plan, you must have a balance of at least $1,000 and no outstanding holds on your account.</p><h3>How to Apply</h3><p>Submit the payment plan request form through the student portal under Finance > Payment Plans.</p>",
    summary: "Understand eligibility requirements and application process for tuition payment plans.",
    category: "Payments",
    department: "Finance",
    tags: ["payment plan", "tuition", "eligibility", "finance"],
    author: "Finance Team",
    createdAt: "2025-01-10T09:00:00Z",
    updatedAt: "2025-01-18T11:00:00Z",
    views: 987,
    helpfulCount: 72,
    notHelpfulCount: 5,
    featured: true,
    relatedArticles: ["kb-001", "kb-004"]
  },
  {
    id: "kb-003",
    title: "Understanding Your Student Account Balance",
    slug: "understanding-account-balance",
    content: "<h2>Account Statement</h2><p>Your account statement shows all charges (tuition, fees, housing) and payments. View your statement in the student portal under Finance > Account Summary.</p>",
    summary: "Learn how to read and understand your student account statement and balance.",
    category: "Billing",
    department: "Finance",
    tags: ["balance", "statement", "billing", "tuition"],
    author: "Finance Team",
    createdAt: "2024-12-05T14:00:00Z",
    updatedAt: "2025-01-05T10:00:00Z",
    views: 2341,
    helpfulCount: 145,
    notHelpfulCount: 8,
    featured: false,
    relatedArticles: ["kb-001", "kb-005"]
  },
  {
    id: "kb-004",
    title: "How to Request a Refund",
    slug: "request-refund",
    content: "<h2>Refund Policy</h2><p>Students who drop courses before the add/drop deadline or who have overpaid may request a refund. Refunds are processed within 5-7 business days.</p><h3>How to Apply</h3><p>Submit a refund request form with documentation of the reason for refund.</p>",
    summary: "Learn when and how to request a refund for tuition or fees.",
    category: "Refunds",
    department: "Finance",
    tags: ["refund", "overpayment", "drop course", "finance"],
    author: "Finance Team",
    createdAt: "2024-11-20T13:00:00Z",
    updatedAt: "2024-12-15T09:30:00Z",
    views: 1876,
    helpfulCount: 98,
    notHelpfulCount: 12,
    featured: false,
    relatedArticles: ["kb-002", "kb-003"]
  },
  {
    id: "kb-005",
    title: "Tax Form 1098-T Instructions",
    slug: "tax-form-1098t",
    content: "<h2>What is Form 1098-T?</h2><p>Form 1098-T is a tax document that reports tuition and fees paid during the calendar year. You'll need this to claim education tax credits.</p><h3>How to Access</h3><p>Download your 1098-T from the student portal under Finance > Tax Forms after January 31st.</p>",
    summary: "Understand what Form 1098-T is and how to access it for tax purposes.",
    category: "Tax Forms",
    department: "Finance",
    tags: ["1098-T", "tax", "tuition", "finance"],
    author: "Finance Team",
    createdAt: "2024-12-01T10:00:00Z",
    updatedAt: "2025-01-25T15:00:00Z",
    views: 3210,
    helpfulCount: 187,
    notHelpfulCount: 6,
    featured: true,
    relatedArticles: ["kb-003"]
  },
  // Remaining 45 articles generated programmatically
  ...generateKBArticles(45)
];

function generateKBArticles(count: number): KBArticle[] {
  const departments = ["Admissions", "Finance", "Registrar", "IT", "Other"] as const;
  const categories = ["Getting Started", "Policies", "How-To", "Troubleshooting", "FAQ"];
  const result: KBArticle[] = [];

  for (let i = 6; i <= count + 5; i++) {
    const dept = departments[i % departments.length];
    const cat = categories[i % categories.length];
    result.push({
      id: `kb-${String(i).padStart(3, '0')}`,
      title: `${dept} Article ${i}: ${cat}`,
      slug: `${dept.toLowerCase()}-article-${i}`,
      content: `<h2>${cat} for ${dept}</h2><p>This is a generated article with helpful information about ${dept} processes.</p>`,
      summary: `Learn about ${cat.toLowerCase()} procedures and policies for ${dept}.`,
      category: cat,
      department: dept,
      tags: [dept.toLowerCase(), cat.toLowerCase(), "help"],
      author: `${dept} Team`,
      createdAt: new Date(2024, 0, i).toISOString(),
      updatedAt: new Date(2025, 0, i).toISOString(),
      views: Math.floor(Math.random() * 3000),
      helpfulCount: Math.floor(Math.random() * 200),
      notHelpfulCount: Math.floor(Math.random() * 20),
      featured: i % 10 === 0,
      relatedArticles: [`kb-${String((i - 1) % 50 + 1).padStart(3, '0')}`]
    });
  }

  return result;
}

// ============================================
// CATALOG ITEMS (50 total)
// ============================================

export const catalogItems: CatalogItem[] = [
  // First 5 examples shown in detail:
  {
    id: "svc-001",
    name: "Tuition Payment Plan",
    description: "Request a custom payment plan for tuition fees over multiple installments (3, 6, or 12 months).",
    department: "Finance",
    estimatedResponseTime: "1-2 business days",
    icon: "💳",
    formFields: [
      { name: "name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "studentId", label: "Student ID", type: "text", required: true, validation: "^S\\d{7}$" },
      { name: "amount", label: "Total Amount", type: "text", required: true },
      { name: "installments", label: "Number of Installments", type: "select", required: true, options: ["3", "6", "12"] },
      { name: "reason", label: "Reason for Request", type: "textarea", required: true, maxLength: 500 }
    ],
    active: true
  },
  {
    id: "svc-002",
    name: "Refund Request",
    description: "Request a refund for overpayment or dropped courses. Processing time: 5-7 business days.",
    department: "Finance",
    estimatedResponseTime: "3-5 business days",
    icon: "💰",
    formFields: [
      { name: "name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "studentId", label: "Student ID", type: "text", required: true, validation: "^S\\d{7}$" },
      { name: "amount", label: "Refund Amount", type: "text", required: true },
      { name: "reason", label: "Reason for Refund", type: "textarea", required: true, maxLength: 1000 }
    ],
    active: true
  },
  {
    id: "svc-003",
    name: "Transcript Request",
    description: "Order official transcripts to be sent to other institutions or yourself.",
    department: "Registrar",
    estimatedResponseTime: "2-3 business days",
    icon: "📜",
    formFields: [
      { name: "name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "studentId", label: "Student ID", type: "text", required: true, validation: "^S\\d{7}$" },
      { name: "recipientName", label: "Recipient Name", type: "text", required: true },
      { name: "recipientAddress", label: "Recipient Address", type: "textarea", required: true, maxLength: 300 },
      { name: "copies", label: "Number of Copies", type: "select", required: true, options: ["1", "2", "3", "4", "5"] }
    ],
    active: true
  },
  {
    id: "svc-004",
    name: "Application Status Inquiry",
    description: "Check the status of your admissions application or request an update.",
    department: "Admissions",
    estimatedResponseTime: "1 business day",
    icon: "📋",
    formFields: [
      { name: "name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "applicationId", label: "Application ID", type: "text", required: true },
      { name: "program", label: "Program Applied To", type: "text", required: true },
      { name: "term", label: "Term", type: "select", required: true, options: ["Fall 2025", "Spring 2026", "Summer 2026"] },
      { name: "question", label: "Your Question", type: "textarea", required: true, maxLength: 500 }
    ],
    active: true
  },
  {
    id: "svc-005",
    name: "Password Reset",
    description: "Reset your student portal password if you've forgotten it or are locked out.",
    department: "IT",
    estimatedResponseTime: "15-30 minutes",
    icon: "🔑",
    formFields: [
      { name: "name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "studentId", label: "Student ID", type: "text", required: false, validation: "^S\\d{7}$" },
      { name: "alternateEmail", label: "Alternate Email (if portal email is inaccessible)", type: "email", required: false },
      { name: "lastLogin", label: "When did you last successfully log in?", type: "text", required: false }
    ],
    active: true
  },
  // Remaining 45 catalog items generated programmatically
  ...generateCatalogItems(45)
];

function generateCatalogItems(count: number): CatalogItem[] {
  const departments = ["Admissions", "Finance", "Registrar", "IT", "Other"] as const;
  const icons = ["📝", "💼", "🎓", "🖥️", "📞", "📧", "🏠", "🍽️"];
  const result: CatalogItem[] = [];

  for (let i = 6; i <= count + 5; i++) {
    const dept = departments[i % departments.length];
    result.push({
      id: `svc-${String(i).padStart(3, '0')}`,
      name: `${dept} Service ${i}`,
      description: `Description for ${dept} service ${i}. This service helps students with various ${dept.toLowerCase()} needs.`,
      department: dept,
      estimatedResponseTime: `${Math.floor(Math.random() * 5) + 1}-${Math.floor(Math.random() * 3) + 3} business days`,
      icon: icons[i % icons.length],
      formFields: [
        { name: "name", label: "Full Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "description", label: "Description", type: "textarea", required: true, maxLength: 1000 }
      ],
      active: true
    });
  }

  return result;
}

// ============================================
// REQUEST TICKETS (50 total)
// ============================================

export const requestTickets: RequestTicketPublic[] = [
  // First 5 examples shown in detail:
  {
    id: "req-001",
    ticketNumber: "TKT-20250001",
    status: "Resolved",
    department: "Finance",
    serviceName: "Tuition Payment Plan",
    description: "Request for 6-month payment plan for $3,500 balance",
    submittedAt: "2025-01-15T09:30:00Z",
    updatedAt: "2025-01-18T14:20:00Z",
    estimatedResolution: "2025-01-17T17:00:00Z",
    publicNotes: [
      "Agent Sarah reviewed your request.",
      "Payment plan approved for 6 months at $583.33/month."
    ],
    canReopen: true
  },
  {
    id: "req-002",
    ticketNumber: "TKT-20250002",
    status: "In Progress",
    department: "Registrar",
    serviceName: "Transcript Request",
    description: "Official transcript needed for graduate school application",
    submittedAt: "2025-01-20T11:00:00Z",
    updatedAt: "2025-01-22T09:15:00Z",
    estimatedResolution: "2025-01-24T17:00:00Z",
    publicNotes: [
      "Transcript being processed."
    ],
    canReopen: false
  },
  {
    id: "req-003",
    ticketNumber: "TKT-20250003",
    status: "Awaiting Info",
    department: "Admissions",
    serviceName: "Application Status Inquiry",
    description: "Checking on application status for Fall 2025 Computer Science program",
    submittedAt: "2025-01-18T14:45:00Z",
    updatedAt: "2025-01-19T10:30:00Z",
    estimatedResolution: "2025-01-21T17:00:00Z",
    publicNotes: [
      "We need your application ID to proceed. Please reply with this information."
    ],
    canReopen: false
  },
  {
    id: "req-004",
    ticketNumber: "TKT-20250004",
    status: "Submitted",
    department: "IT",
    serviceName: "Password Reset",
    description: "Cannot access student portal, need password reset",
    submittedAt: "2025-01-25T08:15:00Z",
    updatedAt: "2025-01-25T08:15:00Z",
    estimatedResolution: "2025-01-25T12:00:00Z",
    publicNotes: [],
    canReopen: false
  },
  {
    id: "req-005",
    ticketNumber: "TKT-20250005",
    status: "Closed",
    department: "Finance",
    serviceName: "Refund Request",
    description: "Refund for dropped course BIO 201",
    submittedAt: "2025-01-10T13:20:00Z",
    updatedAt: "2025-01-16T16:45:00Z",
    estimatedResolution: "2025-01-15T17:00:00Z",
    publicNotes: [
      "Refund of $450 processed.",
      "Funds will appear in your account within 5-7 business days."
    ],
    canReopen: false
  },
  // Remaining 45 tickets generated programmatically
  ...generateRequestTickets(45)
];

function generateRequestTickets(count: number): RequestTicketPublic[] {
  const departments = ["Admissions", "Finance", "Registrar", "IT", "Other"] as const;
  const statuses = ["Submitted", "In Progress", "Awaiting Info", "Resolved", "Closed"] as const;
  const services = [
    "General Inquiry",
    "Payment Plan",
    "Refund Request",
    "Transcript Request",
    "Application Status",
    "Password Reset",
    "Technical Support"
  ];
  const result: RequestTicketPublic[] = [];

  for (let i = 6; i <= count + 5; i++) {
    const dept = departments[i % departments.length];
    const status = statuses[i % statuses.length];
    const service = services[i % services.length];
    const submittedDate = new Date(2025, 0, i);
    const updatedDate = new Date(2025, 0, i + Math.floor(Math.random() * 3));

    result.push({
      id: `req-${String(i).padStart(3, '0')}`,
      ticketNumber: `TKT-2025${String(i).padStart(4, '0')}`,
      status,
      department: dept,
      serviceName: service,
      description: `Request for ${service} related to ${dept}`,
      submittedAt: submittedDate.toISOString(),
      updatedAt: updatedDate.toISOString(),
      estimatedResolution: new Date(updatedDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      publicNotes: status !== "Submitted" ? [`Agent assigned. Working on your request.`] : [],
      canReopen: status === "Resolved"
    });
  }

  return result;
}

// ============================================
// ANNOUNCEMENTS (10 total, not 50)
// ============================================

export const announcements: Announcement[] = [
  {
    id: "ann-001",
    title: "Spring Registration Now Open",
    content: "Registration for Spring 2025 semester is now open. Register early to secure your classes.",
    startDate: "2025-01-25T00:00:00Z",
    endDate: "2025-02-15T23:59:59Z",
    priority: "high"
  },
  {
    id: "ann-002",
    title: "Financial Aid Deadline Approaching",
    content: "Submit your FAFSA by March 1st to be considered for financial aid.",
    startDate: "2025-01-20T00:00:00Z",
    endDate: "2025-03-01T23:59:59Z",
    priority: "medium"
  },
  {
    id: "ann-003",
    title: "New Student Orientation Schedule",
    content: "New student orientation sessions will be held February 10-12. Register on the student portal.",
    startDate: "2025-01-15T00:00:00Z",
    endDate: "2025-02-12T23:59:59Z",
    priority: "medium"
  },
  {
    id: "ann-004",
    title: "Campus Wifi Maintenance",
    content: "Campus wifi will undergo maintenance on Saturday, Feb 5th from 2am-6am. Limited connectivity expected.",
    startDate: "2025-02-01T00:00:00Z",
    endDate: "2025-02-05T23:59:59Z",
    priority: "low"
  },
  {
    id: "ann-005",
    title: "Spring Career Fair",
    content: "Annual Spring Career Fair on March 15th. Meet with employers and explore internship opportunities.",
    startDate: "2025-02-15T00:00:00Z",
    endDate: "2025-03-15T23:59:59Z",
    priority: "medium"
  },
  {
    id: "ann-006",
    title: "Library Extended Hours During Finals",
    content: "The library will be open 24/7 during finals week (May 1-7). Study rooms available for reservation.",
    startDate: "2025-04-20T00:00:00Z",
    endDate: "2025-05-07T23:59:59Z",
    priority: "low"
  },
  {
    id: "ann-007",
    title: "Scholarship Application Deadline",
    content: "Apply for merit-based scholarships by March 31st. Applications available on the financial aid portal.",
    startDate: "2025-02-01T00:00:00Z",
    endDate: "2025-03-31T23:59:59Z",
    priority: "high"
  },
  {
    id: "ann-008",
    title: "Health Services Flu Shot Clinic",
    content: "Free flu shots available at Student Health Services, February 1-28. Walk-ins welcome.",
    startDate: "2025-01-25T00:00:00Z",
    endDate: "2025-02-28T23:59:59Z",
    priority: "low"
  },
  {
    id: "ann-009",
    title: "Add/Drop Deadline: February 10th",
    content: "Last day to add or drop classes without penalty is February 10th. Visit the Registrar portal to make changes.",
    startDate: "2025-01-28T00:00:00Z",
    endDate: "2025-02-10T23:59:59Z",
    priority: "high"
  },
  {
    id: "ann-010",
    title: "Campus Safety Walk",
    content: "Join Campus Safety for a night safety walk on February 20th at 7pm. Meet at the Student Center.",
    startDate: "2025-02-10T00:00:00Z",
    endDate: "2025-02-20T23:59:59Z",
    priority: "low"
  }
];

// ============================================
// TOTALS SUMMARY
// ============================================

console.log("=== SEED DATA TOTALS ===");
console.log(`KB Articles: ${kbArticles.length}`);
console.log(`Catalog Items: ${catalogItems.length}`);
console.log(`Request Tickets: ${requestTickets.length}`);
console.log(`Announcements: ${announcements.length}`);
console.log("========================");
