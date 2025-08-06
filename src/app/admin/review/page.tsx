"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

interface Deal {
  id: number;
  company_name: string;
  funding_amount_str: string;
  amount_raised: number;
  currency: string;
  funding_stage: string;
  date_announced: string;
  lead_investors: string;
  other_investors: string;
  climate_sub_sector: string;
  geography_country: string;
  source_url: string;
  status: string;
}

interface EditableDealsState {
  [key: number]: Deal;
}

export default function AdminReviewPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [editableDeals, setEditableDeals] = useState<EditableDealsState>({});
  const [loading, setLoading] = useState(true);
  const [publishingIds, setPublishingIds] = useState<Set<number>>(new Set());
  const [publishedIds, setPublishedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/deals/review');
      const data = await response.json();
      
      if (data.success) {
        setDeals(data.deals);
        // Initialize editable state
        const editableState: EditableDealsState = {};
        data.deals.forEach((deal: Deal) => {
          editableState[deal.id] = { ...deal };
        });
        setEditableDeals(editableState);
      } else {
        setError('Failed to fetch deals');
      }
    } catch (err) {
      setError('Failed to fetch deals');
      console.error('Error fetching deals:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateDealField = (dealId: number, field: keyof Deal, value: string) => {
    setEditableDeals(prev => ({
      ...prev,
      [dealId]: {
        ...prev[dealId],
        [field]: value
      }
    }));
  };

  const publishDeal = async (dealId: number) => {
    try {
      setPublishingIds(prev => new Set(prev).add(dealId));
      
      const dealData = editableDeals[dealId];
      const response = await fetch(`/api/deals/publish/${dealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealData),
      });

      const result = await response.json();
      
      if (result.success) {
        setPublishedIds(prev => new Set(prev).add(dealId));
        // Remove from editable deals after successful publish
        setTimeout(() => {
          setEditableDeals(prev => {
            const newState = { ...prev };
            delete newState[dealId];
            return newState;
          });
          setDeals(prev => prev.filter(deal => deal.id !== dealId));
        }, 2000);
      } else {
        setError(`Failed to publish deal ${dealId}`);
      }
    } catch (err) {
      setError(`Failed to publish deal ${dealId}`);
      console.error('Error publishing deal:', err);
    } finally {
      setPublishingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(dealId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#2E5E4E]" />
          <span className="text-[#2D2D2D] font-medium">Loading deals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F3F3] p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="rounded-2xl shadow-sm bg-white border border-gray-100">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-2xl font-semibold text-[#2D2D2D] flex items-center">
              <AlertCircle className="w-6 h-6 mr-2 text-[#2E5E4E]" />
              Deal Review & Approval
            </CardTitle>
            <p className="text-[#2D2D2D]/70 mt-2">
              Review AI-processed deals and approve them for publication. Edit any fields that need correction.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <div className="p-6 bg-red-50 border-b border-red-100">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            
            {deals.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-[#2E5E4E] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#2D2D2D] mb-2">All caught up!</h3>
                <p className="text-[#2D2D2D]/70">No deals pending review at the moment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F3F3F3]">
                      <TableHead className="font-semibold text-[#2D2D2D]">Company</TableHead>
                      <TableHead className="font-semibold text-[#2D2D2D]">Funding Amount</TableHead>
                      <TableHead className="font-semibold text-[#2D2D2D]">Stage</TableHead>
                      <TableHead className="font-semibold text-[#2D2D2D]">Date</TableHead>
                      <TableHead className="font-semibold text-[#2D2D2D]">Lead Investors</TableHead>
                      <TableHead className="font-semibold text-[#2D2D2D]">Other Investors</TableHead>
                      <TableHead className="font-semibold text-[#2D2D2D]">Sector</TableHead>
                      <TableHead className="font-semibold text-[#2D2D2D]">Country</TableHead>
                      <TableHead className="font-semibold text-[#2D2D2D]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((deal) => {
                      const editableDeal = editableDeals[deal.id];
                      const isPublishing = publishingIds.has(deal.id);
                      const isPublished = publishedIds.has(deal.id);
                      
                      if (!editableDeal) return null;
                      
                      return (
                        <TableRow 
                          key={deal.id} 
                          className={`${isPublished ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                        >
                          <TableCell>
                            <Input
                              value={editableDeal.company_name}
                              onChange={(e) => updateDealField(deal.id, 'company_name', e.target.value)}
                              className="min-w-[150px]"
                              disabled={isPublished}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editableDeal.funding_amount_str}
                              onChange={(e) => updateDealField(deal.id, 'funding_amount_str', e.target.value)}
                              className="min-w-[120px]"
                              disabled={isPublished}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editableDeal.funding_stage}
                              onChange={(e) => updateDealField(deal.id, 'funding_stage', e.target.value)}
                              className="min-w-[100px]"
                              disabled={isPublished}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={editableDeal.date_announced}
                              onChange={(e) => updateDealField(deal.id, 'date_announced', e.target.value)}
                              className="min-w-[130px]"
                              disabled={isPublished}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editableDeal.lead_investors}
                              onChange={(e) => updateDealField(deal.id, 'lead_investors', e.target.value)}
                              className="min-w-[200px]"
                              disabled={isPublished}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editableDeal.other_investors}
                              onChange={(e) => updateDealField(deal.id, 'other_investors', e.target.value)}
                              className="min-w-[200px]"
                              disabled={isPublished}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editableDeal.climate_sub_sector}
                              onChange={(e) => updateDealField(deal.id, 'climate_sub_sector', e.target.value)}
                              className="min-w-[120px]"
                              disabled={isPublished}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editableDeal.geography_country}
                              onChange={(e) => updateDealField(deal.id, 'geography_country', e.target.value)}
                              className="min-w-[100px]"
                              disabled={isPublished}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => publishDeal(deal.id)}
                              disabled={isPublishing || isPublished}
                              className={`rounded-full px-4 py-2 font-medium min-w-[100px] ${
                                isPublished
                                  ? 'bg-green-500 hover:bg-green-500 text-white'
                                  : 'bg-[#F7D774] hover:bg-[#F7D774]/90 text-[#2D2D2D]'
                              }`}
                            >
                              {isPublishing ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Publishing...
                                </>
                              ) : isPublished ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Published
                                </>
                              ) : (
                                'Approve'
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
