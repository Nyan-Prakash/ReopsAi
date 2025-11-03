/**
 * Seed Utilities
 * Deterministic data generation aligned with SPEC_MASTER.md §20
 */

import { createSeededRandom } from '@/lib/test-utils';

const SEED = 20251030;
const NOW = new Date('2025-01-30T12:00:00Z');
const random = createSeededRandom(SEED);

/**
 * Weighted random selection
 */
export function weighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Pick random item from array
 */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

/**
 * Pick N unique items from array
 */
export function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * Generate random date within range
 */
export function randomDate(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return new Date(startTime + random() * (endTime - startTime));
}

/**
 * Generate date with seasonal spike
 */
export function dateWithSeasonality(baseStart: Date, baseEnd: Date): Date {
  const date = randomDate(baseStart, baseEnd);
  const month = date.getMonth();
  const year = date.getFullYear();

  // August 2024: +40% volume
  if (year === 2024 && month === 7 && random() < 0.4) {
    return new Date(2024, 7, Math.floor(random() * 31) + 1);
  }

  // January 2025: +35% volume
  if (year === 2025 && month === 0 && random() < 0.35) {
    return new Date(2025, 0, Math.floor(random() * 30) + 1);
  }

  return date;
}

/**
 * Calculate SLA deadline based on department and priority
 */
export function calculateSLADeadline(
  createdAt: Date,
  department: string,
  priority: string
): Date {
  const slaHours: Record<string, Record<string, number>> = {
    finance: { low: 48, medium: 24, high: 24, urgent: 4 },
    admissions: { low: 48, medium: 48, high: 24, urgent: 24 },
    registrar: { low: 48, medium: 24, high: 24, urgent: 4 },
    it_support: { low: 24, medium: 24, high: 4, urgent: 4 },
    student_affairs: { low: 72, medium: 72, high: 48, urgent: 24 },
    general: { low: 72, medium: 48, high: 24, urgent: 12 },
  };

  const hours = slaHours[department]?.[priority] || 48;
  const deadline = new Date(createdAt);
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

/**
 * Calculate SLA risk based on deadline and current status
 */
export function calculateSLARisk(
  slaDeadline: Date | null,
  status: string,
  resolvedAt: Date | null,
  closedAt: Date | null
): string {
  if (!slaDeadline) return 'on_track';

  const now = NOW;

  // If resolved or closed, check if it was before deadline
  if (status === 'resolved' || status === 'closed') {
    const completionTime = resolvedAt || closedAt;
    if (completionTime && completionTime > slaDeadline) {
      return 'breached';
    }
    return 'on_track';
  }

  // For open/pending cases
  const hoursUntilDeadline =
    (slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilDeadline < 0) {
    return 'breached';
  } else if (hoursUntilDeadline <= 4) {
    return 'at_risk';
  }
  return 'on_track';
}

/**
 * Generate realistic student name
 */
export function generateName(locale: 'en' | 'ar' = 'en'): string {
  const enFirstNames = [
    'Ahmed', 'Sara', 'Mohammed', 'Fatima', 'Omar', 'Layla', 'Ali', 'Mariam',
    'Hassan', 'Noor', 'Youssef', 'Zainab', 'Khalid', 'Amira', 'Abdullah',
  ];

  const enLastNames = [
    'Al-Mansoori', 'Hassan', 'Ibrahim', 'Al-Hassan', 'Said', 'Al-Rashid',
    'Al-Farsi', 'Al-Khoury', 'Al-Najjar', 'Al-Maliki',
  ];

  const arFirstNames = [
    'أحمد', 'سارة', 'محمد', 'فاطمة', 'عمر', 'ليلى', 'علي', 'مريم',
    'حسن', 'نور', 'يوسف', 'زينب', 'خالد', 'أميرة', 'عبدالله',
  ];

  const arLastNames = [
    'المنصوري', 'حسن', 'إبراهيم', 'الحسن', 'سعيد', 'الرشيد',
    'الفارسي', 'الخوري', 'النجار', 'المالكي',
  ];

  if (locale === 'ar') {
    return `${pick(arFirstNames)} ${pick(arLastNames)}`;
  }
  return `${pick(enFirstNames)} ${pick(enLastNames)}`;
}

/**
 * Generate realistic email from name
 */
export function generateEmail(name: string, domain: string = 'student.reops.example'): string {
  const slug = name.toLowerCase().replace(/\s+/g, '.').replace(/[^\w.-]/g, '');
  return `${slug}@${domain}`;
}

/**
 * Generate student ID with pattern S2024-XXXX
 */
export function generateStudentId(index: number): string {
  const year = 2024;
  const id = String(index).padStart(4, '0');
  return `S${year}-${id}`;
}

export { SEED, NOW, random };