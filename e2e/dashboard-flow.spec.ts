import { test, expect, Page } from '@playwright/test';

// Mock data for testing
const mockMetrics = {
  totalDeals: 150,
  totalFunding: 2500000000,
  totalCompanies: 120,
  totalInvestors: 85,
  growthRate: 15.5,
};

const mockRecentDeals = [
  {
    id: 1,
    companyName: 'SolarTech Inc',
    fundingStage: 'Series A',
    amountRaised: 25000000,
    dateAnnounced: '2024-01-15',
    climateSector: 'Solar Energy',
    country: 'United States',
  },
  {
    id: 2,
    companyName: 'CarbonCapture Co',
    fundingStage: 'Seed',
    amountRaised: 5000000,
    dateAnnounced: '2024-01-10',
    climateSector: 'Carbon Capture',
    country: 'Germany',
  },
];

// Helper function to mock API responses
async function mockApiResponses(page: Page) {
  // Mock the dashboard metrics API
  await page.route('**/api/dashboard/metrics', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: mockMetrics,
        error: null,
        loading: false,
      }),
    });
  });

  // Mock the recent deals API
  await page.route('**/api/deals/recent*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: mockRecentDeals,
        error: null,
        loading: false,
      }),
    });
  });

  // Mock Supabase real-time connection
  await page.addInitScript(() => {
    // Mock WebSocket for real-time functionality
    (window as any).mockWebSocket = true;
  });
}

// Helper function to wait for dashboard to load
async function waitForDashboardLoad(page: Page) {
  // Wait for the main dashboard elements to be visible
  await expect(page.getByText('MooMoo Climate')).toBeVisible();
  await expect(page.getByText('Dashboard')).toBeVisible();
  
  // Wait for loading skeleton to disappear
  await expect(page.getByTestId('dashboard-skeleton')).not.toBeVisible({ timeout: 10000 });
  
  // Wait for main sections to be visible
  await expect(page.getByText('CLOSED DEALS')).toBeVisible();
  await expect(page.getByText('QUICK COUNTS')).toBeVisible();
  await expect(page.getByText('DEALS BY REGIONS')).toBeVisible();
}

test.describe('Dashboard Complete User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API mocks before each test
    await mockApiResponses(page);
  });

  test('should load dashboard with real data from initial load to data display', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Should show loading state initially
    await expect(page.getByTestId('dashboard-skeleton')).toBeVisible();
    await expect(page.getByText('Loading dashboard...')).toBeVisible();

    // Wait for dashboard to fully load
    await waitForDashboardLoad(page);

    // Verify main navigation elements
    await expect(page.getByText('MooMoo Climate')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();
    
    // Verify sidebar navigation
    await expect(page.getByText('Advanced Search')).toBeVisible();
    await expect(page.getByText('History')).toBeVisible();
    await expect(page.getByText('Saved Searches')).toBeVisible();

    // Verify header elements
    await expect(page.getByPlaceholder('Search Climate Data')).toBeVisible();
    await expect(page.getByText('Alex Chen')).toBeVisible();

    // Verify main dashboard sections are present
    await expect(page.getByText('CLOSED DEALS')).toBeVisible();
    await expect(page.getByText('QUICK COUNTS')).toBeVisible();
    await expect(page.getByText('DEALS BY REGIONS')).toBeVisible();

    // Verify real-time connection indicator
    await expect(page.getByText('Live')).toBeVisible();

    // Verify refresh button is present and functional
    const refreshButton = page.getByText('Refresh');
    await expect(refreshButton).toBeVisible();
    
    // Test refresh functionality
    await refreshButton.click();
    await expect(page.getByText('Refreshing data...')).toBeVisible();
    
    // Wait for refresh to complete
    await expect(page.getByText('Refreshing data...')).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle progressive loading of different dashboard sections', async ({ page }) => {
    // Mock delayed responses for different sections
    await page.route('**/api/dashboard/metrics', async route => {
      // Delay metrics response
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockMetrics,
          error: null,
          loading: false,
        }),
      });
    });

    await page.route('**/api/deals/recent*', async route => {
      // Delay deals response
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockRecentDeals,
          error: null,
          loading: false,
        }),
      });
    });

    await page.goto('/dashboard');

    // Should show initial loading skeleton
    await expect(page.getByTestId('dashboard-skeleton')).toBeVisible();

    // Wait for progressive loading to complete
    await waitForDashboardLoad(page);

    // Verify all sections loaded successfully
    await expect(page.getByText('CLOSED DEALS')).toBeVisible();
    await expect(page.getByText('QUICK COUNTS')).toBeVisible();
    await expect(page.getByText('DEALS BY REGIONS')).toBeVisible();
  });

  test('should display and interact with search functionality', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Test search input
    const searchInput = page.getByPlaceholder('Search Climate Data');
    await expect(searchInput).toBeVisible();
    
    // Type in search input
    await searchInput.fill('solar energy');
    await expect(searchInput).toHaveValue('solar energy');
    
    // Clear search
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });

  test('should handle user interactions with dashboard controls', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Test add widgets button
    const addWidgetsButton = page.getByText('Add widgets');
    await expect(addWidgetsButton).toBeVisible();
    await addWidgetsButton.click();

    // Test refresh button
    const refreshButton = page.getByText('Refresh');
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();
    
    // Should show refreshing indicator
    await expect(page.getByText('Refreshing data...')).toBeVisible();
    await expect(page.getByText('Refreshing data...')).not.toBeVisible({ timeout: 5000 });

    // Test sidebar navigation
    const advancedSearchButton = page.getByText('Advanced Search');
    await expect(advancedSearchButton).toBeVisible();
    await advancedSearchButton.click();

    const historyButton = page.getByText('History');
    await expect(historyButton).toBeVisible();
    await historyButton.click();
  });

  test('should display dashboard sections with proper content structure', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Verify chart section structure
    const closedDealsSection = page.locator('text=CLOSED DEALS').locator('..');
    await expect(closedDealsSection).toBeVisible();

    // Verify quick counts section
    const quickCountsSection = page.locator('text=QUICK COUNTS').locator('..');
    await expect(quickCountsSection).toBeVisible();

    // Verify world map section
    const worldMapSection = page.locator('text=DEALS BY REGIONS').locator('..');
    await expect(worldMapSection).toBeVisible();
    await expect(page.getByText('World Map Visualization')).toBeVisible();

    // Verify recent deals section would be present (if implemented)
    // This tests the overall layout structure
  });

  test('should handle responsive design on different screen sizes', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Verify sidebar is visible on desktop
    await expect(page.getByText('Advanced Search')).toBeVisible();
    await expect(page.getByText('Hide Sidebar')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('MooMoo Climate')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('MooMoo Climate')).toBeVisible();
    
    // Dashboard should still be functional on mobile
    await expect(page.getByText('CLOSED DEALS')).toBeVisible();
  });

  test('should maintain state during page interactions', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Interact with search
    const searchInput = page.getByPlaceholder('Search Climate Data');
    await searchInput.fill('climate tech');

    // Refresh the page data
    await page.getByText('Refresh').click();
    await expect(page.getByText('Refreshing data...')).toBeVisible();
    await expect(page.getByText('Refreshing data...')).not.toBeVisible({ timeout: 5000 });

    // Search input should maintain its value
    await expect(searchInput).toHaveValue('climate tech');

    // Dashboard sections should still be visible
    await expect(page.getByText('CLOSED DEALS')).toBeVisible();
    await expect(page.getByText('QUICK COUNTS')).toBeVisible();
  });
});