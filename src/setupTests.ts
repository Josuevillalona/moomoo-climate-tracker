import '@testing-library/jest-dom';

// Setup DOM environment for React Testing Library
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-testid' });

// Ensure document.body exists and is properly set up
if (!document.body) {
  document.body = document.createElement('body');
  document.documentElement.appendChild(document.body);
}

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

// Mock document methods
Object.defineProperty(document, 'createElement', {
  writable: true,
  value: jest.fn().mockImplementation((tagName: string) => {
    const element = {
      tagName: tagName.toUpperCase(),
      href: '',
      download: '',
      click: jest.fn(),
      remove: jest.fn(),
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      style: {},
      id: '',
      className: '',
    };
    return element;
  }),
});

// Mock document.body methods
Object.defineProperty(document.body, 'appendChild', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  writable: true,
  value: jest.fn(),
});

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