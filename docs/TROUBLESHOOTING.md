# Troubleshooting Guide

## Common Integration Issues

This guide covers common issues you might encounter when working with the Climate Tech Funding Dashboard integration and their solutions.

## Table of Contents

1. [Environment Configuration Issues](#environment-configuration-issues)
2. [Supabase Connection Problems](#supabase-connection-problems)
3. [Data Loading Issues](#data-loading-issues)
4. [Real-time Subscription Problems](#real-time-subscription-problems)
5. [Performance Issues](#performance-issues)
6. [Build and Deployment Issues](#build-and-deployment-issues)
7. [Error Handling Issues](#error-handling-issues)
8. [Testing Issues](#testing-issues)

---

## Environment Configuration Issues

### Issue: Missing Environment Variables

**Symptoms:**
- Application fails to start
- Console errors about undefined environment variables
- Supabase client initialization fails

**Error Messages:**
```
Error: supabaseUrl is required
Error: supabaseKey is required
```

**Solution:**
1. Check if `.env.local` file exists in project root
2. Verify all required environment variables are set:
   ```bash
   # Run environment validation
   ./scripts/setup-env.sh validate
   ```
3. Create missing environment file:
   ```bash
   ./scripts/setup-env.sh local
   ```
4. Update placeholder values with actual Supabase credentials

**Prevention:**
- Use the provided setup script for environment configuration
- Add environment validation to your CI/CD pipeline
- Document required environment variables in README

### Issue: Wrong Environment Variable Format

**Symptoms:**
- Supabase client connects but API calls fail
- CORS errors in browser console
- Authentication errors

**Error Messages:**
```
Access to fetch at 'undefined/rest/v1/deals' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
1. Verify Supabase URL format:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   ```
2. Ensure no trailing slashes in URL
3. Verify anon key is the public key, not service role key
4. Check for extra spaces or quotes in environment file

---

## Supabase Connection Problems

### Issue: Connection Timeout

**Symptoms:**
- API calls hang indefinitely
- Dashboard shows loading state permanently
- Network tab shows pending requests

**Error Messages:**
```
Error: Request timeout after 10000ms
```

**Solution:**
1. Check network connectivity to Supabase
2. Verify Supabase project is active and not paused
3. Test connection manually:
   ```bash
   curl -H "apikey: YOUR_ANON_KEY" \
        -H "Authorization: Bearer YOUR_ANON_KEY" \
        "YOUR_SUPABASE_URL/rest/v1/deals?select=count"
   ```
4. Increase timeout in API configuration:
   ```typescript
   const supabase = createClient(url, key, {
     global: {
       fetch: (url, options = {}) => {
         return fetch(url, {
           ...options,
           signal: AbortSignal.timeout(15000) // 15 seconds
         });
       }
     }
   });
   ```

### Issue: Authentication Errors

**Symptoms:**
- 401 Unauthorized errors
- API calls return empty results
- RLS policy blocks access

**Error Messages:**
```
Error: JWT expired
Error: Row Level Security policy violation
```

**Solution:**
1. Verify anon key is correct and not expired
2. Check RLS policies on deals table:
   ```sql
   -- View current policies
   SELECT * FROM pg_policies WHERE tablename = 'deals';
   
   -- Create read policy if missing
   CREATE POLICY "Public read access" ON deals 
   FOR SELECT USING (status = 'verified');
   ```
3. Ensure table permissions are set correctly
4. Test with service role key temporarily (development only)

---

## Data Loading Issues

### Issue: Dashboard Shows No Data

**Symptoms:**
- Dashboard loads successfully but shows empty state
- API calls return empty arrays
- No error messages displayed

**Debugging Steps:**
1. Check if data exists in database:
   ```sql
   SELECT COUNT(*) FROM deals WHERE status = 'verified';
   ```
2. Verify API response in browser network tab
3. Check data transformation logic:
   ```typescript
   // Add logging to transformation functions
   console.log('Raw data:', rawData);
   console.log('Transformed data:', transformedData);
   ```
4. Verify filtering logic in queries

**Solution:**
1. Add sample data to database if empty
2. Check status field values match filter criteria
3. Update RLS policies if data is being filtered out
4. Add fallback data for empty states

### Issue: Incorrect Data Display

**Symptoms:**
- Numbers don't match database values
- Dates display incorrectly
- Currency formatting issues

**Solution:**
1. Check data transformation functions:
   ```typescript
   // Verify currency formatting
   const formatCurrency = (amount: number) => {
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency: 'USD',
       minimumFractionDigits: 0,
       maximumFractionDigits: 0
     }).format(amount);
   };
   
   // Verify date formatting
   const formatDate = (dateString: string) => {
     return new Date(dateString).toLocaleDateString('en-US', {
       year: 'numeric',
       month: 'short',
       day: 'numeric'
     });
   };
   ```
2. Check for null/undefined values in data
3. Add data validation before transformation
4. Verify database column types match expected formats

---

## Real-time Subscription Problems

### Issue: Real-time Updates Not Working

**Symptoms:**
- New data doesn't appear automatically
- WebSocket connection fails
- No real-time notifications

**Error Messages:**
```
WebSocket connection failed
Subscription error: channel not found
```

**Debugging Steps:**
1. Check WebSocket connection in browser dev tools
2. Verify real-time is enabled in Supabase project
3. Test subscription manually:
   ```typescript
   const subscription = supabase
     .channel('test-channel')
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'deals'
     }, (payload) => {
       console.log('Real-time update:', payload);
     })
     .subscribe((status) => {
       console.log('Subscription status:', status);
     });
   ```

**Solution:**
1. Enable real-time in Supabase dashboard
2. Check table replication settings
3. Verify RLS policies don't block real-time events
4. Add connection retry logic:
   ```typescript
   const connectWithRetry = (retries = 3) => {
     const subscription = supabase.channel('deals-changes')
       .subscribe((status) => {
         if (status === 'CLOSED' && retries > 0) {
           setTimeout(() => connectWithRetry(retries - 1), 1000);
         }
       });
   };
   ```

### Issue: Too Many Real-time Connections

**Symptoms:**
- Performance degradation
- Connection limit errors
- Memory leaks

**Solution:**
1. Implement proper cleanup:
   ```typescript
   useEffect(() => {
     const subscription = supabase.channel('deals-changes')
       .subscribe();
     
     return () => {
       subscription.unsubscribe();
     };
   }, []);
   ```
2. Use connection pooling for multiple subscriptions
3. Implement connection management service
4. Monitor active connections in Supabase dashboard

---

## Performance Issues

### Issue: Slow Dashboard Loading

**Symptoms:**
- Dashboard takes >5 seconds to load
- API calls are slow
- UI feels unresponsive

**Debugging Steps:**
1. Check network tab for slow requests
2. Analyze database query performance:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM deals 
   WHERE status = 'verified' 
   ORDER BY date_announced DESC 
   LIMIT 10;
   ```
3. Monitor Supabase dashboard for query performance

**Solution:**
1. Add database indexes:
   ```sql
   CREATE INDEX CONCURRENTLY idx_deals_status_date 
   ON deals(status, date_announced DESC);
   ```
2. Implement data pagination:
   ```typescript
   const { data, error } = await supabase
     .from('deals')
     .select('*')
     .range(0, 9) // First 10 records
     .order('date_announced', { ascending: false });
   ```
3. Add caching with React Query:
   ```typescript
   const { data } = useQuery({
     queryKey: ['dashboard-data'],
     queryFn: fetchDashboardData,
     staleTime: 5 * 60 * 1000 // 5 minutes
   });
   ```

### Issue: Memory Leaks

**Symptoms:**
- Browser tab uses increasing memory
- Application becomes slow over time
- Real-time subscriptions accumulate

**Solution:**
1. Implement proper cleanup in useEffect
2. Use AbortController for API calls:
   ```typescript
   useEffect(() => {
     const controller = new AbortController();
     
     fetchData({ signal: controller.signal });
     
     return () => controller.abort();
   }, []);
   ```
3. Monitor component re-renders with React DevTools
4. Use useMemo and useCallback appropriately

---

## Build and Deployment Issues

### Issue: Build Failures

**Symptoms:**
- `npm run build` fails
- TypeScript compilation errors
- Missing dependencies

**Error Messages:**
```
Type error: Property 'data' does not exist on type 'never'
Module not found: Can't resolve '@supabase/supabase-js'
```

**Solution:**
1. Check TypeScript configuration:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "skipLibCheck": true
     }
   }
   ```
2. Verify all dependencies are installed:
   ```bash
   npm install
   npm audit fix
   ```
3. Check for type errors:
   ```bash
   npx tsc --noEmit
   ```
4. Update type definitions if needed

### Issue: Environment Variables Not Available in Build

**Symptoms:**
- Build succeeds but runtime errors occur
- Environment variables are undefined in production
- Supabase client fails to initialize

**Solution:**
1. Ensure environment variables are prefixed with `NEXT_PUBLIC_`
2. Check deployment platform environment configuration
3. Verify build-time vs runtime environment variables
4. Add environment validation in build process

---

## Error Handling Issues

### Issue: Unhandled Promise Rejections

**Symptoms:**
- Console warnings about unhandled promises
- Application crashes unexpectedly
- Error boundaries not catching errors

**Solution:**
1. Add proper error handling to async functions:
   ```typescript
   const fetchData = async () => {
     try {
       const result = await apiCall();
       return result;
     } catch (error) {
       console.error('API call failed:', error);
       throw error; // Re-throw to be caught by error boundary
     }
   };
   ```
2. Implement global error handler:
   ```typescript
   window.addEventListener('unhandledrejection', (event) => {
     console.error('Unhandled promise rejection:', event.reason);
     // Log to monitoring service
   });
   ```

### Issue: Error Boundaries Not Working

**Symptoms:**
- Errors crash the entire application
- Error boundaries don't catch async errors
- No fallback UI displayed

**Solution:**
1. Ensure error boundaries are properly implemented:
   ```typescript
   class ErrorBoundary extends Component {
     constructor(props) {
       super(props);
       this.state = { hasError: false };
     }
     
     static getDerivedStateFromError(error) {
       return { hasError: true };
     }
     
     componentDidCatch(error, errorInfo) {
       console.error('Error boundary caught:', error, errorInfo);
     }
   }
   ```
2. Wrap async errors in try-catch and set error state
3. Use error boundaries at appropriate component levels

---

## Testing Issues

### Issue: Tests Failing Due to Supabase Mocks

**Symptoms:**
- Unit tests fail with Supabase errors
- Integration tests can't connect to database
- Mock data doesn't match real API responses

**Solution:**
1. Create proper Supabase mocks:
   ```typescript
   // src/__mocks__/supabase.js
   export const createClient = jest.fn(() => ({
     from: jest.fn(() => ({
       select: jest.fn(() => ({
         eq: jest.fn(() => ({
           data: mockData,
           error: null
         }))
       }))
     }))
   }));
   ```
2. Use test database for integration tests
3. Mock real-time subscriptions:
   ```typescript
   const mockChannel = {
     on: jest.fn().mockReturnThis(),
     subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() })
   };
   ```

### Issue: E2E Tests Flaky

**Symptoms:**
- Tests pass locally but fail in CI
- Timing issues with data loading
- Real-time updates cause test instability

**Solution:**
1. Add proper wait conditions:
   ```typescript
   await page.waitForSelector('[data-testid="dashboard-loaded"]');
   ```
2. Use test-specific data and cleanup
3. Mock real-time subscriptions in E2E tests
4. Add retry logic for flaky tests

---

## Quick Diagnostic Commands

### Check Environment Setup
```bash
# Validate environment variables
./scripts/setup-env.sh validate

# Test Supabase connection
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/deals?select=count"
```

### Debug Database Issues
```sql
-- Check table structure
\d deals

-- Check data count
SELECT COUNT(*) FROM deals;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'deals';

-- Check recent data
SELECT * FROM deals ORDER BY created_at DESC LIMIT 5;
```

### Monitor Performance
```bash
# Check build size
npm run build
du -sh .next

# Run performance tests
npm run test:performance

# Check for memory leaks
npm run dev
# Open Chrome DevTools > Memory tab
```

### Debug Real-time Issues
```javascript
// In browser console
const testSubscription = supabase
  .channel('debug-channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'deals'
  }, console.log)
  .subscribe(console.log);
```

---

## Getting Help

If you're still experiencing issues after trying these solutions:

1. **Check the logs**: Look at browser console, server logs, and Supabase logs
2. **Reproduce the issue**: Create a minimal reproduction case
3. **Check documentation**: Review Supabase docs and Next.js documentation
4. **Search existing issues**: Look for similar problems in project issues
5. **Create detailed bug report**: Include error messages, steps to reproduce, and environment details

## Useful Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Project API Documentation](./API_INTEGRATION.md)
- [Deployment Guide](./DEPLOYMENT.md)