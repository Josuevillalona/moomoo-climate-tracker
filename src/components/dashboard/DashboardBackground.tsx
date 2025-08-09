import React from 'react';

interface DashboardBackgroundProps {
  children: React.ReactNode;
}

export default function DashboardBackground({ children }: DashboardBackgroundProps) {
  return (
    <div className="min-h-screen bg-brand-blue/20 relative overflow-hidden flex">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-brand-yellow/30 rounded-full blur-3xl animate-gentle-pulse"></div>
        <div className="absolute top-1/3 right-20 w-40 h-40 bg-brand-tree-light/30 rounded-full blur-3xl animate-gentle-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-36 h-36 bg-brand-blue/30 rounded-full blur-3xl animate-gentle-pulse delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-brand-yellow/20 to-brand-tree-light/20 rounded-full blur-3xl animate-gentle-pulse delay-500"></div>
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232E5E4E' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 right-1/4 w-4 h-4 bg-brand-yellow/40 rounded-full animate-float delay-300"></div>
        <div className="absolute bottom-1/3 right-10 w-3 h-3 bg-brand-tree-medium/50 rounded-full animate-float delay-700"></div>
        <div className="absolute top-1/2 left-10 w-5 h-5 bg-brand-blue/40 rounded-full animate-float delay-1100"></div>
        
        {/* Drifting Elements */}
        <div className="absolute top-1/4 left-1/3 w-6 h-6 bg-brand-yellow/30 rounded-full animate-drift"></div>
        <div className="absolute bottom-1/4 right-1/3 w-4 h-4 bg-brand-tree-light/40 rounded-full animate-drift delay-1500"></div>
      </div>
      
      {children}
    </div>
  );
}
