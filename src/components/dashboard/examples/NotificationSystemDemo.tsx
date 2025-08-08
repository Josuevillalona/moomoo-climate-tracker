import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewDealsNotification, CompactNewDealsIndicator, NewDealsBadge } from '../NewDealsNotification';
import { NewDealHighlight, AnimatedDealItem } from '../NewDealHighlight';
import { useNotifications, NotificationContainer } from '@/components/ui/notification';
import { FundingDeal } from '@/types/api';

const mockDeals: FundingDeal[] = [
  {
    id: 1,
    companyName: 'SolarTech Inc',
    fundingStage: 'Series A',
    amountRaised: 5000000,
    dateAnnounced: '2024-01-15',
    leadInvestors: ['Green VC'],
    otherInvestors: ['Climate Fund'],
    climateSector: 'Solar Energy',
    country: 'USA',
    status: 'verified',
    createdAt: '2024-01-15T10:00:00Z',
    formattedAmount: '$5.0M',
    formattedDate: '2w',
    daysAgo: 14,
    allInvestors: ['Green VC', 'Climate Fund'],
  },
  {
    id: 2,
    companyName: 'WindPower Co',
    fundingStage: 'Series B',
    amountRaised: 12000000,
    dateAnnounced: '2024-01-10',
    leadInvestors: ['Energy Ventures'],
    otherInvestors: ['Renewable Capital'],
    climateSector: 'Wind Energy',
    country: 'Germany',
    status: 'verified',
    createdAt: '2024-01-10T14:30:00Z',
    formattedAmount: '$12.0M',
    formattedDate: '3w',
    daysAgo: 21,
    allInvestors: ['Energy Ventures', 'Renewable Capital'],
  },
];

export function NotificationSystemDemo() {
  const [showMainNotification, setShowMainNotification] = useState(false);
  const [newDealsCount, setNewDealsCount] = useState(0);
  const [newDealIds, setNewDealIds] = useState<Set<number>>(new Set());
  const { notifications, addNotification } = useNotifications();

  const simulateNewDeals = () => {
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 new deals
    setNewDealsCount(count);
    setShowMainNotification(true);
    
    // Add some mock new deal IDs
    const newIds = new Set<number>();
    for (let i = 0; i < count; i++) {
      newIds.add(Date.now() + i);
    }
    setNewDealIds(newIds);

    // Add system notification
    addNotification({
      type: 'success',
      title: 'New Funding Data',
      message: `${count} new deal${count > 1 ? 's' : ''} added to the dashboard`,
      duration: 4000,
    });

    // Auto-clear after 10 seconds
    setTimeout(() => {
      setShowMainNotification(false);
      setNewDealsCount(0);
      setNewDealIds(new Set());
    }, 10000);
  };

  const addSystemNotification = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: 'Operation completed successfully!',
      error: 'Something went wrong. Please try again.',
      warning: 'Please check your network connection.',
      info: 'New features are available in the dashboard.',
    };

    addNotification({
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message: messages[type],
      duration: 5000,
    });
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <Card>
        <CardHeader>
          <CardTitle>Notification System Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={simulateNewDeals}>
              Simulate New Deals
            </Button>
            <Button onClick={() => addSystemNotification('success')} variant="outline">
              Success Notification
            </Button>
            <Button onClick={() => addSystemNotification('error')} variant="outline">
              Error Notification
            </Button>
            <Button onClick={() => addSystemNotification('warning')} variant="outline">
              Warning Notification
            </Button>
            <Button onClick={() => addSystemNotification('info')} variant="outline">
              Info Notification
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Compact Indicator Demo */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Compact Indicator</CardTitle>
              </CardHeader>
              <CardContent>
                <CompactNewDealsIndicator
                  newDealsCount={newDealsCount}
                  isVisible={newDealsCount > 0}
                  onClick={() => {
                    setNewDealsCount(0);
                    setShowMainNotification(false);
                  }}
                />
                {newDealsCount === 0 && (
                  <p className="text-gray-500 text-sm">No new deals</p>
                )}
              </CardContent>
            </Card>

            {/* Badge Demo */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Badge Indicator</CardTitle>
                  <div className="relative">
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <NewDealsBadge
                      count={newDealsCount}
                      isVisible={newDealsCount > 0}
                      size="sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-sm">
                  Badge appears on top-right of elements
                </p>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>New Deals: {newDealsCount}</p>
                  <p>Main Notification: {showMainNotification ? 'Visible' : 'Hidden'}</p>
                  <p>System Notifications: {notifications.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deal List Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Deal List with Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockDeals.map((deal, index) => {
                  const isNew = newDealIds.has(deal.id);
                  return (
                    <AnimatedDealItem
                      key={deal.id}
                      deal={deal}
                      isNew={isNew}
                      index={index}
                    >
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                        <div>
                          <h4 className="font-medium">{deal.companyName}</h4>
                          <p className="text-sm text-gray-600">{deal.climateSector}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{deal.formattedAmount}</p>
                          <p className="text-sm text-gray-600">{deal.fundingStage}</p>
                        </div>
                      </div>
                    </AnimatedDealItem>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Main Notification */}
      <NewDealsNotification
        newDealsCount={newDealsCount}
        isVisible={showMainNotification}
        onDismiss={() => {
          setShowMainNotification(false);
          setNewDealsCount(0);
          setNewDealIds(new Set());
        }}
        onViewDeals={() => {
          console.log('View deals clicked');
          setShowMainNotification(false);
        }}
        autoHideDuration={8000}
      />

      {/* System Notifications */}
      <NotificationContainer
        notifications={notifications}
        position="top-right"
        maxNotifications={3}
      />
    </div>
  );
}