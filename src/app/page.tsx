'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import MetricsBentoGrid from './components/MetricsBentoGrid';
import PipelineChart from './components/PipelineChart';
import AiIdeaPanel from './components/AiIdeaPanel';
import UpcomingScheduleStrip from './components/UpcomingScheduleStrip';
import RecentActivityFeed from './components/RecentActivityFeed';
import { useAuth } from '@/contexts/AuthContext';

export default function ContentDashboardPage() {
  const { user } = useAuth();
  const [subtitle, setSubtitle] = useState('Your content workspace');

  useEffect(() => {
    const now = new Date();
    const dayName = now?.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = now?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setSubtitle(`${dayName}, ${dateStr}`);
  }, []);

  const displayName = user?.user_metadata?.full_name
    ? user?.user_metadata?.full_name?.split(' ')?.[0]
    : user?.email?.split('@')?.[0] || 'Creator';

  return (
    <AppLayout
      pageTitle={`Welcome back, ${displayName}`}
      pageSubtitle={subtitle}
    >
      <div className="px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* KPI Bento Grid */}
        <MetricsBentoGrid />

        {/* Chart + AI Ideas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PipelineChart />
          </div>
          <div className="lg:col-span-1">
            <AiIdeaPanel />
          </div>
        </div>

        {/* Upcoming + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-6">
          <UpcomingScheduleStrip />
          <RecentActivityFeed />
        </div>
      </div>
    </AppLayout>
  );
}