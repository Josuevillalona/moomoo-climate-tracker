/**
 * Query optimization utilities for analyzing and improving database performance
 */

import { supabase } from '../supabase';
import { performanceMonitor } from './performance';

export interface QueryAnalysis {
  queryName: string;
  executionTime: number;
  rowsReturned: number;
  indexesUsed: string[];
  suggestions: string[];
  efficiency: 'excellent' | 'good' | 'poor' | 'critical';
}

export interface IndexUsageStats {
  indexName: string;
  tableName: string;
  scans: number;
  tuplesRead: number;
  tuplesReturned: number;
  efficiency: number;
}

class QueryOptimizer {
  private queryCache = new Map<string, QueryAnalysis>();
  private indexStats = new Map<string, IndexUsageStats>();

  /**
   * Analyze query performance and provide optimization suggestions
   */
  async analyzeQuery(
    queryName: string,
    queryFn: () => Promise<any>,
    expectedRows?: number
  ): Promise<QueryAnalysis> {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const executionTime = performance.now() - startTime;
      const rowsReturned = Array.isArray(result?.data) ? result.data.length : 1;
      
      const analysis: QueryAnalysis = {
        queryName,
        executionTime,
        rowsReturned,
        indexesUsed: [], // Would need EXPLAIN ANALYZE for real index info
        suggestions: this.generateSuggestions(executionTime, rowsReturned, expectedRows),
        efficiency: this.calculateEfficiency(executionTime, rowsReturned)
      };

      this.queryCache.set(queryName, analysis);
      return analysis;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate optimization suggestions based on query performance
   */
  private generateSuggestions(
    executionTime: number,
    rowsReturned: number,
    expectedRows?: number
  ): string[] {
    const suggestions: string[] = [];

    // Execution time suggestions
    if (executionTime > 5000) {
      suggestions.push('Query is very slow (>5s). Consider adding indexes or reducing data scope.');
    } else if (executionTime > 2000) {
      suggestions.push('Query is slow (>2s). Review indexes and query structure.');
    } else if (executionTime > 1000) {
      suggestions.push('Query could be faster. Consider query optimization.');
    }

    // Data volume suggestions
    if (rowsReturned > 1000) {
      suggestions.push('Large result set. Consider pagination or filtering.');
    }

    // Expected vs actual rows
    if (expectedRows && rowsReturned > expectedRows * 2) {
      suggestions.push('Returning more rows than expected. Review query filters.');
    }

    // Performance ratio suggestions
    const timePerRow = rowsReturned > 0 ? executionTime / rowsReturned : executionTime;
    if (timePerRow > 10) {
      suggestions.push('High time per row. Query may be inefficient or missing indexes.');
    }

    return suggestions;
  }

  /**
   * Calculate query efficiency rating
   */
  private calculateEfficiency(
    executionTime: number,
    rowsReturned: number
  ): 'excellent' | 'good' | 'poor' | 'critical' {
    const timePerRow = rowsReturned > 0 ? executionTime / rowsReturned : executionTime;

    if (executionTime < 500 && timePerRow < 5) {
      return 'excellent';
    } else if (executionTime < 1000 && timePerRow < 10) {
      return 'good';
    } else if (executionTime < 3000 && timePerRow < 20) {
      return 'poor';
    } else {
      return 'critical';
    }
  }

  /**
   * Get index usage statistics (requires database admin access)
   */
  async getIndexUsageStats(): Promise<IndexUsageStats[]> {
    try {
      const { data, error } = await supabase.rpc('get_index_usage_stats');
      
      if (error) {
        console.warn('Could not fetch index usage stats:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Index usage stats not available:', error);
      return [];
    }
  }

  /**
   * Suggest optimal pagination strategy based on data size
   */
  suggestPaginationStrategy(totalRows: number, currentPageSize: number): {
    strategy: 'offset' | 'cursor' | 'hybrid';
    recommendedPageSize: number;
    reasoning: string;
  } {
    if (totalRows < 1000) {
      return {
        strategy: 'offset',
        recommendedPageSize: Math.min(currentPageSize, 50),
        reasoning: 'Small dataset - offset pagination is efficient'
      };
    } else if (totalRows < 10000) {
      return {
        strategy: 'hybrid',
        recommendedPageSize: Math.min(currentPageSize, 25),
        reasoning: 'Medium dataset - use offset for early pages, cursor for deep pagination'
      };
    } else {
      return {
        strategy: 'cursor',
        recommendedPageSize: Math.min(currentPageSize, 20),
        reasoning: 'Large dataset - cursor pagination prevents performance degradation'
      };
    }
  }

  /**
   * Analyze filter selectivity to optimize query order
   */
  analyzeFilterSelectivity(filters: Record<string, any>): {
    filter: string;
    estimatedSelectivity: number;
    priority: number;
  }[] {
    const filterAnalysis = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        let estimatedSelectivity = 1.0;
        let priority = 0;

        switch (key) {
          case 'dateRange':
            // Date ranges are usually highly selective
            estimatedSelectivity = 0.1;
            priority = 1;
            break;
          case 'status':
            // Status filters are moderately selective
            estimatedSelectivity = Array.isArray(value) ? value.length * 0.2 : 0.3;
            priority = 2;
            break;
          case 'amountRange':
            // Amount ranges can be very selective
            estimatedSelectivity = 0.15;
            priority = 3;
            break;
          case 'fundingStage':
            // Funding stage has limited values
            estimatedSelectivity = Array.isArray(value) ? value.length * 0.15 : 0.2;
            priority = 4;
            break;
          case 'climateSector':
            // Climate sector has many values
            estimatedSelectivity = Array.isArray(value) ? value.length * 0.1 : 0.15;
            priority = 5;
            break;
          case 'country':
            // Country has many values
            estimatedSelectivity = Array.isArray(value) ? value.length * 0.05 : 0.1;
            priority = 6;
            break;
          default:
            estimatedSelectivity = 0.5;
            priority = 10;
        }

        return {
          filter: key,
          estimatedSelectivity,
          priority
        };
      });

    // Sort by priority (most selective first)
    return filterAnalysis.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get query performance summary
   */
  getPerformanceSummary(): {
    totalQueries: number;
    averageExecutionTime: number;
    slowQueries: QueryAnalysis[];
    efficiencyDistribution: Record<string, number>;
  } {
    const analyses = Array.from(this.queryCache.values());
    
    const slowQueries = analyses
      .filter(a => a.executionTime > 1000)
      .sort((a, b) => b.executionTime - a.executionTime);

    const efficiencyDistribution = analyses.reduce((acc, analysis) => {
      acc[analysis.efficiency] = (acc[analysis.efficiency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageExecutionTime = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.executionTime, 0) / analyses.length
      : 0;

    return {
      totalQueries: analyses.length,
      averageExecutionTime,
      slowQueries: slowQueries.slice(0, 10), // Top 10 slowest
      efficiencyDistribution
    };
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.queryCache.clear();
    this.indexStats.clear();
  }

  /**
   * Get cached analysis for a query
   */
  getCachedAnalysis(queryName: string): QueryAnalysis | undefined {
    return this.queryCache.get(queryName);
  }
}

// Global query optimizer instance
export const queryOptimizer = new QueryOptimizer();

/**
 * Decorator for automatic query analysis
 */
export function analyzeQuery(queryName: string, expectedRows?: number) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;
    
    descriptor.value = (async function (this: any, ...args: any[]) {
      return queryOptimizer.analyzeQuery(
        `${target.constructor.name}.${queryName}`,
        () => method.apply(this, args),
        expectedRows
      );
    }) as T;
  };
}

/**
 * Utility function to measure and analyze query performance
 */
export async function measureAndAnalyzeQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  expectedRows?: number
): Promise<T> {
  const analysis = await queryOptimizer.analyzeQuery(queryName, queryFn, expectedRows);
  
  // Log suggestions if any
  if (analysis.suggestions.length > 0) {
    console.warn(`Query optimization suggestions for ${queryName}:`, analysis.suggestions);
  }
  
  return queryFn();
}

export default queryOptimizer;