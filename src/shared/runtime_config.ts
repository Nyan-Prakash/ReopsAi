/**
 * Runtime Configuration and Feature Flags
 * Aligned with SPEC_MASTER.md §1, §17
 */

export type LLMMode = 'none' | 'draft' | 'classify';

export interface RuntimeConfig {
  USE_LLM: boolean;
  LLM_MODE: LLMMode;
  PII_MASK: boolean;
  DEMO_SCOREBOARD: boolean;
  SLA_CAL_ENABLED: boolean;
}

const DEFAULT_CONFIG: RuntimeConfig = {
  USE_LLM: false,
  LLM_MODE: 'none',
  PII_MASK: true,
  DEMO_SCOREBOARD: false,
  SLA_CAL_ENABLED: true,
};

let runtimeConfig: RuntimeConfig = { ...DEFAULT_CONFIG };

/**
 * Initialize runtime configuration from environment variables
 * Called on app bootstrap
 */
export function initRuntimeConfig(): RuntimeConfig {
  if (typeof window === 'undefined') {
    // Server-side: read from process.env
    runtimeConfig = {
      USE_LLM: process.env.NEXT_PUBLIC_USE_LLM === 'true',
      LLM_MODE: (process.env.NEXT_PUBLIC_LLM_MODE as LLMMode) || 'none',
      PII_MASK: process.env.NEXT_PUBLIC_PII_MASK !== 'false',
      DEMO_SCOREBOARD: process.env.NEXT_PUBLIC_DEMO_SCOREBOARD === 'true',
      SLA_CAL_ENABLED: process.env.NEXT_PUBLIC_SLA_CAL_ENABLED !== 'false',
    };
  } else {
    // Client-side: read from window.__RUNTIME_CONFIG__ or localStorage (for dev)
    const envConfig = (window as any).__RUNTIME_CONFIG__ as Partial<RuntimeConfig>;
    runtimeConfig = {
      USE_LLM: envConfig?.USE_LLM ?? DEFAULT_CONFIG.USE_LLM,
      LLM_MODE: envConfig?.LLM_MODE ?? DEFAULT_CONFIG.LLM_MODE,
      PII_MASK: envConfig?.PII_MASK ?? DEFAULT_CONFIG.PII_MASK,
      DEMO_SCOREBOARD: envConfig?.DEMO_SCOREBOARD ?? DEFAULT_CONFIG.DEMO_SCOREBOARD,
      SLA_CAL_ENABLED: envConfig?.SLA_CAL_ENABLED ?? DEFAULT_CONFIG.SLA_CAL_ENABLED,
    };
  }

  return runtimeConfig;
}

/**
 * Get current runtime configuration
 * Type-safe getter for feature flags
 */
export function getRuntimeConfig(): Readonly<RuntimeConfig> {
  return Object.freeze({ ...runtimeConfig });
}

/**
 * Get a specific flag value
 */
export function getFlag<K extends keyof RuntimeConfig>(key: K): RuntimeConfig[K] {
  return runtimeConfig[key];
}

/**
 * Set runtime configuration (for testing only)
 * @internal
 */
export function setRuntimeConfig(config: Partial<RuntimeConfig>): void {
  runtimeConfig = { ...runtimeConfig, ...config };
}

/**
 * Reset runtime configuration to defaults (for testing only)
 * @internal
 */
export function resetRuntimeConfig(): void {
  runtimeConfig = { ...DEFAULT_CONFIG };
}

/**
 * Feature flag guards (React hooks)
 */
export function useRuntimeConfig(): Readonly<RuntimeConfig> {
  return getRuntimeConfig();
}

/**
 * Check if AI features are enabled
 */
export function isAIEnabled(): boolean {
  return runtimeConfig.USE_LLM && runtimeConfig.LLM_MODE !== 'none';
}

/**
 * Check if draft composer AI is enabled
 */
export function isDraftAIEnabled(): boolean {
  return runtimeConfig.USE_LLM && runtimeConfig.LLM_MODE === 'draft';
}

/**
 * Check if classification AI is enabled
 */
export function isClassifyAIEnabled(): boolean {
  return runtimeConfig.USE_LLM && runtimeConfig.LLM_MODE === 'classify';
}

/**
 * Check if PII masking is enabled
 */
export function isPIIMaskEnabled(): boolean {
  return runtimeConfig.PII_MASK;
}

/**
 * Check if demo scoreboard is enabled
 */
export function isDemoScoreboardEnabled(): boolean {
  return runtimeConfig.DEMO_SCOREBOARD;
}

/**
 * Check if SLA calendar is enabled
 */
export function isSLACalendarEnabled(): boolean {
  return runtimeConfig.SLA_CAL_ENABLED;
}

/**
 * Export default config for reference
 */
export { DEFAULT_CONFIG };