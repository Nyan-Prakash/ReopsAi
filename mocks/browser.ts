import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW Worker for Browser (Development)
 * Aligned with SPEC_MASTER.md §20
 */
export const worker = setupWorker(...handlers);