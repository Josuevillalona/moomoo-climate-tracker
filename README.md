# Climate Tech Funding Dashboard

A comprehensive dashboard for tracking climate technology funding rounds, built with Next.js and Supabase.

## Features

- **Real-time Data**: Live updates of funding rounds and market metrics
- **Interactive Dashboard**: Comprehensive view of climate tech funding landscape
- **Performance Optimized**: Fast loading with intelligent caching
- **Responsive Design**: Works seamlessly across all devices
- **Error Handling**: Robust error recovery and user feedback

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd climate-funding-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create environment file
./scripts/setup-env.sh local

# Edit .env.local with your Supabase credentials
```

4. Start development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Environment Setup

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |

### Environment Configuration

Use the provided scripts to set up environments:

```bash
# Development environment
./scripts/setup-env.sh local

# Staging environment  
./scripts/setup-env.sh staging

# Production environment
./scripts/setup-env.sh production

# Validate configuration
./scripts/setup-env.sh validate
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run ESLint

### Testing

```bash
# Run all tests
npm run test:ci

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

## Deployment

### Quick Deployment

1. Prepare for deployment:
```bash
npm run deploy:prepare
```

2. Deploy to staging:
```bash
npm run deploy:staging
```

3. Deploy to production:
```bash
npm run deploy:production
```

### Deployment Platforms

#### Vercel (Recommended)
- Automatic deployments from Git
- Built-in environment variable management
- Global CDN and edge functions

#### Netlify
- Git-based deployments
- Form handling and serverless functions
- Built-in CI/CD pipeline

#### Docker
- Containerized deployment
- Kubernetes support
- Self-hosted options

### Environment-Specific Deployments

See detailed deployment guides:
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [API Integration](./docs/API_INTEGRATION.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Query for server state
- **Real-time**: Supabase real-time subscriptions

### Backend
- **Database**: Supabase (PostgreSQL)
- **API**: Supabase REST API and real-time
- **Authentication**: Supabase Auth (if needed)
- **Storage**: Supabase Storage (if needed)

### Key Components

- **Dashboard**: Main analytics and metrics view
- **Real-time Updates**: Live funding round notifications
- **Error Handling**: Comprehensive error boundaries
- **Performance**: Optimized queries and caching

## API Documentation

### Endpoints

The application uses Supabase REST API endpoints:

- `GET /rest/v1/deals` - Retrieve funding deals
- `GET /api/health` - Health check endpoint
- WebSocket subscriptions for real-time updates

### Data Models

```typescript
interface FundingDeal {
  id: number;
  company_name: string;
  funding_stage: string;
  amount_raised: number;
  date_announced: string;
  lead_investors: string;
  climate_sub_sector: string;
  geography_country: string;
  status: string;
}
```

See [API Integration Guide](./docs/API_INTEGRATION.md) for detailed documentation.

## Performance

### Optimization Features

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Caching**: React Query with intelligent cache management
- **Database**: Optimized queries with proper indexing
- **Real-time**: Efficient WebSocket connection management

### Performance Metrics

- Initial page load: < 3 seconds
- API response time: < 2 seconds
- Real-time update latency: < 500ms
- Bundle size: < 50MB

## Monitoring and Health

### Health Check

The application includes a comprehensive health check endpoint:

```bash
curl https://your-domain.com/api/health
```

### Monitoring Features

- Application uptime monitoring
- Database connectivity checks
- Performance metrics tracking
- Error rate monitoring
- Real-time connection health

## Troubleshooting

### Common Issues

1. **Environment Variables**: Use `./scripts/setup-env.sh validate`
2. **Database Connection**: Check Supabase project status
3. **Build Failures**: Verify TypeScript and dependencies
4. **Performance Issues**: Check bundle size and queries

See [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) for detailed solutions.

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Jest for unit testing
- Playwright for E2E testing

## Security

### Security Features

- Row Level Security (RLS) in Supabase
- Content Security Policy (CSP)
- Rate limiting on API endpoints
- Environment variable validation
- Secure headers configuration

### Security Best Practices

- Never commit environment files
- Use different keys for different environments
- Regularly rotate API keys
- Monitor for security vulnerabilities
- Keep dependencies updated

## Support

### Documentation

- [Setup Guide](./docs/SETUP.md)
- [API Integration](./docs/API_INTEGRATION.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

### Getting Help

1. Check the troubleshooting guide
2. Search existing issues
3. Create a detailed bug report
4. Contact the development team

## License

[Add your license information here]

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.