import { test, expect } from '@playwright/test';

test.describe('User Registration & Phone Login', () => {
  const testEmail = `test${Date.now()}@campusmarket.test`;
  const testPhone = '+2348012345678';
  const testName = 'Test User';
  const testCampus = 'University of Lagos';

  test('complete registration flow', async ({ page }) => {
    // Navigate to registration
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="full_name"]', testName);
    await page.selectOption('[name="campus"]', testCampus);
    await page.fill('[name="password"]', 'TestPass123!');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to verify email page
    await expect(page).toHaveURL(/\/verify/);
    
    // Should show success message
    await expect(page.locator('text=Check your email')).toBeVisible();
  });

  test('phone login with new device requires OTP', async ({ page }) => {
    await page.goto('/phone-login');
    
    // Enter phone number
    await page.fill('[name="phone"]', testPhone);
    await page.click('button:has-text("Continue")');
    
    // Should show OTP input (new device)
    await expect(page.locator('[name="otp"]')).toBeVisible();
    
    // Enter OTP
    await page.fill('[name="otp"]', '123456');
    await page.click('button:has-text("Verify")');
    
    // Should redirect to market (after magic link)
    // Note: In real test, would need to intercept email
  });

  test('phone login with recognized device skips OTP', async ({ page, context }) => {
    // Set cookies to simulate trusted device
    await context.addCookies([
      {
        name: 'device_trusted',
        value: 'true',
        domain: 'localhost',
        path: '/'
      }
    ]);

    await page.goto('/phone-login');
    
    await page.fill('[name="phone"]', testPhone);
    await page.click('button:has-text("Continue")');
    
    // Should NOT show OTP input (trusted device)
    await expect(page.locator('[name="otp"]')).not.toBeVisible();
    
    // Should show "Check your email for magic link"
    await expect(page.locator('text=Check your email')).toBeVisible();
  });
});

test.describe('Listing Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    // ... login logic
  });

  test('create listing with valid data', async ({ page }) => {
    await page.goto('/post');
    
    // Fill listing form
    await page.fill('[name="title"]', 'HP Laptop for Sale');
    await page.fill('[name="description"]', 'Gently used HP laptop in excellent condition. 8GB RAM, 256GB SSD.');
    await page.selectOption('[name="category"]', 'Electronics');
    await page.fill('[name="price"]', '50000');
    await page.selectOption('[name="condition"]', 'used-like-new');
    
    // Upload image
    await page.setInputFiles('[type="file"]', 'tests/fixtures/laptop.jpg');
    
    // Submit
    await page.click('button:has-text("Post Listing")');
    
    // Should redirect to market
    await expect(page).toHaveURL(/\/market/);
    
    // Should show success message
    await expect(page.locator('text=Listing created successfully')).toBeVisible();
  });

  test('validate listing creation with invalid data', async ({ page }) => {
    await page.goto('/post');
    
    // Try to submit with empty title
    await page.fill('[name="description"]', 'Test description');
    await page.click('button:has-text("Post Listing")');
    
    // Should show error
    await expect(page.locator('text=Title is required')).toBeVisible();
  });

  test('block listing with banned words', async ({ page }) => {
    await page.goto('/post');
    
    await page.fill('[name="title"]', 'Scam Product for Sale');
    await page.fill('[name="description"]', 'This is definitely a scam product');
    await page.fill('[name="price"]', '10000');
    
    await page.click('button:has-text("Post Listing")');
    
    // Should be blocked by moderation
    await expect(page.locator('text=blocked')).toBeVisible();
  });
});

