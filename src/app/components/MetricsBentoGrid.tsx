import React from 'react';
import StreakCard from './StreakCard';
import PipelineDepthCard from './PipelineDepthCard';
import IdeasBankCard from './IdeasBankCard';
import ScheduledThisWeekCard from './ScheduledThisWeekCard';
import ChannelHealthCard from './ChannelHealthCard';
import AiUsageCard from './AiUsageCard';

// Bento grid plan: 6 cards → grid-cols-4
// Row 1: Streak (spans 2 cols, hero) + Pipeline Depth (1 col) + Ideas Bank (1 col)
// Row 2: Scheduled This Week (1 col) + Channel Health (2 cols) + AI Usage (1 col)

export default function MetricsBentoGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 auto-rows-fr">
      {/* Row 1 */}
      <div className="sm:col-span-2 lg:col-span-2">
        <StreakCard />
      </div>
      <div className="sm:col-span-1 lg:col-span-1">
        <PipelineDepthCard />
      </div>
      <div className="sm:col-span-1 lg:col-span-1">
        <IdeasBankCard />
      </div>

      {/* Row 2 */}
      <div className="sm:col-span-1 lg:col-span-1">
        <ScheduledThisWeekCard />
      </div>
      <div className="sm:col-span-2 lg:col-span-2">
        <ChannelHealthCard />
      </div>
      <div className="sm:col-span-1 lg:col-span-1">
        <AiUsageCard />
      </div>
    </div>
  );
}