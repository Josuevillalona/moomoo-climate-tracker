import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Health Check API Endpoint
 * 
 * This endpoint provides system health information including:
 * - Application status
 * - Database connectivity
 * - Environment information
 * - Performance metrics
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    api: {
      status: 'up' | 'down';
      responseTime?: number;
    };
  };
  uptime: number;
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
}

async function checkDatabase(): Promise<{ status: 'up' | 'down'; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('count')
      .limit(1)
      .single();

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'down',
        responseTime,
        error: error.message
      };
    }

    return {
      status: 'up',
      responseTime
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      used: Math.round(usage.heapUsed / 1024 / 1024), // MB
      total: Math.round(usage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100)
    };
  }
  return undefined;
}

function getUptime(): number {
  if (typeof process !== 'undefined' && process.uptime) {
    return Math.round(process.uptime());
  }
  return 0;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Perform health checks
    const databaseCheck = await checkDatabase();
    const apiResponseTime = Date.now() - startTime;

    // Determine overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    if (databaseCheck.status === 'down') {
      overallStatus = 'unhealthy';
    } else if (databaseCheck.responseTime && databaseCheck.responseTime > 5000) {
      overallStatus = 'degraded';
    }

    const healthResponse: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: databaseCheck,
        api: {
          status: 'up',
          responseTime: apiResponseTime
        }
      },
      uptime: getUptime(),
      memory: getMemoryUsage()
    };

    // Return appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthResponse, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    // Handle unexpected errors
    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: 'down',
          error: 'Health check failed'
        },
        api: {
          status: 'down',
          responseTime: Date.now() - startTime
        }
      },
      uptime: getUptime(),
      memory: getMemoryUsage()
    };

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

// Support HEAD requests for simple health checks
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    const databaseCheck = await checkDatabase();
    const statusCode = databaseCheck.status === 'up' ? 200 : 503;
    
    return new NextResponse(null, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}