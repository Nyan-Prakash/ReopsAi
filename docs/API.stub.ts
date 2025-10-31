// Public API Endpoints (MSW stubs)

/**
 * GET /kb
 * Query: ?q=search&category=admissions&dept=Finance&featured=true&page=1&limit=20
 * Response: KBArticle[]
 */
export const getKBArticles = {
  request: { query: "tuition payment", category: "finance", page: 1 },
  response: {
    data: [
      {
        id: "a1b2c3",
        title: "How to Pay Tuition Online",
        slug: "how-to-pay-tuition-online",
        content: "<h2>Payment Methods</h2><p>We accept...</p>",
        summary: "Learn about online tuition payment options including credit card, bank transfer, and payment plans.",
        category: "Payments",
        department: "Finance",
        tags: ["tuition", "payment", "online"],
        author: "Finance Team",
        createdAt: "2025-01-15T10:00:00Z",
        updatedAt: "2025-01-20T14:30:00Z",
        views: 1542,
        helpfulCount: 89,
        notHelpfulCount: 3,
        featured: true,
        relatedArticles: ["b2c3d4", "c3d4e5"]
      }
    ],
    total: 127,
    page: 1,
    pages: 7
  }
};

/**
 * GET /kb/:id
 * Response: KBArticle
 */
export const getKBArticle = {
  request: { id: "a1b2c3" },
  response: {
    id: "a1b2c3",
    title: "How to Pay Tuition Online",
    slug: "how-to-pay-tuition-online",
    content: "<h2>Payment Methods</h2><p>We accept credit cards, bank transfers, and payment plans...</p>",
    summary: "Learn about online tuition payment options including credit card, bank transfer, and payment plans.",
    category: "Payments",
    department: "Finance",
    tags: ["tuition", "payment", "online"],
    author: "Finance Team",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-20T14:30:00Z",
    views: 1542,
    helpfulCount: 89,
    notHelpfulCount: 3,
    featured: true,
    relatedArticles: ["b2c3d4", "c3d4e5"]
  }
};

/**
 * GET /catalog
 * Query: ?dept=Finance
 * Response: CatalogItem[]
 */
export const getCatalog = {
  request: { dept: "Finance" },
  response: [
    {
      id: "svc-001",
      name: "Tuition Payment Plan",
      description: "Request a custom payment plan for tuition fees over multiple installments.",
      department: "Finance",
      estimatedResponseTime: "1-2 business days",
      icon: "💳",
      formFields: [
        { name: "name", label: "Full Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "studentId", label: "Student ID", type: "text", required: true, validation: "^S\\d{7}$" },
        { name: "amount", label: "Total Amount", type: "text", required: true },
        { name: "installments", label: "Installments", type: "select", required: true, options: ["3", "6", "12"] },
        { name: "reason", label: "Reason for Request", type: "textarea", required: true, maxLength: 500 }
      ],
      active: true
    },
    {
      id: "svc-002",
      name: "Refund Request",
      description: "Request a refund for overpayment or dropped courses.",
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
    }
  ]
};

/**
 * POST /request
 * Body: { serviceId, studentInfo, formData, attachments? }
 * Response: RequestTicketPublic
 */
export const createRequest = {
  request: {
    serviceId: "svc-001",
    studentInfo: { name: "Ahmed Ali", email: "ahmed@example.com", studentId: "S1234567" },
    formData: { amount: "5000", installments: "6", reason: "Financial hardship" }
  },
  response: {
    id: "req-abc123",
    ticketNumber: "TKT-20250042",
    status: "Submitted",
    department: "Finance",
    serviceName: "Tuition Payment Plan",
    description: "Request for 6-month payment plan",
    submittedAt: "2025-01-30T09:15:00Z",
    updatedAt: "2025-01-30T09:15:00Z",
    publicNotes: [],
    canReopen: false
  }
};

/**
 * GET /request/:id
 * Query: ?token=uuid (for anonymous access)
 * Response: RequestTicketPublic
 */
export const getRequest = {
  request: { id: "req-abc123", token: "tok-xyz789" },
  response: {
    id: "req-abc123",
    ticketNumber: "TKT-20250042",
    status: "In Progress",
    department: "Finance",
    serviceName: "Tuition Payment Plan",
    description: "Request for 6-month payment plan",
    submittedAt: "2025-01-30T09:15:00Z",
    updatedAt: "2025-01-30T14:22:00Z",
    publicNotes: ["Agent Sarah reviewed your request. Processing payment plan setup."],
    canReopen: false
  }
};

/**
 * POST /chat/escalate
 * Body: ChatEscalationPayload
 * Response: RequestTicketPublic
 */
export const escalateChat = {
  request: {
    context: "Student requested help via chat",
    department: "Finance",
    serviceId: "svc-001",
    studentInfo: { name: "Sara Mohammed", email: "sara@example.com" },
    description: "Need help setting up payment plan. Chat assistant unavailable."
  },
  response: {
    id: "req-chat001",
    ticketNumber: "TKT-20250043",
    status: "Submitted",
    department: "Finance",
    serviceName: "Tuition Payment Plan",
    description: "Escalated from chat: Need help setting up payment plan.",
    submittedAt: "2025-01-30T10:00:00Z",
    updatedAt: "2025-01-30T10:00:00Z",
    publicNotes: [],
    canReopen: false
  }
};

/**
 * GET /announcements
 * Query: ?limit=3
 * Response: Announcement[]
 */
export const getAnnouncements = {
  request: { limit: 3 },
  response: [
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
    }
  ]
};

/**
 * POST /kb/:id/feedback
 * Body: { helpful: boolean, comment?: string }
 * Response: { success: boolean }
 */
export const submitArticleFeedback = {
  request: {
    articleId: "a1b2c3",
    helpful: true,
    comment: "Very helpful, clear instructions"
  },
  response: {
    success: true,
    message: "Thank you for your feedback!"
  }
};

/**
 * PATCH /request/:id/reopen
 * Body: { reason: string }
 * Response: RequestTicketPublic
 */
export const reopenRequest = {
  request: {
    ticketId: "req-abc123",
    reason: "Issue not fully resolved"
  },
  response: {
    id: "req-abc123",
    ticketNumber: "TKT-20250042",
    status: "In Progress",
    department: "Finance",
    serviceName: "Tuition Payment Plan",
    description: "Request for 6-month payment plan",
    submittedAt: "2025-01-30T09:15:00Z",
    updatedAt: "2025-02-05T11:30:00Z",
    publicNotes: [
      "Agent Sarah reviewed your request. Processing payment plan setup.",
      "Ticket reopened by student: Issue not fully resolved"
    ],
    canReopen: false
  }
};
