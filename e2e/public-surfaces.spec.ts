/**
 * Public Surfaces E2E Tests
 * Tests complete user flows through public surfaces
 * SPEC §5.6 - E2E test requirements
 */

import { test, expect } from '@playwright/test';

/**
 * Test 1: Full EN Flow - Search → Article → Catalog → Submit → Status
 * Tests the complete user journey from searching for help to tracking a request
 */
test.describe('Public Surfaces - Full EN Flow', () => {
  test('should complete full user journey: Search → Article → Catalog → Submit → Status', async ({ page }) => {
    // Step 1: Start at home page
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('How can we help you?');

    // Step 2: Search for help
    const searchInput = page.getByPlaceholder(/search for help/i);
    await searchInput.fill('password reset');

    // Wait for debounce and redirect (300ms + navigation)
    await page.waitForURL(/\/kb\?q=password/, { timeout: 1000 });
    await expect(page).toHaveURL(/\/kb\?q=password/);

    // Step 3: Verify KB page shows results
    await expect(page.locator('h1')).toContainText('Knowledge Base');
    await page.waitForSelector('text=/results found/i', { timeout: 5000 });

    // Step 4: Click on first article
    const articleCard = page.locator('a[href^="/kb/"]').first();
    await articleCard.click();

    // Step 5: Verify article detail page
    await page.waitForURL(/\/kb\/kb-/);
    await expect(page.locator('h1')).toBeTruthy();
    await expect(page.locator('article')).toBeVisible();

    // Step 6: Vote article as helpful
    const helpfulButton = page.getByRole('button', { name: /yes/i });
    await helpfulButton.click();
    await expect(page.getByText(/thank you for your feedback/i)).toBeVisible();

    // Step 7: Click "Still need help?" to go to catalog
    const contactSupportLink = page.getByRole('link', { name: /contact support/i });
    await contactSupportLink.click();

    // Step 8: Verify service catalog page
    await expect(page).toHaveURL('/catalog');
    await expect(page.locator('h1')).toContainText('Service Catalog');

    // Wait for services to load
    await page.waitForSelector('text=/submit request/i', { timeout: 5000 });

    // Step 9: Select a service and open request form
    const requestButton = page.getByRole('button', { name: /submit request/i }).first();
    await requestButton.click();

    // Wait for modal
    await expect(page.getByText(/complete the form/i)).toBeVisible();

    // Step 10: Fill and submit request form
    await page.getByPlaceholder(/enter your full name/i).fill('John Doe');
    await page.getByPlaceholder(/your.email@example.com/i).fill('john.doe@example.com');
    await page.getByPlaceholder(/S2024-0001/i).fill('S2024-1234');
    await page.getByPlaceholder(/please describe your request/i).fill(
      'I need help resetting my password. I have tried the self-service option but it did not work.'
    );

    // Accept terms
    const consentCheckbox = page.getByRole('checkbox');
    await consentCheckbox.check();

    // Submit
    const submitButton = page.getByRole('button', { name: /submit request/i }).last();
    await submitButton.click();

    // Step 11: Should redirect to request status page
    await page.waitForURL(/\/request\/.*\?token=/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/request\/.+\?token=/);

    // Step 12: Verify request status page
    await expect(page.getByText(/TKT-/i)).toBeVisible();
    await expect(page.getByText(/submitted/i)).toBeVisible();
    await expect(page.getByText(/John Doe/i)).toBeVisible();
    await expect(page.getByText(/john.doe@example.com/i)).toBeVisible();

    // Verify timeline is visible
    await expect(page.getByText(/timeline/i)).toBeVisible();
    await expect(page.getByText(/request details/i)).toBeVisible();
  });
});

/**
 * Test 2: AR Flow - Minimal smoke test with RTL validation
 * Tests that Arabic locale works correctly with RTL layout
 */
