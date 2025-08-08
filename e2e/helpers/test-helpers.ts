import { Page, expect } from '@playwright/test';

// Mock data constants
export const MOCK_METRICS = {
  totalDeals: 150,
  totalFunding: 2500000000,
  totalCompanies: 120,
  totalInvestors: 85,
  growthRate: 15.5,
  averageDealSize: 16666667,
  topSectors: [
    { sector: 'Solar Energy', dealCount: 25, totalFunding: 500000000, percentage: 16.7 },
    { sector: 'Carbon Capture', dealCount: 20, totalFunding: 400000000, percentage: 13.3 },
    { sector: 'Energy Storage', dealCount: 18, totalFunding: 350000000, percentage: 12.0 },
  ],
  topCountries: [
    { country: 'United States', dealCount: 60, totalFunding: 1200000000, percentage: 40.0 },
    { country: 'Germany', dealCount: 25, totalFunding: 500000000, percentage: 16.7 },
    { country: 'United Kingdom', dealCount: 20, totalFunding: 400000000, percentage: 13.3 },
  ],
};

export const MOCK_RECENT_DEALS = [
  {
    id: 1,
    companyName: 'SolarTech Inc',
    fundingStage: 'Series A',
    amountRaised: 25000000,
    dateAnnounced: '2024-01-15',
    leadInvestors: ['Green Ventures'],
    otherInvestors: ['Climate Capital'],
    climateSector: 'Solar Energy',
    country: 'United States',
    status: 'verified',
    createdAt: '2024-01-15T10:00:00Z',
    formattedAmount: '$25M',
    formattedDate: 'Jan 15, 2024',
    daysAgo: 5,
    allInvestors: ['Green Ventures', 'Climate Capital'],
  },
  {
    id: 2,
    companyName: 'CarbonCapture Co',
    fundingStage: 'Seed',
    amountRaised: 5000000,
    dateAnnounced: '2024-01-10',
    leadInvestors: ['Tech Ventures'],
    otherInvestors: [],
    climateSector: 'Carbon Capture',
    country: 'Germany',
    status: 'verified',
    createdAt: '2024-01-10T14:30:00Z',
    formattedAmount: '$5M',
    formattedDate: 'Jan 10, 2024',
    daysAgo: 10,
    allInvestors: ['Tech Ventures'],
  },
];

export const NEW_MOCK_DEAL = {
  id: 3,
  companyName: 'WindPower Solutions',
  fundingStage: 'Series B',
  amountRaised: 40000000,
  dateAnnounced: '2024-01-20',
  leadInvestors: ['Wind Capital'],
  otherInvestors: ['Energy Fund'],
  climateSector: 'Wind Energy',
  country: 'Denmark',
  status: 'verified',
  createdAt: '2024-01-20T12:00:00Z',
  formattedAmount: '$40M',
  formattedDate: 'Jan 20, 2024',
  daysAgo: 1,
  allInvestors: ['Wind Capital', 'Energy Fund'],
};

// API mocking helpers
export async function mockSuccessfulApiResponses(page: Page) {
  await page.route('**/api/dashboard/metrics', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: MOCK_METRICS,
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
        data: MOCK_RECENT_DEALS,
        error: null,
        loading: false,
      }),
    });
  });
}

