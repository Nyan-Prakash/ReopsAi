import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW Server for Node.js (Vitest tests)
 * Aligned with SPEC_MASTER.md §20
 */
export const server = setupServer(...handlers);