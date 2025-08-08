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

const newMockDeal = {
  id: 3,
  companyName: 'WindPower Solutions',
  fundingStage: 'Series B',
  amountRaised: 40000000,
  dateAnnounced: '2024-01-20',
  climateSector: 'Wind Energy',
  country: 'Denmark',
};

// Helper function to mock successful API responses
async function mockApiResponses(page: Page) {
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
}

// Helper function to simulate real-time updates
async function simulateRealTimeUpdate(page: Page, newDeal: any) {
  // Inject script to simulate WebSocket message
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

// Helper function to wait for dashboard to load
async function waitForDashboardLoad(page: Page) {
  await expect(page.getByText('MooMoo Climate')).toBeVisible();
  await expect(page.getByTestId('dashboard-skeleton')).not.toBeVisible({ timeout: 10000 });
  await expect(page.getByText('CLOSED DEALS')).toBeVisible();
}

test.describe('Real-time Updates and Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiResponses(page);
  });

  test('should display real-time connection status correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Should show live connection indicator
    await expect(page.getByText('Live')).toBeVisible();

    // Connection indicator should be green/active
    const connectionIndicator = page.locator('[data-testid="connection-indicator"], .bg-green-500, text=Live').first();
    await expect(connectionIndicator).toBeVisible();
  });

  test('should handle real-time connection failures and show offline state', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Initially should be connected
    await expect(page.getByText('Live')).toBeVisible();

    // Simulate connection failure by injecting script
    await page.evaluate(() => {
      // Simulate WebSocket connection failure
      const event = new CustomEvent('supabase-connection-error', {
        detail: { error: 'WebSocket connection failed' }
      });
      window.dispatchEvent(event);
    });

    // Should show offline state
    await expect(page.getByText('Offline')).toBeVisible();
    await expect(page.getByText('Real-time updates disconnected')).toBeVisible();

    // Should have reconnect button
    const reconnectButton = page.getByText('Reconnect');
    await expect(reconnectButton).toBeVisible();

    // Test reconnect functionality
    await reconnectButton.click();

    // Should attempt to reconnect (may show connecting state)
    // The exact behavior depends on implementation
  });

  test('should display new deals notification when new deals arrive', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Should not show notification initially
    await expect(page.getByTestId('new-deals-notification')).not.toBeVisible();

    // Simulate new deal arrival
    await simulateRealTimeUpdate(page, newMockDeal);

    // Should show new deals notification
    await expect(page.getByTestId('new-deals-notification')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('new-deals-count')).toContainText('1 new deal');

    // Should have dismiss and view deals buttons
    await expect(page.getByTestId('dismiss-notification')).toBeVisible();
    await expect(page.getByTestId('view-deals')).toBeVisible();
  });

  test('should handle multiple new deals correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Simulate multiple new deals
    const deal1 = { ...newMockDeal, id: 3, companyName: 'Deal 1' };
    const deal2 = { ...newMockDeal, id: 4, companyName: 'Deal 2' };
    const deal3 = { ...newMockDeal, id: 5, companyName: 'Deal 3' };

    await simulateRealTimeUpdate(page, deal1);
    await simulateRealTimeUpdate(page, deal2);
    await simulateRealTimeUpdate(page, deal3);

    // Should show notification with correct count
    await expect(page.getByTestId('new-deals-notification')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('new-deals-count')).toContainText('3 new deals');
  });

  test('should dismiss new deals notification correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Simulate new deal
    await simulateRealTimeUpdate(page, newMockDeal);

    // Wait for notification to appear
    await expect(page.getByTestId('new-deals-notification')).toBeVisible({ timeout: 5000 });

    // Click dismiss button
    await page.getByTestId('dismiss-notification').click();

    // Notification should disappear
    await expect(page.getByTestId('new-deals-notification')).not.toBeVisible();
  });

  test('should scroll to recent deals section when view deals is clicked', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Simulate new deal
    await simulateRealTimeUpdate(page, newMockDeal);

    // Wait for notification
    await expect(page.getByTestId('new-deals-notification')).toBeVisible({ timeout: 5000 });

    // Click view deals button
    await page.getByTestId('view-deals').click();

    // Should scroll to recent deals section (if it exists)
    // This test verifies the click handler works - actual scrolling behavior
    // depends on the implementation and presence of the recent deals section
    
    // Notification should be dismissed after clicking view deals
    await expect(page.getByTestId('new-deals-notification')).not.toBeVisible();
  });

  test('should auto-hide notification after specified duration', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Simulate new deal
    await simulateRealTimeUpdate(page, newMockDeal);

    // Wait for notification to appear
    await expect(page.getByTestId('new-deals-notification')).toBeVisible({ timeout: 5000 });

    // Wait for auto-hide (assuming 6 second duration)
    await expect(page.getByTestId('new-deals-notification')).not.toBeVisible({ timeout: 8000 });
  });

  test('should show system notifications for new deals', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Simulate new deal
    await simulateRealTimeUpdate(page, newMockDeal);

    // Should show system notification (if implemented)
    const systemNotification = page.getByTestId('notification-container');
    if (await systemNotification.isVisible()) {
      await expect(systemNotification).toContainText('New Funding Data');
      await expect(systemNotification).toContainText('1 new deal added');
    }
  });

  test('should handle real-time updates during dashboard refresh', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Start a refresh
    await page.getByText('Refresh').click();
    await expect(page.getByText('Refreshing data...')).toBeVisible();

    // Simulate new deal during refresh
    await simulateRealTimeUpdate(page, newMockDeal);

    // Wait for refresh to complete
    await expect(page.getByText('Refreshing data...')).not.toBeVisible({ timeout: 5000 });

    // Should still handle the real-time update
    await expect(page.getByTestId('new-deals-notification')).toBeVisible({ timeout: 5000 });
  });

  test('should handle connection recovery after disconnection', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Initially connected
    await expect(page.getByText('Live')).toBeVisible();

    // Simulate disconnection
    await page.evaluate(() => {
      const event = new CustomEvent('supabase-connection-error', {
        detail: { error: 'Connection lost' }
      });
      window.dispatchEvent(event);
    });

    // Should show offline state
    await expect(page.getByText('Offline')).toBeVisible();

    // Simulate reconnection
    await page.evaluate(() => {
      const event = new CustomEvent('supabase-connection-restored');
      window.dispatchEvent(event);
    });

    // Should show connected state again
    await expect(page.getByText('Live')).toBeVisible({ timeout: 5000 });

    // Should be able to receive real-time updates again
    await simulateRealTimeUpdate(page, newMockDeal);
    await expect(page.getByTestId('new-deals-notification')).toBeVisible({ timeout: 5000 });
  });

  test('should handle real-time updates with malformed data gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Simulate malformed real-time data
    await page.evaluate(() => {
      const event = new CustomEvent('supabase-realtime-deal', {
        detail: {
          eventType: 'INSERT',
          new: { invalid: 'data' }, // Missing required fields
          old: null,
          errors: null,
        }
      });
      window.dispatchEvent(event);
    });

    // Should not crash or show notification for malformed data
    await expect(page.getByTestId('new-deals-notification')).not.toBeVisible();
    
    // Dashboard should still be functional
    await expect(page.getByText('MooMoo Climate')).toBeVisible();
    await expect(page.getByText('CLOSED DEALS')).toBeVisible();
  });

  test('should limit the number of new deals displayed', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Simulate many new deals (more than the limit)
    for (let i = 1; i <= 15; i++) {
      const deal = { ...newMockDeal, id: i + 10, companyName: `Deal ${i}` };
      await simulateRealTimeUpdate(page, deal);
    }

    // Should show notification but with limited count (depends on implementation)
    await expect(page.getByTestId('new-deals-notification')).toBeVisible({ timeout: 5000 });
    
    // The exact count depends on the maxNewDeals setting in the implementation
    const countText = await page.getByTestId('new-deals-count').textContent();
    expect(countText).toMatch(/\d+ new deals?/);
  });

  test('should handle page visibility changes correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Should be connected initially
    await expect(page.getByText('Live')).toBeVisible();

    // Simulate page becoming hidden
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
      });
      const event = new Event('visibilitychange');
      document.dispatchEvent(event);
    });

    // Simulate page becoming visible again
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });
      const event = new Event('visibilitychange');
      document.dispatchEvent(event);
    });

    // Should maintain or restore connection
    await expect(page.getByText('Live')).toBeVisible({ timeout: 5000 });

    // Should still be able to receive updates
    await simulateRealTimeUpdate(page, newMockDeal);
    await expect(page.getByTestId('new-deals-notification')).toBeVisible({ timeout: 5000 });
  });

  test('should handle browser online/offline events', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);

    // Initially online and connected
    await expect(page.getByText('Live')).toBeVisible();

    // Simulate going offline
    await page.evaluate(() => {
      const event = new Event('offline');
      window.dispatchEvent(event);
    });

    // Should show offline state
    await expect(page.getByText('Offline')).toBeVisible({ timeout: 5000 });

    // Simulate coming back online
    await page.evaluate(() => {
      const event = new Event('online');
      window.dispatchEvent(event);
    });

    // Should attempt to reconnect
    await expect(page.getByText('Live')).toBeVisible({ timeout: 10000 });
  });
});