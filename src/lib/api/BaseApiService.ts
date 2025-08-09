import { supabase } from "../supabase";
import { measureQuery, performanceMonitor } from "../utils/performance";
import {
  errorLogger,
  logApiError,
  logDatabaseError,
} from "../monitoring/errorLogger";
import {
  performanceMonitor as newPerformanceMonitor,
  trackApiCall,
  trackDatabaseQuery,
} from "../monitoring/performanceMonitor";
import {
  ApiResponse,
  ApiException,
  ApiErrorType,
} from "../../types/api";

/**
 * Base API service class with common functionality
 */
export abstract class BaseApiService {
  protected static async executeWithTracking<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<ApiResponse<T>> {
    try {
      console.log(`${operationName}: Starting...`);
      const result = await operation();
      console.log(`${operationName}: Completed successfully`);
      return {
        data: result,
        error: null,
        loading: false
      };
    } catch (error) {
      console.error(`${operationName}: Error occurred:`, error);
      
      // Log the error
      const apiError = this.createApiException(error, operationName);
      await logApiError(apiError.message, apiError.type);
      
      return {
        data: null,
        error: apiError.message,
        loading: false
      };
    }
  }

  protected static async executeQuery<T>(
    queryName: string,
    queryFn: () => Promise<{ data: T | null; error: any }>
  ): Promise<T> {
    const result = await measureQuery(queryName, queryFn);
    
    if (result.error) {
      console.error(`${queryName}: Database error:`, result.error);
      await logDatabaseError(result.error, queryName);
      throw new ApiException(
        ApiErrorType.DATABASE_ERROR,
        `Database query failed: ${result.error.message}`,
        true
      );
    }

    if (!result.data) {
      throw new ApiException(
        ApiErrorType.NOT_FOUND_ERROR,
        `No data returned from ${queryName}`,
        false
      );
    }

    return result.data;
  }

  protected static createApiException(error: any, context: string): ApiException {
    if (error instanceof ApiException) {
      return error;
    }

    let errorType: ApiErrorType = ApiErrorType.DATABASE_ERROR;
    let message = `${context} failed`;

    if (error?.code === 'PGRST116') {
      errorType = ApiErrorType.NOT_FOUND_ERROR;
      message = 'No data found matching the criteria';
    } else if (error?.code?.startsWith('23')) {
      errorType = ApiErrorType.VALIDATION_ERROR;
      message = 'Database constraint violation';
    } else if (error?.code?.startsWith('08')) {
      errorType = ApiErrorType.NETWORK_ERROR;
      message = 'Database connection error';
    } else if (error?.message) {
      message = error.message;
      errorType = ApiErrorType.DATABASE_ERROR;
    }

    return new ApiException(errorType, message, true);
  }

  protected static generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected static getSupabaseClient() {
    return supabase;
  }
}
