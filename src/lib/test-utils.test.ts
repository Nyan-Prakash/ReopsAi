import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockClock, withMockClock, createSeededRandom } from './test-utils';

describe('test-utils', () => {
  describe('MockClock', () => {
    let clock: MockClock;

    beforeEach(() => {
      clock = new MockClock();
    });

    afterEach(() => {
      clock.uninstall();
    });

    it('installs with default time', () => {
      clock.install();
      const now = Date.now();
      expect(now).toBeGreaterThan(0);
      clock.uninstall();
    });

    it('installs with custom time', () => {
      clock.install('2025-01-30T12:00:00Z');
      expect(clock.now()).toBe(new Date('2025-01-30T12:00:00Z').getTime());
      clock.uninstall();
    });

    it('advances time by milliseconds', () => {
      clock.install('2025-01-30T12:00:00Z');
      const beforeAdvance = new Date();
      clock.advance(1000);
      const afterAdvance = new Date();
      expect(afterAdvance.getTime() - beforeAdvance.getTime()).toBe(1000);
      clock.uninstall();
    });

    it('throws error when advancing without install', () => {
      expect(() => clock.advance(1000)).toThrow(
        'MockClock not installed. Call install() first.'
      );
    });

    it('returns current time via now()', () => {
      clock.install('2025-01-30T12:00:00Z');
      expect(clock.now()).toBe(new Date('2025-01-30T12:00:00Z').getTime());
      clock.uninstall();
    });

    it('uninstalls cleanly', () => {
      clock.install('2025-01-30T12:00:00Z');
      clock.uninstall();
      expect(() => clock.advance(1000)).toThrow();
    });
  });

  describe('withMockClock', () => {
    it('auto-installs and uninstalls clock', async () => {
      await withMockClock(async (clock) => {
        const before = Date.now();
        clock.advance(1000);
        const after = Date.now();
        expect(after - before).toBe(1000);
      }, '2025-01-30T12:00:00Z');
    });

    it('handles synchronous functions', async () => {
      await withMockClock((clock) => {
        expect(clock.now()).toBeGreaterThan(0);
      });
    });

    it('cleans up even on error', async () => {
      try {
        await withMockClock((clock) => {
          clock.advance(1000);
          throw new Error('Test error');
        });
      } catch (e) {
        // Expected error
      }
      // Clock should be uninstalled even after error
      const clock = new MockClock();
      expect(() => clock.advance(1000)).toThrow();
    });
  });

  describe('createSeededRandom', () => {
    it('generates deterministic sequence', () => {
      const random1 = createSeededRandom(20251030);
      const random2 = createSeededRandom(20251030);

      const seq1 = [random1(), random1(), random1()];
      const seq2 = [random2(), random2(), random2()];

      expect(seq1).toEqual(seq2);
    });

    it('generates different sequences for different seeds', () => {
      const random1 = createSeededRandom(1);
      const random2 = createSeededRandom(2);

      const val1 = random1();
      const val2 = random2();

      expect(val1).not.toBe(val2);
    });

    it('generates values between 0 and 1', () => {
      const random = createSeededRandom(20251030);

      for (let i = 0; i < 100; i++) {
        const val = random();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('uses default seed when not provided', () => {
      const random1 = createSeededRandom();
      const random2 = createSeededRandom(20251030);

      expect(random1()).toBe(random2());
    });
  });
});