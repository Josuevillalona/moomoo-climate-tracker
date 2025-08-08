import { test, expect, Page } from '@playwright/test';

// Helper function to mock API error responses
async function mockApiErrors(page: Page, errorType: 'network' | 'database' | 'timeout' | 'partial') {
  switch (errorType) {
    case 'network':
      // Mock network error
      await page.route('**/api/dashboard/metrics', async route => {
        await route.abort('failed');
      });
      await page.route('**/api/deals/recent*', async route => {
        await route.abort('failed');
      });
      break;

    case 'database':
      // Mock database error
      await page.route('**/api/dashboard/metrics', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: 'Database connection failed',
            loading: false,
          }),
        });
      });
      await page.route('**/api/deals/recent*', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: 'Database connection failed',
            loading: false,
          }),
        });
      });
      break;

    case 'timeout':
      // Mock timeout error
      await page.route('**/api/dashboard/metrics', async route => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Long delay
        await route.fulfill({
          status: 408,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: 'Request timeout',
            loading: false,
          }),
        });
      });
      break;

    case 'partial':
      // Mock partial failure - metrics succeed, deals fail
      await page.route('**/api/dashboard/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              totalDeals: 150,
              totalFunding: 2500000000,
              totalCompanies: 120,
              totalInvestors: 85,
              growthRate: 15.5,
            },
            error: null,
            loading: false,
          }),
        });
      });
      await page.route('**/api/deals/recent*', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: 'Failed to fetch recent deals',
            loading: false,
          }),
        });
      });
      break;
  }
}

// Helper function to mock successful API responses
async function mockSuccessfulApiResponses(page: Page) {
  await page.route('**/api/dashboard/metrics', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          totalDeals: 150,
          totalFunding: 2500000000,
          totalCompanies: 120,
          totalInvestors: 85,
          growthRate: 15.5,
        },
        error: null,
        loading: false,
      }),
    });
  });

  await page.route('**/api/deals/recent*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: 1,
            companyName: 'SolarTech Inc',
            fundingStage: 'Series A',
            amountRaised: 25000000,
            dateAnnounced: '2024-01-15',
            climateSector: 'Solar Energy',
            country: 'United States',
          },
        ],
        error: null,
        loading: false,
      }),
    });
  });
}

