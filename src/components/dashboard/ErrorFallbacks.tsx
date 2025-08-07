"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorDisplay, InlineError } from "@/components/ui/error-display";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppError } from '@/lib/errors/types';
import { 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  TrendingUp,
  Globe,
  Briefcase,
  PieChart,
  BarChart3,
  Newspaper,
  Building
} from "lucide-react";

interface SectionErrorFallbackProps {
  error: AppError;
  retry: () => void;
  sectionName: string;
  icon?: React.ReactNode;
  compact?: boolean;
}

export function SectionErrorFallback({ 
  error, 
  retry, 
  sectionName, 
  icon, 
  compact = false 
}: SectionErrorFallbackProps) {
  if (compact) {
    return (
      <InlineError
        message={`Failed to load ${sectionName.toLowerCase()}`}
        onRetry={error.retryable ? retry : undefined}
        className="m-2"
      />
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">
              {sectionName} - Error
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load {sectionName}</h3>
          <p className="text-gray-600 text-center mb-4 max-w-sm">
            {error.userMessage}
          </p>
          {error.retryable && (
            <Button 
              onClick={retry}
              className="bg-brand-yellow hover:bg-brand-yellow/90"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Specific error fallbacks for different dashboard sections

export function MetricsErrorFallback({ error, retry }: { error: AppError; retry: () => void }) {
  return (
    <SectionErrorFallback
      error={error}
      retry={retry}
      sectionName="Metrics"
      icon={<TrendingUp className="w-4 h-4 text-brand-charcoal/60" />}
    />
  );
}

export function ChartErrorFallback({ error, retry }: { error: AppError; retry: () => void }) {
  return (
    <SectionErrorFallback
      error={error}
      retry={retry}
      sectionName="Charts"
      icon={<BarChart3 className="w-4 h-4 text-brand-charcoal/60" />}
    />
  );
}

export function RecentDealsErrorFallback({ error, retry }: { error: AppError; retry: () => void }) {
  return (
    <SectionErrorFallback
      error={error}
      retry={retry}
      sectionName="Recent Deals"
      icon={<Briefcase className="w-4 h-4 text-brand-charcoal/60" />}
    />
  );
}

export function WorldMapErrorFallback({ error, retry }: { error: AppError; retry: () => void }) {
  return (
    <SectionErrorFallback
      error={error}
      retry={retry}
      sectionName="Regional Data"
      icon={<Globe className="w-4 h-4 text-brand-charcoal/60" />}
    />
  );
}

export function CompanySignalsErrorFallback({ error, retry }: { error: AppError; retry: () => void }) {
  return (
    <SectionErrorFallback
      error={error}
      retry={retry}
      sectionName="Company Signals"
      icon={<Building className="w-4 h-4 text-brand-charcoal/60" />}
    />
  );
}

export function NewsErrorFallback({ error, retry }: { error: AppError; retry: () => void }) {
  return (
    <SectionErrorFallback
      error={error}
      retry={retry}
      sectionName="News"
      icon={<Newspaper className="w-4 h-4 text-brand-charcoal/60" />}
    />
  );
}

export function FundReturnsErrorFallback({ error, retry }: { error: AppError; retry: () => void }) {
  return (
    <SectionErrorFallback
      error={error}
      retry={retry}
      sectionName="Fund Returns"
      icon={<PieChart className="w-4 h-4 text-brand-charcoal/60" />}
    />
  );
}

// Compact error fallbacks for inline use
export function CompactMetricsError({ error, retry }: { error: AppError; retry: () => void }) {
  return (
    <SectionErrorFallback
      error={error}
      retry={retry}
      sectionName="Metrics"
      compact
    />
  );
}

export function CompactDealsError({ error, retry }: { error: AppError; retry: () => void }) {
  return (
    <SectionErrorFallback
      error={error}
      retry={retry}
      sectionName="Deals Data"
      compact
    />
  );
}

// Section-level error display with retry count
interface SectionErrorDisplayProps {
  error: AppError;
  retry: () => void;
  retryCount?: number;
  maxRetries?: number;
  sectionName: string;
  className?: string;
}

export function SectionErrorDisplay({
  error,
  retry,
  retryCount = 0,
  maxRetries = 3,
  sectionName,
  className = ""
}: SectionErrorDisplayProps) {
  const canRetry = error.retryable && retryCount < maxRetries;

  return (
    <div className={`p-4 ${className}`}>
      <ErrorDisplay
        error={error}
        onRetry={canRetry ? retry : undefined}
        showTechnicalDetails={process.env.NODE_ENV === 'development'}
        compact
      />
      {retryCount > 0 && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          {sectionName} retry attempt {retryCount} of {maxRetries}
        </p>
      )}
    </div>
  );
}

// Global dashboard error fallback
interface DashboardErrorFallbackProps {
  error: AppError;
  retry: () => void;
  resetKeys?: Array<string | number>;
}

export function DashboardErrorFallback({ error, retry }: DashboardErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-brand-blue/20 flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-6">
        <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              <Database className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Dashboard Temporarily Unavailable
              </h1>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We're experiencing technical difficulties loading the dashboard. 
                This is likely a temporary issue with our data services.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <ErrorDisplay
                  error={error}
                  onRetry={error.retryable ? retry : undefined}
                  showTechnicalDetails={process.env.NODE_ENV === 'development'}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {error.retryable && (
                  <Button 
                    onClick={retry}
                    className="bg-brand-yellow hover:bg-brand-yellow/90"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Dashboard
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Error boundary wrapper with specific section handling
interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  sectionName: string;
  fallback?: (error: AppError, retry: () => void) => React.ReactNode;
  onError?: (error: AppError, section: string) => void;
  resetKeys?: Array<string | number>;
}

export function SectionErrorBoundary({
  children,
  sectionName,
  fallback,
  onError,
  resetKeys
}: SectionErrorBoundaryProps) {
  const handleError = React.useCallback((error: AppError) => {
    console.error(`Error in ${sectionName} section:`, error);
    onError?.(error, sectionName);
  }, [sectionName, onError]);

  const defaultFallback = React.useCallback((error: AppError, retry: () => void) => {
    if (fallback) {
      return fallback(error, retry);
    }
    return (
      <SectionErrorFallback
        error={error}
        retry={retry}
        sectionName={sectionName}
      />
    );
  }, [fallback, sectionName]);

  return (
    <ErrorBoundary
      fallback={defaultFallback}
      onError={handleError}
      resetKeys={resetKeys}
      maxRetries={3}
    >
      {children}
    </ErrorBoundary>
  );
}
