import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset any request handlers that we may add during the tests
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Clean up after the tests are finished
afterAll(() => {
  server.close();
});

// Mock window.__RUNTIME_CONFIG__
(global as any).window = {
  __RUNTIME_CONFIG__: {
    USE_LLM: false,
    LLM_MODE: 'none',
    PII_MASK: true,
    DEMO_SCOREBOARD: false,
    SLA_CAL_ENABLED: true,
  },
};