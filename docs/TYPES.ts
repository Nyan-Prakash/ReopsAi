// Student/Public-facing types

export interface KBArticle {
  id: string; // uuid
  title: string;
  slug: string;
  content: string; // HTML or markdown
  summary: string; // 160 chars
  category: string;
  department: "Admissions" | "Finance" | "Registrar" | "IT" | "Other";
  tags: string[];
  author: string;
  createdAt: string; // ISO
  updatedAt: string;
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  featured: boolean;
  relatedArticles: string[]; // article IDs
}

export interface CatalogItem {
  id: string; // uuid
  name: string;
  description: string;
  department: "Admissions" | "Finance" | "Registrar" | "IT" | "Other";
  estimatedResponseTime: string; // "1-2 business days"
  icon: string; // emoji or icon name
  formFields: FormField[]; // dynamic schema
  active: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "file" | "checkbox";
  required: boolean;
  options?: string[]; // for select
  placeholder?: string;
  validation?: string; // regex pattern
  maxLength?: number;
}

export interface RequestTicketPublic {
  id: string; // uuid
  ticketNumber: string; // "TKT-20250001"
  status: "Submitted" | "In Progress" | "Awaiting Info" | "Resolved" | "Closed";
  department: string;
  serviceName: string;
  description: string;
  submittedAt: string;
  updatedAt: string;
  estimatedResolution?: string;
  publicNotes: string[]; // agent notes visible to student
  canReopen: boolean;
}

export interface StudentProfile {
  id?: string; // optional for anonymous
  name: string;
  email: string;
  studentId?: string; // S1234567
  phone?: string;
  preferredLanguage: "en" | "ar";
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>; // fieldName -> error message
}

export interface ChatEscalationPayload {
  context: string; // "Student requested help via chat"
  department: string;
  serviceId: string;
  studentInfo: Partial<StudentProfile>;
  description: string;
}

// Remaining types:
// - Announcement: { id, title, content, startDate, endDate, priority }
// - FeedbackPayload: { articleId, helpful: boolean, comment?: string }
// - ReopenRequest: { ticketId, reason: string }

export interface Announcement {
  id: string;
  title: string;
  content: string;
  startDate: string;
  endDate: string;
  priority: "low" | "medium" | "high";
}

export interface FeedbackPayload {
  articleId: string;
  helpful: boolean;
  comment?: string;
}

export interface ReopenRequest {
  ticketId: string;
  reason: string;
}
