# Time Tracker - Playwright Tests

This directory contains Playwright end-to-end tests for the Time Tracker application.

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Run tests for specific browser
```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

### Run mobile tests only
```bash
npm run test:mobile
```

### View test report
```bash
npm run report
```

## Test Coverage

The test suite covers:

### Core Functionality
- ✅ Page loads with correct title and structure
- ✅ Current month badge displays correctly
- ✅ Total days counter starts at 0
- ✅ Week cards are generated for the current month

### Data Entry
- ✅ Input fields accept days worked (0-7)
- ✅ Save button stores data and updates display
- ✅ Total automatically calculates from all weeks
- ✅ Input validation prevents invalid entries (< 0 or > 7)
- ✅ Data can be updated/overwritten

### Month Navigation
- ✅ Previous/Next month buttons work
- ✅ Month badge updates when navigating
- ✅ Week dates update for selected month
- ✅ Data persists when switching months
- ✅ Each month maintains separate data

### UI/UX
- ✅ Success animations play on save
- ✅ Responsive layout on mobile and desktop
- ✅ Week cards display correctly on all screen sizes

## CI/CD Integration

### In your build pipeline:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: npm test

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

### In other CI systems:

```bash
# Install dependencies
npm ci

# Install Playwright browsers
npx playwright install --with-deps

# Run tests
npm test
```

## Configuration

Tests are configured in `playwright.config.js`:
- Tests run on Chromium, Firefox, and WebKit
- Mobile testing on Pixel 5 and iPhone 12
- Automatic screenshots on failure
- Video recording on failure
- HTML and list reporters

## File Structure

```
.
├── index.html              # Main application
├── styles.css              # Application styles
├── script.js               # Application logic
├── time-tracker.spec.js    # Test suite
├── playwright.config.js    # Playwright configuration
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## Troubleshooting

### Tests fail with "Target closed"
Make sure the web server is running. The config automatically starts a server, but if you have conflicts on port 8080, change the port in `playwright.config.js`.

### Browser not found
Run `npx playwright install` to download the required browsers.

### Timeout errors
Increase timeout values in `playwright.config.js` if your system is slow.

## Writing New Tests

Add new tests to `time-tracker.spec.js`:

```javascript
test('should do something', async ({ page }) => {
  // Your test code here
  await page.locator('#someElement').click();
  await expect(page.locator('#result')).toHaveText('Expected');
});
```

## Best Practices

- Use `data-testid` attributes for more stable selectors
- Wait for animations before assertions
- Use `page.waitForLoadState('networkidle')` for dynamic content
- Keep tests independent and idempotent
- Use descriptive test names