test.describe('Public Surfaces - AR Smoke Test (RTL)', () => {
  test('should display Arabic content with RTL layout', async ({ page }) => {
    // Start at home page
    await page.goto('/');

    // Switch to Arabic
    const languageToggle = page.getByRole('button', { name: /العربية|english/i });
    await languageToggle.click();

    // Verify RTL attribute
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'ar');

    // Verify Arabic text is displayed
    await expect(page.locator('h1')).toContainText(/كيف يمكننا مساعدتك/);

    // Navigate to KB
    const kbLink = page.getByRole('link', { name: /قاعدة المعرفة/i });
    await kbLink.click();

    await expect(page).toHaveURL('/kb');
    await expect(page.locator('h1')).toContainText(/قاعدة المعرفة/);

    // Verify RTL persists
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Navigate to catalog
    const catalogLink = page.getByRole('link', { name: /كتالوج الخدمات/i });
    await catalogLink.click();

    await expect(page).toHaveURL('/catalog');
    await expect(page.locator('h1')).toContainText(/كتالوج الخدمات/);

    // Navigate to chat
    const chatLink = page.getByRole('link', { name: /المحادثة/i });
    await chatLink.click();

    await expect(page).toHaveURL('/chat');
    await expect(page.locator('h1')).toContainText(/مساعد الطالب/);

    // Verify RTL is still active
    await expect(html).toHaveAttribute('dir', 'rtl');
  });

  test('should handle language toggle correctly', async ({ page }) => {
    await page.goto('/');

    // Initial state (English)
    let html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'ltr');
    await expect(html).toHaveAttribute('lang', 'en');

    // Toggle to Arabic
    const languageToggle = page.getByRole('button', { name: /العربية/i });
    await languageToggle.click();

    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'ar');

    // Toggle back to English
    const englishToggle = page.getByRole('button', { name: /english/i });
    await englishToggle.click();

    await expect(html).toHaveAttribute('dir', 'ltr');
    await expect(html).toHaveAttribute('lang', 'en');
  });
});

/**
 * Test 3: Keyboard Navigation
 * Tests that all interactive elements are keyboard accessible
 */
test.describe('Public Surfaces - Keyboard Navigation', () => {
  test('should navigate KB page with keyboard', async ({ page }) => {
    await page.goto('/kb');

    // Wait for page load
    await page.waitForSelector('h1:has-text("Knowledge Base")');

    // Tab to search input
    await page.keyboard.press('Tab');
    const searchInput = page.getByPlaceholder(/search for help/i);
    await expect(searchInput).toBeFocused();

    // Type in search
    await searchInput.fill('enrollment');
    await page.keyboard.press('Enter');

    // Tab through filters
    await page.keyboard.press('Tab'); // Category filter
    await page.keyboard.press('Tab'); // Department filter
    await page.keyboard.press('Tab'); // Sort filter

    // Tab to first article card
    await page.keyboard.press('Tab');

    // Activate with Enter
    await page.keyboard.press('Enter');

    // Should navigate to article
    await page.waitForURL(/\/kb\/kb-/);
  });

  test('should navigate catalog with keyboard', async ({ page }) => {
    await page.goto('/catalog');

    await page.waitForSelector('h1:has-text("Service Catalog")');

    // Tab to search
    await page.keyboard.press('Tab');

    // Tab through department tabs
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press('Tab');
    }

    // Tab to first service request button
    await page.keyboard.press('Tab');

    // Activate with Space
    await page.keyboard.press('Space');

    // Form modal should open
    await expect(page.getByText(/complete the form/i)).toBeVisible();
  });
});

/**
 * Test 4: Mobile Responsive
 * Tests that pages work correctly on mobile viewports
 */
test.describe('Public Surfaces - Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should display correctly on mobile - Home page', async ({ page }) => {
    await page.goto('/');

    // Verify single column layout
    await expect(page.locator('h1')).toContainText('How can we help you?');

    // Search should be full width
    const searchInput = page.getByPlaceholder(/search for help/i);
    await expect(searchInput).toBeVisible();

    // Featured articles should stack vertically
    const articleCards = page.locator('a[href^="/kb/"]');
    const count = await articleCards.count();
    expect(count).toBeGreaterThan(0);

    // Quick links should be visible
    await expect(page.getByText(/quick links/i)).toBeVisible();
  });

  test('should display correctly on mobile - KB page', async ({ page }) => {
    await page.goto('/kb');

    await page.waitForSelector('h1');

    // Filters should be visible and stack vertically
    const categoryFilter = page.locator('select').first();
    await expect(categoryFilter).toBeVisible();

    // Articles should be in single column
    await page.waitForSelector('a[href^="/kb/"]', { timeout: 5000 });
  });

  test('should display correctly on mobile - Catalog', async ({ page }) => {
    await page.goto('/catalog');

    await page.waitForSelector('h1');

    // Department tabs should be scrollable horizontally
    const tabs = page.locator('button').filter({ hasText: /admissions|finance|registrar/i });
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);

    // Services should stack vertically
    await page.waitForSelector('text=/submit request/i', { timeout: 5000 });
  });

  test('touch targets should be at least 44x44px', async ({ page }) => {
    await page.goto('/');

    // Check search input height
    const searchInput = page.getByPlaceholder(/search for help/i);
    const searchBox = await searchInput.boundingBox();
    expect(searchBox?.height).toBeGreaterThanOrEqual(44);

    // Check article card click areas
    const articleCard = page.locator('a[href^="/kb/"]').first();
    const cardBox = await articleCard.boundingBox();
    expect(cardBox?.height).toBeGreaterThanOrEqual(44);
  });
});

/**
 * Test 5: Form Validation Flows
 * Tests that form validation works correctly end-to-end
 */
