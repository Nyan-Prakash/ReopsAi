import { test, expect } from '@playwright/test';

test.describe('Feature Flags E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Set runtime config before navigation
    await page.addInitScript(() => {
      (window as any).__RUNTIME_CONFIG__ = {
        USE_LLM: false,
        LLM_MODE: 'none',
        PII_MASK: true,
        DEMO_SCOREBOARD: false,
        SLA_CAL_ENABLED: true,
      };
    });
  });

  test('AI draft button hidden when USE_LLM is false', async ({ page }) => {
    await page.goto('/');

    const aiButton = page.getByTestId('ai-draft-button');
    await expect(aiButton).not.toBeVisible();
  });

  test('Macro button visible when USE_LLM is false', async ({ page }) => {
    await page.goto('/');

    const macroButton = page.getByTestId('macro-button');
    await expect(macroButton).toBeVisible();
  });
});

test.describe('Feature Flags E2E - AI Enabled', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__RUNTIME_CONFIG__ = {
        USE_LLM: true,
        LLM_MODE: 'draft',
        PII_MASK: true,
        DEMO_SCOREBOARD: false,
        SLA_CAL_ENABLED: true,
      };
    });
  });

  test('AI draft button visible when USE_LLM is true and mode is draft', async ({ page }) => {
    await page.goto('/');

    const aiButton = page.getByTestId('ai-draft-button');
    await expect(aiButton).toBeVisible();
  });

  test('Both AI and macro buttons visible', async ({ page }) => {
    await page.goto('/');

    const aiButton = page.getByTestId('ai-draft-button');
    const macroButton = page.getByTestId('macro-button');

    await expect(aiButton).toBeVisible();
    await expect(macroButton).toBeVisible();
  });
});