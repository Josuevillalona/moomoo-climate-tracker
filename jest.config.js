const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock problematic modules
    '^@supabase/supabase-js$': '<rootDir>/src/__mocks__/supabase.js',
    '^@supabase/realtime-js$': '<rootDir>/src/__mocks__/realtime.js',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/', 
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/', // Exclude Playwright tests
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(isows|@supabase|@testing-library|@tanstack|@radix-ui|lucide-react)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/setupTests.ts',
    '!src/__mocks__/**',
  ],
  testTimeout: 15000,
  maxWorkers: '50%',
  // Handle ES modules better
  preset: undefined,
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)