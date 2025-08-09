import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Home,
  Search,
  History,
  Bookmark,
  Database,
  FileText,
  MessageSquare,
  Activity,
  Settings,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

interface DashboardSidebarProps {
  onNavigationClick: (feature: string) => void;
}

export default function DashboardSidebar({ onNavigationClick }: DashboardSidebarProps) {
  return (
    <div className="w-64 bg-brand-blue/95 backdrop-blur-sm text-white flex flex-col relative z-10">
      {/* Logo */}
      <div className="p-6 border-b border-brand-blue/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-yellow rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-brand-charcoal" />
          </div>
          <h1 className="text-xl font-bold font-heading text-shadow-black">MooMoo Climate</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <Button 
          variant="secondary" 
          className="w-full justify-start bg-brand-yellow text-white hover:bg-brand-yellow/90 text-shadow-black-subtle"
          onClick={() => onNavigationClick('navigation-dashboard')}
        >
          <Home className="w-4 h-4 mr-3" />
          Dashboard
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-white hover:bg-brand-blue/80 text-shadow-black-subtle"
          onClick={() => onNavigationClick('navigation-search')}
        >
          <Search className="w-4 h-4 mr-3" />
          Advanced Search
        </Button>
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-blue/80 text-shadow-black-subtle">
          <History className="w-4 h-4 mr-3" />
          History
        </Button>
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-blue/80 text-shadow-black-subtle">
          <Bookmark className="w-4 h-4 mr-3" />
          Saved Searches
        </Button>
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-blue/80 text-shadow-black-subtle">
          <Database className="w-4 h-4 mr-3" />
          Saved Lists
        </Button>
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-blue/80 text-shadow-black-subtle">
          <FileText className="w-4 h-4 mr-3" />
          Reports
        </Button>
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-blue/80 text-shadow-black-subtle">
          <MessageSquare className="w-4 h-4 mr-3" />
          News
        </Button>
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-blue/80 text-shadow-black-subtle">
          <Activity className="w-4 h-4 mr-3" />
          Plugins & Apps
        </Button>
        
        {/* Debug link - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <Link href="/debug">
            <Button variant="ghost" className="w-full justify-start text-orange-300 hover:bg-orange-600/20 text-shadow-black-subtle">
              <Settings className="w-4 h-4 mr-3" />
              Debug Console
            </Button>
          </Link>
        )}
      </nav>

      {/* Hide Sidebar Button */}
      <div className="p-4 border-t border-brand-blue/20">
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-blue/80">
          <ChevronRight className="w-4 h-4 mr-3" />
          Hide Sidebar
        </Button>
      </div>
    </div>
  );
}