test.describe('Transaction Flow', () => {
  test('complete purchase flow', async ({ page }) => {
    // Login as buyer
    await page.goto('/login');
    // ... auth

    // Find a listing
    await page.goto('/market');
    await page.click('.listing-card:first-child');
    
    // Initiate purchase
    await page.click('button:has-text("Buy Now")');
    
    // Select payment method
    await page.selectOption('[name="payment_method"]', 'bank_transfer');
    await page.click('button:has-text("Confirm Purchase")');
    
    // Should redirect to transaction page
    await expect(page).toHaveURL(/\/transactions/);
    
    // Should show pending status
    await expect(page.locator('text=Pending')).toBeVisible();
  });

  test('buyer confirms receipt', async ({ page }) => {
    await page.goto('/transactions/123');
    
    // Confirm receipt
    await page.click('button:has-text("Confirm Receipt")');
    
    // Should update to completed
    await expect(page.locator('text=Completed')).toBeVisible();
  });

  test('buyer opens dispute', async ({ page }) => {
    await page.goto('/transactions/123');
    
    // Open dispute
    await page.click('button:has-text("Report Issue")');
    
    // Fill dispute form
    await page.selectOption('[name="reason"]', 'Item not as described');
    await page.fill('[name="description"]', 'The laptop screen is cracked, not mentioned in listing');
    await page.setInputFiles('[type="file"]', 'tests/fixtures/evidence.jpg');
    
    await page.click('button:has-text("Submit Dispute")');
    
    // Should update status
    await expect(page.locator('text=Disputed')).toBeVisible();
  });
});

test.describe('Seller Rating System', () => {
  test('leave review after completed transaction', async ({ page }) => {
    await page.goto('/transactions/123');
    
    // Transaction should be completed
    await expect(page.locator('text=Completed')).toBeVisible();
    
    // Click leave review
    await page.click('button:has-text("Leave Review")');
    
    // Fill review
    await page.click('svg[data-rating="5"]'); // 5 stars
    await page.fill('[name="comment"]', 'Great seller! Item exactly as described. Fast delivery.');
    
    await page.click('button:has-text("Submit Review")');
    
    // Should show success
    await expect(page.locator('text=Thank you for your review')).toBeVisible();
  });

  test('view seller profile with ratings', async ({ page }) => {
    await page.goto('/profile/seller123');
    
    // Should show rating stats
    await expect(page.locator('.average-rating')).toContainText('4.5');
    await expect(page.locator('.total-reviews')).toContainText('12 reviews');
    
    // Should show rating badge
    await expect(page.locator('.rating-badge')).toContainText('Gold');
    
    // Should list recent reviews
    await expect(page.locator('.review-item')).toHaveCount(5);
  });
});

test.describe('Content Moderation', () => {
  test('auto-flag message with banned words', async ({ page }) => {
    await page.goto('/chats');
    
    await page.fill('[name="message"]', 'This is definitely a scam');
    await page.click('button:has-text("Send")');
    
    // Message should be blocked
    await expect(page.locator('text=blocked due to policy violation')).toBeVisible();
  });

  test('admin can view moderation queue', async ({ page, context }) => {
    // Login as admin
    await context.addCookies([
      { name: 'is_admin', value: 'true', domain: 'localhost', path: '/' }
    ]);

    await page.goto('/moderation');
    
    // Should show pending items
    await expect(page.locator('.moderation-item')).toHaveCount.greaterThan(0);
    
    // Can approve
    await page.click('.moderation-item:first-child button:has-text("Approve")');
    await expect(page.locator('text=Approved')).toBeVisible();
  });
});

test.describe('Security Tests', () => {
  test('prevent SQL injection in search', async ({ page }) => {
    await page.goto('/search?q=' + encodeURIComponent("'; DROP TABLE users; --"));
    
    // Should not crash or show error
    await expect(page).not.toHaveTitle(/error/i);
  });

  test('prevent XSS in listing description', async ({ page }) => {
    await page.goto('/post');
    
    await page.fill('[name="title"]', 'Test Product');
    await page.fill('[name="description"]', '<script>alert("XSS")</script>');
    await page.fill('[name="price"]', '10000');
    
    await page.click('button:has-text("Post Listing")');
    
    // View the listing
    await page.goto('/market');
    await page.click('.listing-card:last-child');
    
    // Script should be sanitized
    await expect(page.locator('text=<script>')).not.toBeVisible();
  });

  test('rate limiting on login attempts', async ({ page }) => {
    await page.goto('/login');
    
    // Attempt multiple logins
    for (let i = 0; i < 6; i++) {
      await page.fill('[name="phone"]', '+2348012345678');
      await page.click('button:has-text("Continue")');
      await page.waitForTimeout(500);
    }
    
    // Should be rate limited
    await expect(page.locator('text=Too many attempts')).toBeVisible();
  });
});
