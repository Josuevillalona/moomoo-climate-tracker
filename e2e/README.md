# End-to-End Tests

This directory contains comprehensive end-to-end tests for the MooMoo Climate dashboard application using Playwright.

## Test Coverage

The e2e tests cover the following user flows and scenarios:

### 1. Dashboard Complete User Flow (`dashboard-flow.spec.ts`)
- **Initial Load to Data Display**: Tests the complete dashboard loading flow from initial skeleton to fully loaded state
- **Progressive Loading**: Tests how different dashboard sections load progressively
- **User Interactions**: Tests search functionality, refresh buttons, and navigation
- **Responsive Design**: Tests dashboard behavior on different screen sizes
- **State Maintenance**: Tests that user state is maintained during interactions

### 2. Error Recovery Scenarios (`error-recovery.spec.ts`)
- **Complete API Failure**: Tests error display and retry functionality when all APIs fail
- **Database Errors**: Tests handling of database connection errors with appropriate messaging
- **Partial Failures**: Tests graceful handling when some APIs succeed and others fail
- **Timeout Errors**: Tests handling of request timeouts with retry mechanisms
- **Network Connectivity**: Tests behavior during network offline/online transitions
- **Rapid Retry Attempts**: Tests that multiple rapid retry clicks are handled gracefully
- **Session Maintenance**: Tests that user sessions are maintained during error recovery
- **Browser Refresh**: Tests error recovery after browser refresh

### 3. Real-time Updates and Notifications (`real-time-updates.spec.ts`)
- **Connection Status**: Tests display of real-time connection status (Live/Offline)
- **Connection Failures**: Tests handling of WebSocket connection failures
- **New Deal Notifications**: Tests display of notifications when new deals arrive
- **Multiple New Deals**: Tests handling of multiple simultaneous new deals
- **Notification Interactions**: Tests dismiss and view deals functionality
- **Auto-hide Behavior**: Tests automatic hiding of notifications after timeout
- **System Notifications**: Tests system-level notifications for new deals
- **Connection Recovery**: Tests reconnection after disconnection
- **Malformed Data**: Tests graceful handling of malformed real-time data
- **Deal Limits**: Tests limiting of displayed new deals
- **Page Visibility**: Tests behavior when page becomes hidden/visible
- **Online/Offline Events**: Tests handling of browser online/offline events

## Requirements Covered

These tests fulfill the requirements specified in subtask 8.3:

- ✅ **Test complete dashboard loading flow from initial load to data display** (Requirements: 1.4, 5.4, 6.4)
- ✅ **Create tests for error recovery and retry scenarios** (Requirements: 1.4, 5.4, 6.4)
- ✅ **Test real-time updates and notification functionality** (Requirements: 1.4, 5.4, 6.4)

## Running the Tests

### Prerequisites

1. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

2. Ensure the development server can be started:
   ```bash
   npm run dev
   ```

### Test Commands

```bash
# Run all e2e tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test dashboard-flow.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium

# Run tests with debug mode
npx playwright test --debug
```

### Test Configuration

The tests are configured in `playwright.config.ts` with the following settings:

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retries**: 2 on CI, 0 locally
- **Reporters**: HTML report
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Traces**: On first retry

### Test Structure

Each test file follows this structure:

1. **Setup**: Mock API responses and configure test environment
2. **Test Cases**: Individual test scenarios with descriptive names
3. **Assertions**: Verify expected behavior using Playwright assertions
4. **Cleanup**: Automatic cleanup handled by Playwright

### Helper Functions

The `e2e/helpers/test-helpers.ts` file provides reusable functions for:

- **API Mocking**: Mock successful and error responses
- **Dashboard Interactions**: Common dashboard operations
- **Real-time Simulation**: Simulate WebSocket events
- **Assertions**: Common assertion patterns
- **Test Data**: Mock data generators

## Test Data

Tests use consistent mock data defined in the helpers:

- **MOCK_METRICS**: Dashboard metrics data
- **MOCK_RECENT_DEALS**: Sample recent deals
- **NEW_MOCK_DEAL**: Sample new deal for real-time testing

## Debugging Tests

### Visual Debugging
```bash
# Run with UI mode to see tests running
npm run test:e2e:ui

# Run in headed mode to see browser
npm run test:e2e:headed
```

### Debug Mode
```bash
# Run with debug mode for step-by-step execution
npx playwright test --debug dashboard-flow.spec.ts
```

### Screenshots and Videos
- Screenshots are automatically taken on test failures
- Videos are recorded and retained on failures
- Traces are captured on first retry for detailed debugging

### Test Reports
After running tests, view the HTML report:
```bash
npx playwright show-report
```

## CI/CD Integration

The tests are configured to run in CI environments with:
- Retry on failure (2 retries)
- Single worker for stability
- Automatic browser installation
- HTML report generation

## Best Practices

1. **Test Independence**: Each test is independent and can run in isolation
2. **Mock Data**: All external dependencies are mocked for reliability
3. **Descriptive Names**: Test names clearly describe the scenario being tested
4. **Error Handling**: Tests verify both success and error scenarios
5. **Responsive Testing**: Tests cover different screen sizes and devices
6. **Real-world Scenarios**: Tests simulate actual user interactions and edge cases

## Troubleshooting

### Common Issues

1. **Port Already in Use**: Ensure no other process is using port 3000
2. **Browser Installation**: Run `npx playwright install` if browsers are missing
3. **Timeout Issues**: Increase timeout values in test configuration if needed
4. **Mock Setup**: Verify API mocks are properly configured for each test

### Getting Help

- Check the [Playwright documentation](https://playwright.dev/docs/intro)
- Review test logs and screenshots in the HTML report
- Use debug mode to step through failing tests
- Check the console output for detailed error messages