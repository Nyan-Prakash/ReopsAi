import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockClock, createMockClock, createSeededRandom } from './test-utils';

describe('test-utils', () => {
  describe('MockClock', () => {
    let clock: MockClock;

    beforeEach(() => {
      clock = createMockClock();
    });

    afterEach(() => {
      clock.uninstall();
    });

    it('initializes with default time', () => {
      const now = clock.now();
      expect(now.toISOString()).toBe('2025-01-30T12:00:00.000Z');
    });

    it('initializes with custom time', () => {
      const customClock = createMockClock('2024-08-15T10:00:00Z');
      expect(customClock.now().toISOString()).toBe('2024-08-15T10:00:00.000Z');
    });

    it('advances time by milliseconds', () => {
      clock.advance(5000);
      expect(clock.now().toISOString()).toBe('2025-01-30T12:00:05.000Z');
    });

    it('advances time by hours', () => {
      clock.advanceHours(2);
      expect(clock.now().toISOString()).toBe('2025-01-30T14:00:00.000Z');
    });

    it('advances time by days', () => {
      clock.advanceDays(1);
      expect(clock.now().toISOString()).toBe('2025-01-31T12:00:00.000Z');
    });

    it('sets absolute time', () => {
      clock.setTime('2024-12-25T00:00:00Z');
      expect(clock.now().toISOString()).toBe('2024-12-25T00:00:00.000Z');
    });

    it('installs global mock time', () => {
      clock.install();
      const beforeAdvance = new Date();
      clock.advance(1000);
      const afterAdvance = new Date();
      expect(afterAdvance.getTime() - beforeAdvance.getTime()).toBe(1000);
    });

    it('resets to initial time', () => {
      clock.advance(5000);
      clock.reset();
      expect(clock.now().toISOString()).toBe('2025-01-30T12:00:00.000Z');
    });

    it('resets to custom time', () => {
      clock.reset('2024-01-01T00:00:00Z');
      expect(clock.now().toISOString()).toBe('2024-01-01T00:00:00.000Z');
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