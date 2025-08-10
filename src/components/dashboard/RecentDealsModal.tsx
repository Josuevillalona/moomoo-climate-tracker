import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Search, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FundingDeal } from "@/types/api";
import { AnimatedDealItem } from "./NewDealHighlight";

interface RecentDealsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deals: FundingDeal[];
  title: string;
  newDealIds: Set<number>;
}

const DEALS_PER_PAGE = 20;

export default function RecentDealsModal({ 
  isOpen, 
  onClose, 
  deals, 
  title, 
  newDealIds 
}: RecentDealsModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'company'>('date');
  const [filterStage, setFilterStage] = useState<string>('all');

  // Reset page when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setSearchTerm('');
    }
  }, [isOpen]);

  // Filter and sort deals
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = 
      deal.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.fundingStage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.climateSector.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = filterStage === 'all' || deal.fundingStage === filterStage;
    
    return matchesSearch && matchesStage;
  });

  const sortedDeals = [...filteredDeals].sort((a, b) => {
    switch (sortBy) {
      case 'amount':
        return b.amountRaised - a.amountRaised;
      case 'company':
        return a.companyName.localeCompare(b.companyName);
      case 'date':
      default:
        return new Date(b.dateAnnounced).getTime() - new Date(a.dateAnnounced).getTime();
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedDeals.length / DEALS_PER_PAGE);
  const startIndex = (currentPage - 1) * DEALS_PER_PAGE;
  const paginatedDeals = sortedDeals.slice(startIndex, startIndex + DEALS_PER_PAGE);

  // Get unique funding stages for filter
  const fundingStages = Array.from(new Set(deals.map(deal => deal.fundingStage))).filter(Boolean);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-300">
      <div className="fixed inset-4 bg-white rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6 text-brand-green" />
            <h2 className="text-2xl font-bold text-brand-charcoal">{title}</h2>
            <span className="px-2 py-1 bg-brand-yellow/20 text-brand-charcoal rounded-full text-sm font-medium">
              {sortedDeals.length} deals
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search companies, stages, or sectors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="company">Sort by Company</option>
            </select>

            {/* Stage Filter */}
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              <option value="all">All Stages</option>
              {fundingStages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Deals List */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 uppercase tracking-wide border-b pb-2">
              <div className="col-span-4">Company</div>
              <div className="col-span-2">Stage</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Sector</div>
              <div className="col-span-2">Date</div>
            </div>

            {/* Deals */}
            {paginatedDeals.length > 0 ? (
              paginatedDeals.map((deal, index) => {
                const isNewDeal = newDealIds.has(deal.id);
                return (
                  <AnimatedDealItem
                    key={deal.id}
                    deal={deal}
                    isNew={isNewDeal}
                    index={index}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-transparent hover:border-gray-200">
                      <div className="col-span-4">
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold ${isNewDeal ? 'text-green-700' : 'text-brand-charcoal'}`}>
                            {deal.companyName}
                          </span>
                          {isNewDeal && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">NEW</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{deal.country}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="px-2 py-1 border border-gray-300 rounded text-xs bg-white">
                          {deal.fundingStage}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold text-brand-charcoal">
                          {deal.formattedAmount}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600">{deal.climateSector}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-gray-500">{deal.formattedDate}</span>
                        <div className="text-xs text-gray-400">{deal.daysAgo} days ago</div>
                      </div>
                    </div>
                  </AnimatedDealItem>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">No deals found</div>
                <div className="text-gray-500 text-sm">
                  {searchTerm || filterStage !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'No recent funding rounds available'
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(startIndex + DEALS_PER_PAGE, sortedDeals.length)} of {sortedDeals.length} deals
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-gray-400">...</span>
                    <Button
                      variant={totalPages === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
