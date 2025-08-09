import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionErrorBoundary, NewsErrorFallback } from "@/components/dashboard/ErrorFallbacks";
import { LoadingTransition, NewsLoading } from "@/components/dashboard/LoadingStates";
import { MoreHorizontal } from "lucide-react";

// Static news data (placeholder until news API is implemented)
const newsItems = [
  {
    title: "Climate Tech Funding Reaches Record Highs",
    description: "Investment in climate technology companies continues to grow as investors seek sustainable solutions...",
    date: "2w",
    source: "Climate Tech News"
  },
  {
    title: "New Carbon Capture Technologies Show Promise",
    description: "Recent breakthroughs in direct air capture technology are attracting significant venture capital...",
    date: "3w",
    source: "Climate Tech News"
  },
  {
    title: "Renewable Energy Startups Lead Funding Rounds",
    description: "Solar and wind energy companies dominate the latest funding announcements in the climate sector...",
    date: "4w",
    source: "Climate Tech News"
  }
];

export default function NewsSection() {
  return (
    <SectionErrorBoundary
      sectionName="Climate Tech News"
      fallback={(error, retry) => (
        <NewsErrorFallback error={error} retry={retry} />
      )}
      resetKeys={[newsItems.length].filter(key => key !== undefined)}
    >
      <LoadingTransition
        isLoading={false} // News is static, so never loading
        loadingComponent={<NewsLoading />}
        delay={600}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-progressive-load" style={{ animationDelay: '0.5s' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide text-shadow-black-subtle">
                CLIMATE TECH NEWS
              </CardTitle>
              <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {newsItems.map((item, index) => (
                <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0 animate-loading-fade" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-600 hover:underline cursor-pointer mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>Moo Climate</span>
                        <span>•</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 ml-2">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </LoadingTransition>
    </SectionErrorBoundary>
  );
}
