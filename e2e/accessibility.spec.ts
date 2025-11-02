import { test, expect } from '@playwright/test';
import AxeBuilder from 'axe-playwright';

test.describe('Accessibility Tests @a11y', () => {
  test('ErrorBoundary should not have accessibility violations', async ({ page }) => {
    await page.goto('/error-test');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('LoadingBoundary should not have accessibility violations', async ({ page }) => {
    await page.goto('/loading-test');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('CaseComposer should not have accessibility violations', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__RUNTIME_CONFIG__ = {
        USE_LLM: true,
        LLM_MODE: 'draft',
        PII_MASK: true,
        DEMO_SCOREBOARD: false,
        SLA_CAL_ENABLED: true,
      };
    });

    await page.goto('/');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="case-composer"]')
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('CaseComposer with AI disabled should not have accessibility violations', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__RUNTIME_CONFIG__ = {
        USE_LLM: false,
        LLM_MODE: 'none',
        PII_MASK: true,
        DEMO_SCOREBOARD: false,
        SLA_CAL_ENABLED: true,
      };
    });

    await page.goto('/');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="case-composer"]')
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});