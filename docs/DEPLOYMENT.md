# Deployment Guide

## Overview

This guide covers the deployment process for the Climate Tech Funding Dashboard, including environment setup, build configuration, and deployment to various platforms.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase project set up
- Access to deployment platform (Vercel, Netlify, etc.)

## Environment Setup

### 1. Environment Variables

Create environment files for each deployment stage:

```bash
# Create environment files
./scripts/setup-env.sh local      # For development
./scripts/setup-env.sh staging    # For staging
./scripts/setup-env.sh production # For production
```

### 2. Required Environment Variables

| Variable                        | Description                          | Required |
| ------------------------------- | ------------------------------------ | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                 | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key               | Yes      |
| `NODE_ENV`                      | Environment (development/production) | Yes      |
| `NEXT_PUBLIC_ENABLE_ANALYTICS`  | Enable analytics tracking            | No       |
| `NEXT_PUBLIC_LOG_LEVEL`         | Logging level (debug/info/error)     | No       |

### 3. Environment Validation

Validate your environment setup:

```bash
# Validate all environment files
./scripts/setup-env.sh validate

# Test Supabase connection
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/deals?select=count"
```

## Build Process

### 1. Pre-build Checks

Run the deployment preparation script:

```bash
./scripts/deploy.sh
```

This script will:

- ✅ Validate environment variables
- ✅ Test Supabase connection
- ✅ Run test suite
- ✅ Build the application
- ✅ Check build size
- ✅ Generate deployment report

### 2. Manual Build

If you need to build manually:

```bash
# Install dependencies
npm install

# Run tests
npm run test:ci

# Build application
npm run build

# Start production server (for testing)
npm start
```

### 3. Build Optimization

The build process includes several optimizations:

- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js Image component with optimization
- **CSS Optimization**: Automatic CSS minification and purging
- **Bundle Analysis**: Optional bundle size analysis

## Deployment Platforms

### Vercel (Recommended)

Vercel provides the best integration with Next.js applications.

#### 1. Automatic Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### 2. Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to staging
vercel --env staging

# Deploy to production
vercel --prod
```

#### 3. Vercel Configuration

Create `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Netlify

#### 1. Build Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_ENV = "production"
  NEXT_TELEMETRY_DISABLED = "1"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[context.production.environment]
  NODE_ENV = "production"

[context.deploy-preview.environment]
  NODE_ENV = "staging"
```

#### 2. Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to staging
netlify deploy

# Deploy to production
netlify deploy --prod
```

### Docker Deployment

#### 1. Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### 2. Docker Compose

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### 3. Build and Run

```bash
# Build Docker image
docker build -t climate-funding-dashboard .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="your_url" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your_key" \
  climate-funding-dashboard
```

## Database Setup

### 1. Supabase Configuration

Ensure your Supabase project is properly configured:

```sql
-- Enable Row Level Security
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Create read policy for public access
CREATE POLICY "Public read access to verified deals"
ON deals FOR SELECT
USING (status = 'verified');

-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_deals_status_date
ON deals(status, date_announced DESC);

CREATE INDEX CONCURRENTLY idx_deals_company_name
ON deals(company_name) WHERE status = 'verified';
```

### 2. Real-time Configuration

Enable real-time subscriptions:

1. Go to Supabase Dashboard > Settings > API
2. Enable Real-time for the `deals` table
3. Configure replication settings if needed

### 3. Database Migration

If you need to run migrations:

```bash
# Using Supabase CLI
supabase db push

# Or run SQL files directly
psql -h your-host -U postgres -d your-db -f sql/create_deals_table.sql
```

## Monitoring and Health Checks

### 1. Health Check Endpoint

Create a health check API route:

```typescript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
  });
}
```

### 2. Monitoring Setup

Configure monitoring for your deployment:

```javascript
// lib/monitoring/deployment.js
export const deploymentMonitoring = {
  // Health check
  healthCheck: async () => {
    try {
      const response = await fetch("/api/health");
      return response.ok;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  },

  // Database connectivity
  databaseCheck: async () => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .select("count")
        .limit(1);
      return !error;
    } catch (error) {
      console.error("Database check failed:", error);
      return false;
    }
  },

  // Performance metrics
  performanceCheck: () => {
    if (typeof window !== "undefined") {
      const navigation = performance.getEntriesByType("navigation")[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded:
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName("first-paint")[0]?.startTime,
      };
    }
    return null;
  },
};
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod"
```

## Security Considerations

### 1. Environment Variables

- Never commit `.env` files to version control
- Use platform-specific secret management
- Rotate keys regularly
- Use different keys for different environments

### 2. Content Security Policy

Add CSP headers in `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      connect-src 'self' https://*.supabase.co wss://*.supabase.co;
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};
```

### 3. Rate Limiting

Implement rate limiting for API routes:

```typescript
// lib/rate-limit.ts
import { LRUCache } from "lru-cache";

const rateLimit = new LRUCache({
  max: 500,
  ttl: 60000, // 1 minute
});

export function rateLimiter(identifier: string, limit = 10) {
  const count = rateLimit.get(identifier) || 0;

  if (count >= limit) {
    return false;
  }

  rateLimit.set(identifier, count + 1);
  return true;
}
```

## Performance Optimization

### 1. Caching Strategy

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
};
```

### 2. Image Optimization

```typescript
// components/OptimizedImage.tsx
import Image from "next/image";

export function OptimizedImage({ src, alt, ...props }) {
  return (
    <Image
      src={src}
      alt={alt}
      loading="lazy"
      quality={85}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
      {...props}
    />
  );
}
```

## Rollback Strategy

### 1. Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### 2. Feature Flags

Implement feature flags for gradual rollouts:

```typescript
// lib/feature-flags.ts
export const featureFlags = {
  useRealTimeUpdates: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME === "true",
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
  useCaching: process.env.NEXT_PUBLIC_ENABLE_CACHING === "true",
};
```

## Troubleshooting Deployment Issues

### Common Issues

1. **Build Failures**: Check TypeScript errors and dependency issues
2. **Environment Variables**: Verify all required variables are set
3. **Database Connection**: Test Supabase connectivity
4. **Performance**: Monitor build size and loading times

### Debug Commands

```bash
# Check build locally
npm run build
npm start

# Analyze bundle size
npm run analyze

# Test production build
NODE_ENV=production npm start

# Check deployment logs
vercel logs [deployment-url]
```

## Post-Deployment Checklist

- [ ] Health check endpoint responds correctly
- [ ] Database connection is working
- [ ] Real-time updates are functioning
- [ ] Error tracking is configured
- [ ] Performance monitoring is active
- [ ] SSL certificate is valid
- [ ] CDN is properly configured
- [ ] Backup strategy is in place

## Support and Maintenance

### Regular Tasks

1. **Weekly**: Review error logs and performance metrics
2. **Monthly**: Update dependencies and security patches
3. **Quarterly**: Review and optimize database queries
4. **Annually**: Rotate API keys and certificates

### Monitoring Dashboards

Set up monitoring dashboards to track:

- Application uptime
- Response times
- Error rates
- Database performance
- User analytics

For detailed troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
