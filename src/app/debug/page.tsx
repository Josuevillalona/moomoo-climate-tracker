"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Activity, Database, Wifi, Settings } from "lucide-react";
import Link from "next/link";
import RealTimeDebug from "@/components/debug/RealTimeDebug";

export default function DebugPage() {
  const [activeTab, setActiveTab] = useState<'realtime' | 'database' | 'analytics' | 'system'>('realtime');

  const tabs = [
    { id: 'realtime' as const, label: 'Real-Time', icon: Wifi },
    { id: 'database' as const, label: 'Database', icon: Database },
    { id: 'analytics' as const, label: 'Analytics', icon: Activity },
    { id: 'system' as const, label: 'System', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Debug Console</h1>
          </div>
          <div className="text-sm text-gray-500">
            Environment: {process.env.NODE_ENV || 'development'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'realtime' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wifi className="w-5 h-5" />
                  <span>Real-Time Connection Debug</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RealTimeDebug />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Database Connection</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-600">
                  Database debugging tools will be implemented here.
                  <ul className="mt-4 space-y-2 list-disc list-inside">
                    <li>Connection status</li>
                    <li>Query performance</li>
                    <li>Row-level security testing</li>
                    <li>Migration status</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Analytics Debug</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-600">
                  Analytics debugging tools will be implemented here.
                  <ul className="mt-4 space-y-2 list-disc list-inside">
                    <li>Event tracking status</li>
                    <li>Performance metrics</li>
                    <li>Error logging</li>
                    <li>User session data</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>System Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Environment</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Node.js: {typeof window !== 'undefined' ? 'Client' : process.version}</div>
                      <div>Environment: {process.env.NODE_ENV || 'development'}</div>
                      <div>Next.js: {typeof window !== 'undefined' ? 'Client-side' : 'Server-side'}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Browser Info</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : 'N/A'}</div>
                      <div>Language: {typeof navigator !== 'undefined' ? navigator.language : 'N/A'}</div>
                      <div>Online: {typeof navigator !== 'undefined' ? (navigator.onLine ? 'Yes' : 'No') : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