export async function mockApiError(page: Page, errorType: 'network' | 'database' | 'timeout' | 'partial') {
  switch (errorType) {
    case 'network':
      await page.route('**/api/dashboard/metrics', async route => {
        await route.abort('failed');
      });
      await page.route('**/api/deals/recent*', async route => {
        await route.abort('failed');
      });
      break;

    case 'database':
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
      await page.route('**/api/dashboard/metrics', async route => {
        await new Promise(resolve => setTimeout(resolve, 10000));
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
      await page.route('**/api/dashboard/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: MOCK_METRICS,
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

// Dashboard interaction helpers
export async function waitForDashboardLoad(page: Page) {
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

export async function waitForErrorState(page: Page) {
  await expect(page.getByTestId('dashboard-error-fallback')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('error-message')).toBeVisible();
  await expect(page.getByTestId('retry-button')).toBeVisible();
}

export async function simulateRealTimeUpdate(page: Page, newDeal: any) {
  await page.evaluate((deal) => {
    // Simulate real-time deal insertion
    const event = new CustomEvent('supabase-realtime-deal', {
      detail: {
        eventType: 'INSERT',
        new: deal,
        old: null,
        errors: null,
      }
    });
    window.dispatchEvent(event);
  }, newDeal);
}

export async function simulateConnectionError(page: Page, errorMessage = 'WebSocket connection failed') {
  await page.evaluate((message) => {
    const event = new CustomEvent('supabase-connection-error', {
      detail: { error: message }
    });
    window.dispatchEvent(event);
  }, errorMessage);
}

export async function simulateConnectionRestore(page: Page) {
  await page.evaluate(() => {
    const event = new CustomEvent('supabase-connection-restored');
    window.dispatchEvent(event);
  });
}

// Assertion helpers
export async function assertDashboardLoaded(page: Page) {
  await expect(page.getByText('MooMoo Climate')).toBeVisible();
  await expect(page.getByText('Dashboard')).toBeVisible();
  await expect(page.getByText('CLOSED DEALS')).toBeVisible();
  await expect(page.getByText('QUICK COUNTS')).toBeVisible();
  await expect(page.getByText('DEALS BY REGIONS')).toBeVisible();
}

export async function assertErrorState(page: Page, expectedErrorText?: string) {
  await expect(page.getByTestId('dashboard-error-fallback')).toBeVisible();
  if (expectedErrorText) {
    await expect(page.getByTestId('error-message')).toContainText(expectedErrorText);
  }
  await expect(page.getByTestId('retry-button')).toBeVisible();
}

export async function assertRealTimeConnected(page: Page) {
  await expect(page.getByText('Live')).toBeVisible();
}

export async function assertRealTimeDisconnected(page: Page) {
  await expect(page.getByText('Offline')).toBeVisible();
  await expect(page.getByText('Real-time updates disconnected')).toBeVisible();
  await expect(page.getByText('Reconnect')).toBeVisible();
}

export async function assertNewDealsNotification(page: Page, expectedCount: number) {
  await expect(page.getByTestId('new-deals-notification')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('new-deals-count')).toContainText(`${expectedCount} new deal${expectedCount > 1 ? 's' : ''}`);
  await expect(page.getByTestId('dismiss-notification')).toBeVisible();
  await expect(page.getByTestId('view-deals')).toBeVisible();
}

// Navigation helpers
export async function navigateToDashboard(page: Page) {
  await page.goto('/dashboard');
}

export async function refreshDashboard(page: Page) {
  await page.getByText('Refresh').click();
  await expect(page.getByText('Refreshing data...')).toBeVisible();
  await expect(page.getByText('Refreshing data...')).not.toBeVisible({ timeout: 5000 });
}

export async function searchInDashboard(page: Page, searchTerm: string) {
  const searchInput = page.getByPlaceholder('Search Climate Data');
  await searchInput.fill(searchTerm);
  return searchInput;
}

// Utility functions
export function createMockDeal(overrides: Partial<typeof NEW_MOCK_DEAL> = {}) {
  return {
    ...NEW_MOCK_DEAL,
    ...overrides,
  };
}

export async function waitForTimeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test data generators
export function generateMultipleDeals(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    ...NEW_MOCK_DEAL,
    id: NEW_MOCK_DEAL.id + i,
    companyName: `Test Company ${i + 1}`,
  }));
}

// Browser state helpers
export async function simulateOffline(page: Page) {
  await page.context().setOffline(true);
  await page.evaluate(() => {
    const event = new Event('offline');
    window.dispatchEvent(event);
  });
}

export async function simulateOnline(page: Page) {
  await page.context().setOffline(false);
  await page.evaluate(() => {
    const event = new Event('online');
    window.dispatchEvent(event);
  });
}

export async function simulatePageHidden(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
    });
    const event = new Event('visibilitychange');
    document.dispatchEvent(event);
  });
}

export async function simulatePageVisible(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    });
    const event = new Event('visibilitychange');
    document.dispatchEvent(event);
  });
}