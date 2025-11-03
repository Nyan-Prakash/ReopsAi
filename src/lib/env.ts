/**
 * Environment configuration
 * Demo mode flag for serving local fixtures instead of real backend
 */

export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === '1' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';