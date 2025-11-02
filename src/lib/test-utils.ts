import { vi } from 'vitest';

/**
 * MockClock wraps Vitest fake timers so advancing time also advances Date.now()/new Date().
 * Usage:
 *   const clock = new MockClock();
 *   clock.install('2025-01-01T00:00:00Z');
 *   // ... do things
 *   clock.advance(1000); // +1s
 *   clock.uninstall();
 */
export class MockClock {
  private installed = false;
  private start = 0;

  install(now?: number | Date | string) {
    vi.useFakeTimers();
    const ts =
      now === undefined
        ? Date.now()
        : typeof now === 'number'
          ? now
          : new Date(now).getTime();
    this.start = ts;
    vi.setSystemTime(ts);
    this.installed = true;
  }

  /**
   * Advance timers AND system clock by `ms`.
   * Requires install() first.
   */
  advance(ms: number) {
    if (!this.installed) {
      throw new Error('MockClock not installed. Call install() first.');
    }
    vi.advanceTimersByTime(ms);
  }

  now(): number {
    return Date.now();
  }

  uninstall() {
    if (this.installed) {
      vi.useRealTimers();
      this.installed = false;
    }
  }
}

/**
 * Helper to scope a test with a clock that auto-cleans.
 */
export async function withMockClock<T>(
  fn: (clock: MockClock) => Promise<T> | T,
  start?: number | Date | string
): Promise<T> {
  const clock = new MockClock();
  clock.install(start);
  try {
    return await fn(clock);
  } finally {
    clock.uninstall();
  }
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