import '@testing-library/jest-dom';

// Mock environment variables with proper JWT format
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
process.env.NODE_ENV = 'test';

// Setup DOM environment for React Testing Library
import { configure } from '@testing-library/react';
import { cleanup } from '@testing-library/react';

// Configure React Testing Library
configure({ 
  testIdAttribute: 'data-testid',
});

// Polyfill for React 18 compatibility with JSDOM
if (typeof global !== 'undefined' && !global.IS_REACT_ACT_ENVIRONMENT) {
  global.IS_REACT_ACT_ENVIRONMENT = true;
}

// React 18 specific configuration
global.React = require('react');

// React 18 compatibility
Object.defineProperty(global, 'IS_REACT_ACT_ENVIRONMENT', {
  writable: true,
  value: true,
});

// Ensure proper DOM setup
beforeEach(() => {
  // Reset document body
  document.body.innerHTML = '';
});

// Ensure cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock PerformanceObserver
global.PerformanceObserver = class PerformanceObserver {
  constructor(callback: any) {}
  observe() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.location - only if not already defined
if (!window.location) {
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
      reload: jest.fn(),
      assign: jest.fn(),
      replace: jest.fn(),
    },
    writable: true,
  });
}

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};

// Mock fetch
global.fetch = jest.fn();

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
  },
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    userAgent: 'Mozilla/5.0 (Test Environment)',
    language: 'en-US',
    languages: ['en-US', 'en'],
    onLine: true,
    cookieEnabled: true,
    connection: {
      effectiveType: '4g'
    }
  },
});

// Note: Removed document.createElement mock to allow real DOM elements

// Note: Removed document.body mocks to allow real DOM manipulation

// Mock URL methods
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'blob:mock-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// Mock screen object
Object.defineProperty(window, 'screen', {
  writable: true,
  value: {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock document properties
Object.defineProperty(document, 'readyState', {
  writable: true,
  value: 'complete',
});

Object.defineProperty(document, 'referrer', {
  writable: true,
  value: 'https://example.com',
});

Object.defineProperty(document, 'title', {
  writable: true,
  value: 'Test Page',
});

Object.defineProperty(document, 'visibilityState', {
  writable: true,
  value: 'visible',
});

Object.defineProperty(document, 'hidden', {
  writable: true,
  value: false,
});