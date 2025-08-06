"use client";

import { useState, useEffect } from 'react';
import DashboardSkeleton from '../DashboardSkeleton';
import Dashboard from '@/app/dashboard/page';

/**
 * Example component demonstrating the DashboardSkeleton usage
 * This shows how to transition from loading state to actual content
 */
export default function DashboardSkeletonExample() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleToggleLoading = () => {
    setIsLoading(!isLoading);
  };

  return (
    <div className="min-h-screen">
      {/* Toggle button for demo purposes */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleToggleLoading}
          className="px-4 py-2 bg-brand-yellow text-brand-charcoal rounded-lg shadow-lg hover:bg-brand-yellow/90 transition-colors"
        >
          {isLoading ? 'Show Content' : 'Show Loading'}
        </button>
      </div>

      {/* Conditional rendering with smooth transition */}
      <div className="transition-opacity duration-500 ease-in-out">
        {isLoading ? <DashboardSkeleton /> : <Dashboard />}
      </div>
    </div>
  );
}