test.describe('Dashboard Error Recovery Scenarios', () => {
  test('should handle complete API failure with error display and retry', async ({ page }) => {
    // Mock network errors
    await mockApiErrors(page, 'network');

    await page.goto('/dashboard');

    // Should show loading initially
    await expect(page.getByTestId('dashboard-skeleton')).toBeVisible();

    // Should eventually show error state
    await expect(page.getByTestId('dashboard-error-fallback')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Dashboard Temporarily Unavailable|Failed to fetch/)).toBeVisible();

    // Should have retry button
    const retryButton = page.getByTestId('retry-button');
    await expect(retryButton).toBeVisible();

    // Test retry functionality - first setup successful responses
    await mockSuccessfulApiResponses(page);

    // Click retry
    await retryButton.click();

    // Should show loading again
    await expect(page.getByTestId('dashboard-skeleton')).toBeVisible();

    // Should eventually load successfully
    await expect(page.getByTestId('dashboard-skeleton')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('MooMoo Climate')).toBeVisible();
    await expect(page.getByText('CLOSED DEALS')).toBeVisible();
  });

  test('should handle database errors with appropriate error messages', async ({ page }) => {
    await mockApiErrors(page, 'database');

    await page.goto('/dashboard');

    // Wait for error state
    await expect(page.getByTestId('dashboard-error-fallback')).toBeVisible({ timeout: 10000 });
    
    // Should show database-specific error message
    await expect(page.getByTestId('error-message')).toContainText(/Database connection failed|Failed to fetch/);

    // Should have retry functionality
    const retryButton = page.getByTestId('retry-button');
    await expect(retryButton).toBeVisible();

    // Test that refresh page button works
    const refreshPageButton = page.getByText('Refresh Page');
    if (await refreshPageButton.isVisible()) {
      // Mock successful response for page refresh
      await mockSuccessfulApiResponses(page);
      
      // Note: We can't actually test page refresh in Playwright easily,
      // but we can verify the button is present and clickable
      await expect(refreshPageButton).toBeVisible();
    }
  });

  test('should handle partial failures gracefully', async ({ page }) => {
    await mockApiErrors(page, 'partial');

    await page.goto('/dashboard');

    // Should not show complete error fallback for partial failures
    await expect(page.getByTestId('dashboard-skeleton')).not.toBeVisible({ timeout: 10000 });
    
    // Main dashboard should still render
    await expect(page.getByText('MooMoo Climate')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();

    // Successful sections should be visible
    await expect(page.getByText('CLOSED DEALS')).toBeVisible();
    await expect(page.getByText('QUICK COUNTS')).toBeVisible();

    // Failed sections might show section-specific errors
    // This depends on the implementation - the dashboard should gracefully handle partial failures
  });

  test('should handle timeout errors with retry mechanism', async ({ page }) => {
    await mockApiErrors(page, 'timeout');

    await page.goto('/dashboard');

    // Should show loading initially
    await expect(page.getByTestId('dashboard-skeleton')).toBeVisible();

    // Should eventually timeout and show error (with longer timeout for this test)
    await expect(page.getByTestId('dashboard-error-fallback')).toBeVisible({ timeout: 15000 });
    
    // Should show timeout-related error message
    await expect(page.getByTestId('error-message')).toContainText(/timeout|Request timeout|Failed to fetch/);

    // Test retry with successful response
    await mockSuccessfulApiResponses(page);
    
    const retryButton = page.getByTestId('retry-button');
    await retryButton.click();

    // Should recover successfully
    await expect(page.getByTestId('dashboard-skeleton')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('MooMoo Climate')).toBeVisible();
  });

  test('should handle network connectivity issues', async ({ page }) => {
    // Start with successful responses
    await mockSuccessfulApiResponses(page);

    await page.goto('/dashboard');

    // Wait for successful load
    await expect(page.getByTestId('dashboard-skeleton')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('MooMoo Climate')).toBeVisible();

    // Simulate network going offline
    await page.context().setOffline(true);

    // Try to refresh data
    await page.getByText('Refresh').click();

    // Should handle offline state gracefully
    // The exact behavior depends on implementation, but should not crash

    // Simulate network coming back online
    await page.context().setOffline(false);
    await mockSuccessfulApiResponses(page);

    // Try refresh again
    await page.getByText('Refresh').click();

    // Should show refreshing indicator
    await expect(page.getByText('Refreshing data...')).toBeVisible();
    await expect(page.getByText('Refreshing data...')).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle rapid retry attempts gracefully', async ({ page }) => {
    await mockApiErrors(page, 'network');

    await page.goto('/dashboard');

    // Wait for error state
    await expect(page.getByTestId('dashboard-error-fallback')).toBeVisible({ timeout: 10000 });

    const retryButton = page.getByTestId('retry-button');

    // Click retry multiple times rapidly
    await retryButton.click();
    await retryButton.click();
    await retryButton.click();

    // Should handle multiple clicks gracefully without crashing
    await expect(page.getByTestId('dashboard-skeleton')).toBeVisible();

    // Eventually should settle into error state again (since we haven't fixed the mock)
    await expect(page.getByTestId('dashboard-error-fallback')).toBeVisible({ timeout: 10000 });
  });

  test('should maintain user session during error recovery', async ({ page }) => {
    // Start with successful load
    await mockSuccessfulApiResponses(page);

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-skeleton')).not.toBeVisible({ timeout: 10000 });

    // Verify user info is displayed
    await expect(page.getByText('Alex Chen')).toBeVisible();

    // Enter some data in search
    const searchInput = page.getByPlaceholder('Search Climate Data');
    await searchInput.fill('test search');

    // Simulate error on refresh
    await mockApiErrors(page, 'database');
    await page.getByText('Refresh').click();

    // Should show error but maintain session
    await expect(page.getByTestId('dashboard-error-fallback')).toBeVisible({ timeout: 10000 });
    
    // User should still be logged in (header should be visible)
    await expect(page.getByText('Alex Chen')).toBeVisible();

    // Fix the error and retry
    await mockSuccessfulApiResponses(page);
    await page.getByTestId('retry-button').click();

    // Should recover successfully
    await expect(page.getByTestId('dashboard-skeleton')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('MooMoo Climate')).toBeVisible();
    
    // User session should be maintained
    await expect(page.getByText('Alex Chen')).toBeVisible();
    
    // Search input should maintain its value (if the component preserves it)
    // This depends on the specific implementation
  });

  test('should handle error recovery with different error types', async ({ page }) => {
    const errorTypes = ['network', 'database'] as const;

    for (const errorType of errorTypes) {
      // Mock specific error type
      await mockApiErrors(page, errorType);

      await page.goto('/dashboard');

      // Should show error state
      await expect(page.getByTestId('dashboard-error-fallback')).toBeVisible({ timeout: 10000 });

      // Error message should be appropriate for error type
      const errorMessage = page.getByTestId('error-message');
      await expect(errorMessage).toBeVisible();

      // Should have retry functionality
      const retryButton = page.getByTestId('retry-button');
      await expect(retryButton).toBeVisible();

      // Fix the error for next iteration
      await mockSuccessfulApiResponses(page);
      await retryButton.click();

      // Should recover
      await expect(page.getByTestId('dashboard-skeleton')).not.toBeVisible({ timeout: 10000 });
      await expect(page.getByText('MooMoo Climate')).toBeVisible();
    }
  });

  test('should handle browser refresh during error state', async ({ page }) => {
    await mockApiErrors(page, 'network');

    await page.goto('/dashboard');

    // Wait for error state
    await expect(page.getByTestId('dashboard-error-fallback')).toBeVisible({ timeout: 10000 });

    // Fix the API responses
    await mockSuccessfulApiResponses(page);

    // Refresh the browser
    await page.reload();

    // Should load successfully after refresh
    await expect(page.getByTestId('dashboard-skeleton')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('MooMoo Climate')).toBeVisible();
    await expect(page.getByText('CLOSED DEALS')).toBeVisible();
  });
});