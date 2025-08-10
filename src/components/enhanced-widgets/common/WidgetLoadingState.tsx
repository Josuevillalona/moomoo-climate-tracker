'use client';

import React from 'react';
import { Card } from '../../ui/card';
import { Skeleton } from '../../ui/skeleton';

interface WidgetLoadingStateProps {
  title?: string;
  size?: 'normal' | 'expanded';
  type?: 'funding' | 'news' | 'reports' | 'generic';
}

const WidgetLoadingState: React.FC<WidgetLoadingStateProps> = ({
  title,
  size = 'normal',
  type = 'generic',
}) => {
  const isExpanded = size === 'expanded';
  
  const renderFundingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: isExpanded ? 8 : 4 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );

  const renderNewsSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: isExpanded ? 6 : 3 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <div className="flex space-x-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderReportsSkeleton = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );

  const renderGenericSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  const renderSkeletonContent = () => {
    switch (type) {
      case 'funding':
        return renderFundingSkeleton();
      case 'news':
        return renderNewsSkeleton();
      case 'reports':
        return renderReportsSkeleton();
      default:
        return renderGenericSkeleton();
    }
  };

  return (
    <Card className={`p-6 ${isExpanded ? 'col-span-2' : ''}`}>
      <div className="animate-pulse">
        {title && (
          <div className="mb-4">
            <Skeleton className="h-6 w-1/3" />
          </div>
        )}
        {renderSkeletonContent()}
      </div>
    </Card>
  );
};

export default WidgetLoadingState;