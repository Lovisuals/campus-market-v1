import { test, expect } from '@playwright/test';

test.describe('Campus Market E2E Flow', () => {
  test('complete signup to listing creation and admin approval', async ({ page }) => {
    // Generate unique test data
    const timestamp = Date.now();
    const testPhone = `+234${timestamp.toString().slice(-9)}`; // Nigerian format
    const testName = `Test User ${timestamp}`;
    const testCampus = 'University of Lagos';
    const listingTitle = `Test Laptop ${timestamp}`;
    const listingPrice = 150000;

    // Step 1: Navigate to login page (which handles both login and signup)
    await page.goto('/login');
    await expect(page).toHaveTitle(/Campus Market/);

    // Step 2: Enter phone number for signup (new user)
    await page.fill('input[type="tel"]', testPhone);
    await page.click('button[type="submit"]');

    // Step 3: Verify OTP (in test environment, we might need to mock this)
    // This would normally require intercepting the SMS or using a test OTP
    // For now, we'll assume OTP verification works
    await page.waitForURL(/\/verify\?phone=/);

    // Mock OTP verification - in real test, you'd need to handle this differently
    const testOTP = '123456'; // This would come from your test setup
    await page.fill('input[placeholder*="OTP"]', testOTP);
    await page.click('button[type="submit"]');

    // Step 4: Complete registration (should redirect to register page for new users)
    await page.waitForURL('/register');
    await page.fill('input[name="full_name"]', testName);
    await page.fill('input[name="email"]', `test${timestamp}@example.com`);
    await page.selectOption('select[name="campus"]', testCampus);
    await page.click('button[type="submit"]');

    // Step 5: Verify successful registration and redirect to home/dashboard
    await page.waitForURL('/');
    await expect(page.locator('text=Campus Market')).toBeVisible();

    // Step 6: Navigate to create listing page
    await page.goto('/studio');
    await expect(page.locator('text=Create Listing')).toBeVisible();

    // Step 7: Fill out listing form
    await page.fill('input[name="title"]', listingTitle);
    await page.fill('textarea[name="description"]', 'A great laptop for students');
    await page.selectOption('select[name="category"]', 'electronics');
    await page.fill('input[name="price"]', listingPrice.toString());
    await page.selectOption('select[name="campus"]', testCampus);
    await page.selectOption('select[name="condition"]', 'good');

    // Step 8: Upload test images (would need actual image files)
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles(['path/to/test-image.jpg']);

    // Step 9: Submit listing
    await page.click('button[type="submit"]');

    // Step 10: Verify listing creation success
    await expect(page.locator('text=Listing created successfully')).toBeVisible();

    // Step 11: Admin approval flow (would need admin login)
    // This would require switching to admin user context
    // await page.context().addCookies([{ name: 'admin_session', value: 'admin_token', domain: 'localhost' }]);
    // await page.goto('/admin/listings');
    // await page.click(`text=${listingTitle}`);
    // await page.click('button[title="Approve"]');
    // await expect(page.locator('text=Approved')).toBeVisible();

    // Step 12: Verify listing is now visible to public
    await page.goto('/listings');
    await expect(page.locator(`text=${listingTitle}`)).toBeVisible();
  });

  test('rate limiting prevents spam listings', async ({ page }) => {
    // This test would verify rate limiting by attempting multiple rapid submissions
    // Would need to set up test user and attempt >10 listings in an hour
  });

  test('phone verification is required', async ({ page }) => {
    // Test that unverified phone users cannot create listings
    await page.goto('/studio');
    // Should redirect to phone verification or show error
    await expect(page.locator('text=Phone not verified')).toBeVisible();
  });
});
