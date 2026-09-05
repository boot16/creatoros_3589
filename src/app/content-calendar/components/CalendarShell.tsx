'use client';

import React, { useState, useEffect } from 'react';
import CalendarHeader from './CalendarHeader';
import WeekStatsStrip from './WeekStatsStrip';
import MonthCalendarGrid from './MonthCalendarGrid';
import WeekCalendarGrid from './WeekCalendarGrid';
import UnscheduledDraftsSidebar from './UnscheduledDraftsSidebar';
import ContentDetailModal from './ContentDetailModal';
import type { CalendarContent } from './calendarData';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type CalendarView = 'month' | 'week';
export type PlatformFilter = 'all' | 'youtube' | 'instagram';
export type StatusFilter = 'all' | 'idea' | 'draft' | 'scheduled' | 'published';

export default function CalendarShell() {
  const { user } = useAuth();
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedContent, setSelectedContent] = useState<CalendarContent | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [allContent, setAllContent] = useState<CalendarContent[]>([]);
  const [unscheduledDrafts, setUnscheduledDrafts] = useState<CalendarContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchCalendarData = async () => {
      try {
        const supabase = createClient();
        const { data: entries } = await supabase
          .from('calendar_entries')
          .select('id, title, platform, status, scheduled_at, notes')
          .eq('user_id', user.id)
          .order('scheduled_at', { ascending: true });

        const { data: drafts } = await supabase
          .from('drafts')
          .select('id, title, platform, status, word_count, scheduled_at')
          .eq('user_id', user.id)
          .is('scheduled_at', null)
          .in('status', ['draft', 'idea', 'review']);

        const calendarItems: CalendarContent[] = (entries ?? []).map((e) => ({
          id: e.id,
          title: e.title,
          platform: e.platform as any,
          type: 'video' as any,
          status: e.status as any,
          scheduledDate: e.scheduled_at ? e.scheduled_at.slice(0, 10) : '',
          scheduledTime: e.scheduled_at ? e.scheduled_at.slice(11, 16) : '',
          wordCount: 0,
          aiAssisted: false,
          tags: [],
          notes: e.notes ?? '',
        }));

        const unscheduled: CalendarContent[] = (drafts ?? []).map((d) => ({
          id: d.id,
          title: d.title,
          platform: d.platform as any,
          type: 'video' as any,
          status: d.status as any,
          scheduledDate: '',
          scheduledTime: '',
          wordCount: d.word_count ?? 0,
          aiAssisted: false,
          tags: [],
        }));

        setAllContent(calendarItems);
        setUnscheduledDrafts(unscheduled);
      } catch {}
      setLoading(false);
    };
    fetchCalendarData();
  }, [user]);

  return (
    <div className="flex h-full overflow-hidden" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Main calendar area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Calendar controls */}
        <CalendarHeader
          view={view}
          setView={setView}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          platformFilter={platformFilter}
          setPlatformFilter={setPlatformFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Week stats */}
        <WeekStatsStrip currentDate={currentDate} allContent={allContent} />

        {/* Calendar grid */}
        <div className="flex-1 overflow-auto scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading calendar…</div>
            </div>
          ) : view === 'month' ? (
            <MonthCalendarGrid
              currentDate={currentDate}
              platformFilter={platformFilter}
              statusFilter={statusFilter}
              onSelectContent={setSelectedContent}
              allContent={allContent}
            />
          ) : (
            <WeekCalendarGrid
              currentDate={currentDate}
              platformFilter={platformFilter}
              statusFilter={statusFilter}
              onSelectContent={setSelectedContent}
              allContent={allContent}
            />
          )}
        </div>
      </div>

      {/* Unscheduled drafts sidebar */}
      {sidebarOpen && (
        <div
          className="w-72 xl:w-80 flex-shrink-0 border-l overflow-y-auto scrollbar-thin"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <UnscheduledDraftsSidebar
            onSelectContent={setSelectedContent}
            unscheduledDrafts={unscheduledDrafts}
          />
        </div>
      )}

      {/* Content detail modal */}
      {selectedContent && (
        <ContentDetailModal
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
        />
      )}
    </div>
  );
}