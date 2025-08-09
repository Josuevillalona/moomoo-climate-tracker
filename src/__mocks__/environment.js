// Mock environment configuration for tests
export const getEnvironmentConfig = jest.fn(() => ({
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'test-anon-key',
  isDevelopment: true,
  isProduction: false,
  isTest: true,
}));

export default {
  getEnvironmentConfig,
};