import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search,
  ChevronDown,
  Plus,
  RefreshCw
} from "lucide-react";

interface DashboardHeaderProps {
  user: {
    name: string;
    id: string;
    role: string;
    email: string;
  };
  isConnected: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
  onFeatureUsage: (feature: string, metadata?: any) => void;
}

export default function DashboardHeader({ 
  user, 
  isConnected, 
  isRefetching, 
  onRefresh, 
  onFeatureUsage 
}: DashboardHeaderProps) {
  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-white/20 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold font-heading text-brand-yellow text-shadow-heavy">
            MooMoo Climate
          </h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add widgets
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                onFeatureUsage('dashboard-refresh', { source: 'header-button' });
                onRefresh();
              }}
              disabled={isRefetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {/* Real-time connection indicator */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-100">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-gray-600">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Climate Data"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
            />
          </div>
          <Button variant="ghost" size="sm">
            Help
          </Button>
          <Avatar className="w-8 h-8">
            <AvatarFallback>
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-600">{user.name}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </header>
  );
}
