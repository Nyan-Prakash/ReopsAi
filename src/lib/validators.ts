/**
 * Zod Validation Schemas for Public Forms
 * Aligned with SPEC §5.3
 */

import { z } from 'zod';
import { Department } from '@/types';

/**
 * Student Request Schema
 * Used for service catalog request submissions
 */
export const StudentRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  studentId: z
    .string()
    .regex(/^S\d{4}-\d{4}$/, 'Student ID format: S2024-0001')
    .optional()
    .or(z.literal('')),
  department: z.enum(['finance', 'admissions', 'registrar', 'it_support', 'student_affairs', 'general']),
  serviceId: z.string().min(1, 'Please select a service'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  attachments: z.array(z.instanceof(File)).max(3, 'Maximum 3 files allowed').optional(),
  consent: z.boolean().refine((val) => val === true, 'You must agree to the terms and conditions'),
});

export type StudentRequestInput = z.infer<typeof StudentRequestSchema>;

/**
 * Article Feedback Schema
 */
export const ArticleFeedbackSchema = z.object({
  articleId: z.string().min(1),
  helpful: z.boolean(),
  comment: z.string().max(500).optional(),
});

export type ArticleFeedbackInput = z.infer<typeof ArticleFeedbackSchema>;

/**
 * Chat Escalation Schema
 */
export const ChatEscalationSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  studentId: z
    .string()
    .regex(/^S\d{4}-\d{4}$/)
    .optional()
    .or(z.literal('')),
  department: z.enum(['finance', 'admissions', 'registrar', 'it_support', 'student_affairs', 'general']),
  context: z.string().max(1000),
  description: z.string().min(10).max(2000),
});

export type ChatEscalationInput = z.infer<typeof ChatEscalationSchema>;

/**
 * Reopen Request Schema
 */
export const ReopenRequestSchema = z.object({
  reason: z.string().min(10, 'Please provide a reason (min 10 characters)').max(500),
});

export type ReopenRequestInput = z.infer<typeof ReopenRequestSchema>;

/**
 * Knowledge Base Search Schema
 */
export const KnowledgeBaseSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  department: z.enum(['finance', 'admissions', 'registrar', 'it_support', 'student_affairs', 'general']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
  sort: z.enum(['relevance', 'date', 'views']).default('relevance'),
});

export type KnowledgeBaseSearchInput = z.infer<typeof KnowledgeBaseSearchSchema>;