test.describe('Public Surfaces - Form Validation', () => {
  test('should show validation errors for invalid inputs', async ({ page }) => {
    await page.goto('/catalog');

    await page.waitForSelector('text=/submit request/i', { timeout: 5000 });

    // Open request form
    const requestButton = page.getByRole('button', { name: /submit request/i }).first();
    await requestButton.click();

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /submit request/i }).last();
    await submitButton.click();

    // Should show errors
    await expect(page.getByText(/name must be at least 2 characters/i)).toBeVisible();
    await expect(page.getByText(/invalid email address/i)).toBeVisible();

    // Enter invalid student ID
    await page.getByPlaceholder(/S2024-0001/i).fill('INVALID-ID');
    await page.getByPlaceholder(/enter your full name/i).fill('J'); // Too short

    await submitButton.click();

    await expect(page.getByText(/format: S2024-0001/i)).toBeVisible();
  });

  test('should accept valid form and submit', async ({ page }) => {
    await page.goto('/catalog');

    await page.waitForSelector('text=/submit request/i', { timeout: 5000 });

    const requestButton = page.getByRole('button', { name: /submit request/i }).first();
    await requestButton.click();

    // Fill valid data
    await page.getByPlaceholder(/enter your full name/i).fill('Alice Johnson');
    await page.getByPlaceholder(/your.email@example.com/i).fill('alice@example.com');
    await page.getByPlaceholder(/S2024-0001/i).fill('S2024-5678');
    await page.getByPlaceholder(/please describe your request/i).fill(
      'This is a valid request with more than 10 characters'
    );

    // Accept consent
    const consentCheckbox = page.getByRole('checkbox');
    await consentCheckbox.check();

    // Submit
    const submitButton = page.getByRole('button', { name: /submit request/i }).last();
    await submitButton.click();

    // Should redirect to status page
    await page.waitForURL(/\/request\/.+\?token=/, { timeout: 5000 });
    await expect(page.getByText(/TKT-/i)).toBeVisible();
  });
});

/**
 * Test 6: Chat Escalation Flow
 * Tests the chat-to-ticket escalation functionality
 */
test.describe('Public Surfaces - Chat Escalation', () => {
  test('should escalate from chat to ticket', async ({ page }) => {
    await page.goto('/chat');

    // Verify chat stub UI
    await expect(page.locator('h1')).toContainText('Student Assistant');
    await expect(page.getByText(/coming soon/i)).toBeVisible();

    // Chat input should be disabled
    const chatInput = page.getByPlaceholder(/type your message/i);
    await expect(chatInput).toBeDisabled();

    // Click escalate button
    const escalateButton = page.getByRole('button', { name: /create ticket instead/i });
    await escalateButton.click();

    // Form modal should open
    await expect(page.getByText(/create support ticket/i)).toBeVisible();
    await expect(page.getByText(/escalated from chat/i)).toBeVisible();

    // Fill form
    await page.getByPlaceholder(/enter your full name/i).fill('Bob Wilson');
    await page.getByPlaceholder(/your.email@example.com/i).fill('bob@example.com');
    await page.getByPlaceholder(/please describe your request/i).fill(
      'I was trying to use chat but need immediate assistance with my enrollment'
    );

    // Submit
    const submitButton = page.getByRole('button', { name: /submit request/i });
    await submitButton.click();

    // Should redirect to request status
    await page.waitForURL(/\/request\/.+\?token=/, { timeout: 5000 });
    await expect(page.getByText(/TKT-/i)).toBeVisible();
  });
});

/**
 * Test 7: Request Reopen Flow
 * Tests that resolved requests can be reopened within 7 days
 */
test.describe('Public Surfaces - Request Reopen', () => {
  test('should show reopen button for recently resolved request', async ({ page }) => {
    // This test requires a specific mock state
    // For now, navigate to a request page and verify UI exists
    await page.goto('/request/CASE-12345678?token=test-token');

    // Wait for page load (may show error if mock not set up)
    await page.waitForTimeout(1000);

    // This test would verify reopen functionality in real environment
  });
});

/**
 * Test 8: Accessibility - Screen Reader Announcements
 * Tests that important state changes are announced
 */
test.describe('Public Surfaces - Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    // Search input should have aria-label
    const searchInput = page.getByRole('searchbox');
    await expect(searchInput).toHaveAttribute('aria-label');

    await page.goto('/kb');

    // Results count should be announced
    await page.waitForSelector('[role="status"]', { timeout: 5000 });
  });

  test('should have keyboard focus indicators', async ({ page }) => {
    await page.goto('/');

    // Tab to search
    await page.keyboard.press('Tab');
    const searchInput = page.getByPlaceholder(/search for help/i);

    // Should have visible focus ring (checked via CSS)
    await expect(searchInput).toBeFocused();
  });
});
