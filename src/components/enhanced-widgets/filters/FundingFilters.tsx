'use client';

import React from 'react';
import { FundingFilters as FundingFiltersType } from '../../../types/enhanced-widgets';

interface FundingFiltersProps {
  filters: FundingFiltersType;
  onChange: (filters: FundingFiltersType) => void;
  className?: string;
}

const FundingFilters: React.FC<FundingFiltersProps> = ({
  filters,
  onChange,
  className = '',
}) => {
  return (
    <div className={`funding-filters ${className}`}>
      {/* Placeholder content - will be implemented in future tasks */}
      <div className="text-center py-4 text-gray-500 text-sm">
        Funding Filters Component
        <br />
        <small>To be implemented in task 3</small>
      </div>
    </div>
  );
};

export default FundingFilters;