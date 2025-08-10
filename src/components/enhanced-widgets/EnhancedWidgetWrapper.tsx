'use client';

import React from 'react';
import { Card } from '../ui/card';
import { EnhancedWidgetProps } from '../../types/enhanced-widgets';
import WidgetErrorBoundary from './common/WidgetErrorBoundary';
import WidgetLoadingState from './common/WidgetLoadingState';
import WidgetHeader from './common/WidgetHeader';

interface EnhancedWidgetWrapperProps extends EnhancedWidgetProps {
  subtitle?: string;
  onRefresh?: () => void;
  onSettings?: () => void;
  lastUpdated?: Date;
  actions?: React.ReactNode;
  type?: 'funding' | 'news' | 'reports' | 'generic';
}

const EnhancedWidgetWrapper: React.FC<EnhancedWidgetWrapperProps> = ({
  title,
  subtitle,
  size = 'normal',
  loading = false,
  error = null,
  onRetry,
  onRefresh,
  onSettings,
  lastUpdated,
  actions,
  type = 'generic',
  className = '',
  children,
}) => {
  const isExpanded = size === 'expanded';
  
  const cardClassName = `
    bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-progressive-load
    ${className}
  `.trim();

  if (loading) {
    return (
      <WidgetLoadingState
        title={title}
        size={size}
        type={type}
      />
    );
  }

  return (
    <WidgetErrorBoundary
      widgetName={title}
      onRetry={onRetry}
    >
      <Card className={cardClassName}>
        <div className="p-6">
          <WidgetHeader
            title={title}
            subtitle={subtitle}
            actions={actions}
            onRefresh={onRefresh}
            onSettings={onSettings}
            loading={loading}
            lastUpdated={lastUpdated}
          />
          
          {error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">
                <svg
                  className="mx-auto h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">
                {error.message || 'An error occurred while loading this widget.'}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          ) : (
            <div className="widget-content">
              {children}
            </div>
          )}
        </div>
      </Card>
    </WidgetErrorBoundary>
  );
};

export default EnhancedWidgetWrapper;