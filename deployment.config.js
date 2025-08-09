/**
 * Deployment Configuration for Climate Tech Funding Dashboard
 * This file contains deployment settings for different environments
 */

const deploymentConfig = {
  // Development environment
  development: {
    name: 'Development',
    url: 'http://localhost:3000',
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    features: {
      analytics: false,
      realTime: true,
      caching: true,
      debugging: true,
    },
    performance: {
      apiTimeout: 10000,
      retryAttempts: 3,
      cacheTimeout: 300000, // 5 minutes
    },
    logging: {
      level: 'debug',
      enableConsole: true,
      enableRemote: false,
    },
  },

  // Staging environment
  staging: {
    name: 'Staging',
    url: process.env.STAGING_URL || 'https://staging.climate-funding.app',
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    features: {
      analytics: true,
      realTime: true,
      caching: true,
      debugging: false,
    },
    performance: {
      apiTimeout: 8000,
      retryAttempts: 2,
      cacheTimeout: 600000, // 10 minutes
    },
    logging: {
      level: 'info',
      enableConsole: false,
      enableRemote: true,
    },
    monitoring: {
      errorTracking: true,
      performanceMonitoring: true,
      userAnalytics: true,
    },
  },

  // Production environment
  production: {
    name: 'Production',
    url: process.env.PRODUCTION_URL || 'https://climate-funding.app',
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    features: {
      analytics: true,
      realTime: true,
      caching: true,
      debugging: false,
    },
    performance: {
      apiTimeout: 5000,
      retryAttempts: 2,
      cacheTimeout: 900000, // 15 minutes
    },
    logging: {
      level: 'error',
      enableConsole: false,
      enableRemote: true,
    },
    monitoring: {
      errorTracking: true,
      performanceMonitoring: true,
      userAnalytics: true,
      uptime: true,
    },
    security: {
      csp: true,
      hsts: true,
      xssProtection: true,
    },
  },
};

// Validation function
function validateConfig(env) {
  const config = deploymentConfig[env];
  
  if (!config) {
    throw new Error(`Invalid environment: ${env}`);
  }

  const required = [
    'supabase.url',
    'supabase.anonKey',
  ];

  for (const path of required) {
    const value = path.split('.').reduce((obj, key) => obj?.[key], config);
    if (!value) {
      throw new Error(`Missing required configuration: ${path} for environment ${env}`);
    }
  }

  return config;
}

// Get current environment configuration
function getConfig() {
  const env = process.env.NODE_ENV || 'development';
  return validateConfig(env);
}

// Export configuration
module.exports = {
  deploymentConfig,
  validateConfig,
  getConfig,
  
  // Helper functions
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isStaging: () => process.env.NODE_ENV === 'staging',
  isProduction: () => process.env.NODE_ENV === 'production',
  
  // Feature flags
  isFeatureEnabled: (feature) => {
    const config = getConfig();
    return config.features[feature] || false;
  },
  
  // Performance settings
  getPerformanceConfig: () => {
    const config = getConfig();
    return config.performance;
  },
  
  // Logging configuration
  getLoggingConfig: () => {
    const config = getConfig();
    return config.logging;
  },
};

// Environment-specific build configurations
const buildConfig = {
  development: {
    minify: false,
    sourceMaps: true,
    bundleAnalyzer: true,
    experimental: {
      turbo: true,
    },
  },
  
  staging: {
    minify: true,
    sourceMaps: true,
    bundleAnalyzer: false,
    experimental: {
      optimizeCss: true,
    },
  },
  
  production: {
    minify: true,
    sourceMaps: false,
    bundleAnalyzer: false,
    experimental: {
      optimizeCss: true,
      optimizeImages: true,
    },
    output: 'standalone',
  },
};

module.exports.buildConfig = buildConfig;