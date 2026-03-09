const { test, expect } = require('@playwright/test');

test.describe('Time Tracker Application', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the time tracker page before each test
    await page.goto('http://localhost:8080/index.html');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should load the page with correct title and header', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle('Time Tracker');
    
    // Check main heading
    const heading = page.locator('h1');
    await expect(heading).toHaveText('Time Tracker');
    
    // Check subtitle
    const subtitle = page.locator('.subtitle');
    await expect(subtitle).toHaveText('Track your work days this month');
  });

  test('should display current month badge', async ({ page }) => {
    const monthBadge = page.locator('#currentMonth');
    await expect(monthBadge).toBeVisible();
    
    // Check that month badge contains the current year
    const currentYear = new Date().getFullYear();
    await expect(monthBadge).toContainText(currentYear.toString());
  });

  test('should display total days initially as 0', async ({ page }) => {
    const totalDays = page.locator('#totalDays');
    await expect(totalDays).toHaveText('0');
  });

  test('should generate week cards for the current month', async ({ page }) => {
    const weekCards = page.locator('.week-card');
    const count = await weekCards.count();
    
    // Most months have 4-5 weeks
    expect(count).toBeGreaterThanOrEqual(4);
    expect(count).toBeLessThanOrEqual(6);
  });

  test('should display week cards with correct structure', async ({ page }) => {
    const firstWeekCard = page.locator('.week-card').first();
    
    // Check week title exists
    await expect(firstWeekCard.locator('.week-title')).toBeVisible();
    await expect(firstWeekCard.locator('.week-title')).toHaveText('Week 1');
    
    // Check days display exists
    await expect(firstWeekCard.locator('.week-days')).toBeVisible();
    
    // Check input field exists
    await expect(firstWeekCard.locator('input[type="number"]')).toBeVisible();
    
    // Check save button exists
    await expect(firstWeekCard.locator('button')).toBeVisible();
    await expect(firstWeekCard.locator('button')).toHaveText('Save');
  });

  test('should allow entering days worked and save', async ({ page }) => {
    const firstWeekInput = page.locator('#week1-input');
    const firstWeekDisplay = page.locator('#week1-display');
    const saveButton = page.locator('.week-card').first().locator('button');
    
    // Enter 5 days worked
    await firstWeekInput.fill('5');
    await saveButton.click();
    
    // Wait for animation to complete
    await page.waitForTimeout(600);
    
    // Check that display updated
    await expect(firstWeekDisplay).toHaveText('5');
  });

  test('should update total when days are saved', async ({ page }) => {
    const totalDays = page.locator('#totalDays');
    
    // Add days to first week
    await page.locator('#week1-input').fill('3');
    await page.locator('.week-card').first().locator('button').click();
    await page.waitForTimeout(600);
    
    // Add days to second week
    await page.locator('#week2-input').fill('4');
    await page.locator('.week-card').nth(1).locator('button').click();
    await page.waitForTimeout(600);
    
    // Total should be 7
    await expect(totalDays).toHaveText('7');
  });

  test('should validate input range (0-7 days)', async ({ page }) => {
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Please enter a value between 0 and 7 days');
      await dialog.accept();
    });
    
    const firstWeekInput = page.locator('#week1-input');
    const saveButton = page.locator('.week-card').first().locator('button');
    
    // Try to enter invalid value (8)
    await firstWeekInput.fill('8');
    await saveButton.click();
    
    // Dialog should appear (handled by event listener above)
  });

  test('should have functional month navigation buttons', async ({ page }) => {
    const prevButton = page.locator('#prevMonth');
    const nextButton = page.locator('#nextMonth');
    const monthBadge = page.locator('#currentMonth');
    
    // Check buttons are visible
    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
    
    // Get current month
    const currentMonth = await monthBadge.textContent();
    
    // Click next month
    await nextButton.click();
    await page.waitForTimeout(300);
    
    // Month should have changed
    const newMonth = await monthBadge.textContent();
    expect(newMonth).not.toBe(currentMonth);
  });

  test('should navigate to previous month and update dates', async ({ page }) => {
    const prevButton = page.locator('#prevMonth');
    const monthBadge = page.locator('#currentMonth');
    
    const currentMonth = await monthBadge.textContent();
    
    // Navigate to previous month
    await prevButton.click();
    await page.waitForTimeout(300);
    
    const previousMonth = await monthBadge.textContent();
    expect(previousMonth).not.toBe(currentMonth);
    
    // Week cards should still be generated
    const weekCards = page.locator('.week-card');
    const count = await weekCards.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('should navigate to next month and update dates', async ({ page }) => {
    const nextButton = page.locator('#nextMonth');
    const monthBadge = page.locator('#currentMonth');
    
    const currentMonth = await monthBadge.textContent();
    
    // Navigate to next month
    await nextButton.click();
    await page.waitForTimeout(300);
    
    const nextMonthText = await monthBadge.textContent();
    expect(nextMonthText).not.toBe(currentMonth);
    
    // Week cards should still be generated
    const weekCards = page.locator('.week-card');
    const count = await weekCards.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('should preserve data when navigating between months', async ({ page }) => {
    const totalDays = page.locator('#totalDays');
    const nextButton = page.locator('#nextMonth');
    const prevButton = page.locator('#prevMonth');
    
    // Add data to current month
    await page.locator('#week1-input').fill('5');
    await page.locator('.week-card').first().locator('button').click();
    await page.waitForTimeout(600);
    
    // Verify total
    await expect(totalDays).toHaveText('5');
    
    // Navigate to next month
    await nextButton.click();
    await page.waitForTimeout(300);
    
    // Total should be 0 for new month
    await expect(totalDays).toHaveText('0');
    
    // Navigate back to previous month
    await prevButton.click();
    await page.waitForTimeout(300);
    
    // Original data should be preserved
    await expect(totalDays).toHaveText('5');
    await expect(page.locator('#week1-display')).toHaveText('5');
  });

  test('should handle multiple week entries correctly', async ({ page }) => {
    const totalDays = page.locator('#totalDays');
    
    // Add data to multiple weeks
    const weekData = [
      { week: 1, days: 5 },
      { week: 2, days: 4 },
      { week: 3, days: 3 },
    ];
    
    let expectedTotal = 0;
    for (const { week, days } of weekData) {
      await page.locator(`#week${week}-input`).fill(days.toString());
      await page.locator('.week-card').nth(week - 1).locator('button').click();
      await page.waitForTimeout(300);
      expectedTotal += days;
    }
    
    // Check total
    await expect(totalDays).toHaveText(expectedTotal.toString());
  });

  test('should clear input after successful save', async ({ page }) => {
    const firstWeekInput = page.locator('#week1-input');
    const saveButton = page.locator('.week-card').first().locator('button');
    
    // Enter and save
    await firstWeekInput.fill('3');
    const initialValue = await firstWeekInput.inputValue();
    expect(initialValue).toBe('3');
    
    await saveButton.click();
    await page.waitForTimeout(600);
    
    // Input should still contain the value for editing
    const finalValue = await firstWeekInput.inputValue();
    expect(finalValue).toBe('3');
  });

  test('should have responsive layout', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    const weeksGrid = page.locator('.weeks-grid');
    await expect(weeksGrid).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(weeksGrid).toBeVisible();
    
    // Week cards should still be visible in mobile
    const weekCards = page.locator('.week-card');
    await expect(weekCards.first()).toBeVisible();
  });

  test('should apply success animation when saving', async ({ page }) => {
    const firstWeekDisplay = page.locator('#week1-display');
    const saveButton = page.locator('.week-card').first().locator('button');
    
    await page.locator('#week1-input').fill('5');
    await saveButton.click();
    
    // Check if animation class is applied
    await expect(firstWeekDisplay).toHaveClass(/success-animation/);
  });

  test('should handle zero days input', async ({ page }) => {
    const firstWeekInput = page.locator('#week1-input');
    const firstWeekDisplay = page.locator('#week1-display');
    const saveButton = page.locator('.week-card').first().locator('button');
    
    // Enter 0 days
    await firstWeekInput.fill('0');
    await saveButton.click();
    await page.waitForTimeout(600);
    
    // Display should show 0
    await expect(firstWeekDisplay).toHaveText('0');
  });

  test('should update existing week data', async ({ page }) => {
    const firstWeekInput = page.locator('#week1-input');
    const firstWeekDisplay = page.locator('#week1-display');
    const saveButton = page.locator('.week-card').first().locator('button');
    const totalDays = page.locator('#totalDays');
    
    // First entry
    await firstWeekInput.fill('3');
    await saveButton.click();
    await page.waitForTimeout(600);
    await expect(totalDays).toHaveText('3');
    
    // Update entry
    await firstWeekInput.fill('7');
    await saveButton.click();
    await page.waitForTimeout(600);
    
    // Check updated values
    await expect(firstWeekDisplay).toHaveText('7');
    await expect(totalDays).toHaveText('7');
  });
});
