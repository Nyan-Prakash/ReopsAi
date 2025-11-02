import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getRuntimeConfig,
  setRuntimeConfig,
  resetRuntimeConfig,
  getFlag,
  isAIEnabled,
  isDraftAIEnabled,
  isClassifyAIEnabled,
  isPIIMaskEnabled,
  isDemoScoreboardEnabled,
  isSLACalendarEnabled,
  DEFAULT_CONFIG,
  type RuntimeConfig,
} from './runtime_config';

describe('runtime_config', () => {
  beforeEach(() => {
    resetRuntimeConfig();
  });

  afterEach(() => {
    resetRuntimeConfig();
  });

  describe('getRuntimeConfig', () => {
    it('returns default config when not initialized', () => {
      const config = getRuntimeConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('returns frozen config object', () => {
      const config = getRuntimeConfig();
      expect(Object.isFrozen(config)).toBe(true);
    });

    it('prevents mutation of returned config', () => {
      const config = getRuntimeConfig();
      expect(() => {
        (config as any).USE_LLM = true;
      }).toThrow();
    });
  });

  describe('setRuntimeConfig', () => {
    it('updates config with partial values', () => {
      setRuntimeConfig({ USE_LLM: true });
      const config = getRuntimeConfig();
      expect(config.USE_LLM).toBe(true);
      expect(config.LLM_MODE).toBe('none');
    });

    it('preserves existing values when updating', () => {
      setRuntimeConfig({ USE_LLM: true, LLM_MODE: 'draft' });
      setRuntimeConfig({ PII_MASK: false });
      const config = getRuntimeConfig();
      expect(config.USE_LLM).toBe(true);
      expect(config.LLM_MODE).toBe('draft');
      expect(config.PII_MASK).toBe(false);
    });
  });

  describe('getFlag', () => {
    it('returns specific flag value', () => {
      expect(getFlag('USE_LLM')).toBe(false);
      setRuntimeConfig({ USE_LLM: true });
      expect(getFlag('USE_LLM')).toBe(true);
    });

    it('returns correct type for each flag', () => {
      expect(typeof getFlag('USE_LLM')).toBe('boolean');
      expect(typeof getFlag('LLM_MODE')).toBe('string');
      expect(typeof getFlag('PII_MASK')).toBe('boolean');
    });
  });

  describe('resetRuntimeConfig', () => {
    it('resets config to defaults', () => {
      setRuntimeConfig({ USE_LLM: true, PII_MASK: false });
      resetRuntimeConfig();
      const config = getRuntimeConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('Feature Flag Guards', () => {
    describe('isAIEnabled', () => {
      it('returns false when USE_LLM is false', () => {
        setRuntimeConfig({ USE_LLM: false, LLM_MODE: 'draft' });
        expect(isAIEnabled()).toBe(false);
      });

      it('returns false when LLM_MODE is none', () => {
        setRuntimeConfig({ USE_LLM: true, LLM_MODE: 'none' });
        expect(isAIEnabled()).toBe(false);
      });

      it('returns true when USE_LLM is true and mode is draft', () => {
        setRuntimeConfig({ USE_LLM: true, LLM_MODE: 'draft' });
        expect(isAIEnabled()).toBe(true);
      });

      it('returns true when USE_LLM is true and mode is classify', () => {
        setRuntimeConfig({ USE_LLM: true, LLM_MODE: 'classify' });
        expect(isAIEnabled()).toBe(true);
      });
    });

    describe('isDraftAIEnabled', () => {
      it('returns true only when USE_LLM is true and mode is draft', () => {
        setRuntimeConfig({ USE_LLM: true, LLM_MODE: 'draft' });
        expect(isDraftAIEnabled()).toBe(true);
      });

      it('returns false when mode is classify', () => {
        setRuntimeConfig({ USE_LLM: true, LLM_MODE: 'classify' });
        expect(isDraftAIEnabled()).toBe(false);
      });

      it('returns false when USE_LLM is false', () => {
        setRuntimeConfig({ USE_LLM: false, LLM_MODE: 'draft' });
        expect(isDraftAIEnabled()).toBe(false);
      });
    });

    describe('isClassifyAIEnabled', () => {
      it('returns true only when USE_LLM is true and mode is classify', () => {
        setRuntimeConfig({ USE_LLM: true, LLM_MODE: 'classify' });
        expect(isClassifyAIEnabled()).toBe(true);
      });

      it('returns false when mode is draft', () => {
        setRuntimeConfig({ USE_LLM: true, LLM_MODE: 'draft' });
        expect(isClassifyAIEnabled()).toBe(false);
      });
    });

    describe('isPIIMaskEnabled', () => {
      it('returns true by default', () => {
        expect(isPIIMaskEnabled()).toBe(true);
      });

      it('returns false when explicitly disabled', () => {
        setRuntimeConfig({ PII_MASK: false });
        expect(isPIIMaskEnabled()).toBe(false);
      });
    });

    describe('isDemoScoreboardEnabled', () => {
      it('returns false by default', () => {
        expect(isDemoScoreboardEnabled()).toBe(false);
      });

      it('returns true when explicitly enabled', () => {
        setRuntimeConfig({ DEMO_SCOREBOARD: true });
        expect(isDemoScoreboardEnabled()).toBe(true);
      });
    });

    describe('isSLACalendarEnabled', () => {
      it('returns true by default', () => {
        expect(isSLACalendarEnabled()).toBe(true);
      });

      it('returns false when explicitly disabled', () => {
        setRuntimeConfig({ SLA_CAL_ENABLED: false });
        expect(isSLACalendarEnabled()).toBe(false);
      });
    });
  });

  describe('Flag Matrix Snapshot', () => {
    it('matches expected default configuration', () => {
      const config = getRuntimeConfig();
      expect(config).toMatchSnapshot();
    });

    it('matches configuration with all AI features enabled', () => {
      setRuntimeConfig({
        USE_LLM: true,
        LLM_MODE: 'draft',
        PII_MASK: false,
        DEMO_SCOREBOARD: true,
        SLA_CAL_ENABLED: true,
      });
      const config = getRuntimeConfig();
      expect(config).toMatchSnapshot();
    });

    it('matches configuration with classify mode', () => {
      setRuntimeConfig({
        USE_LLM: true,
        LLM_MODE: 'classify',
      });
      const config = getRuntimeConfig();
      expect(config).toMatchSnapshot();
    });

    it('matches configuration with minimal features', () => {
      setRuntimeConfig({
        USE_LLM: false,
        LLM_MODE: 'none',
        PII_MASK: true,
        DEMO_SCOREBOARD: false,
        SLA_CAL_ENABLED: false,
      });
      const config = getRuntimeConfig();
      expect(config).toMatchSnapshot();
    });
  });

  describe('Type Safety', () => {
    it('enforces LLM_MODE type constraints', () => {
      const config: RuntimeConfig = {
        USE_LLM: true,
        LLM_MODE: 'draft',
        PII_MASK: true,
        DEMO_SCOREBOARD: false,
        SLA_CAL_ENABLED: true,
      };
      expect(['none', 'draft', 'classify']).toContain(config.LLM_MODE);
    });
  });
});