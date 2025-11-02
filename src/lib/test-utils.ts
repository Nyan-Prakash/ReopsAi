/**
 * Test Utilities
 * Mock clock and deterministic helpers
 * Aligned with SPEC_MASTER.md §20
 */

import { vi } from 'vitest';

/**
 * Mock Clock Helper
 * Provides deterministic time for tests
 */
export class MockClock {
  private currentTime: Date;

  constructor(initialTime: Date | string = '2025-01-30T12:00:00Z') {
    this.currentTime = new Date(initialTime);
  }

  /**
   * Get current mock time
   */
  now(): Date {
    return new Date(this.currentTime);
  }

  /**
   * Advance time by milliseconds
   */
  advance(ms: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + ms);
  }

  /**
   * Advance time by days
   */
  advanceDays(days: number): void {
    this.advance(days * 24 * 60 * 60 * 1000);
  }

  /**
   * Advance time by hours
   */
  advanceHours(hours: number): void {
    this.advance(hours * 60 * 60 * 1000);
  }

  /**
   * Set absolute time
   */
  setTime(time: Date | string): void {
    this.currentTime = new Date(time);
  }

  /**
   * Install mock clock globally
   */
  install(): void {
    vi.setSystemTime(this.currentTime);
  }

  /**
   * Uninstall mock clock
   */
  uninstall(): void {
    vi.useRealTimers();
  }

  /**
   * Reset to initial time
   */
  reset(initialTime: Date | string = '2025-01-30T12:00:00Z'): void {
    this.currentTime = new Date(initialTime);
    vi.setSystemTime(this.currentTime);
  }
}

/**
 * Create a mock clock instance
 */
export function createMockClock(initialTime?: Date | string): MockClock {
  return new MockClock(initialTime);
}

/**
 * Seeded random number generator (for deterministic tests)
 * Aligned with §20.1
 */
export function createSeededRandom(seed: number = 20251030): () => number {
  let state = seed;
  return function () {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * Wait for async operations (useful in tests)
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock localStorage for tests
 */
export function createMockStorage(): Storage {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
}