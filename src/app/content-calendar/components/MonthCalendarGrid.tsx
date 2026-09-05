'use client';

import React from 'react';
import { Play as Youtube, Camera as Instagram, AlertTriangle, Plus } from 'lucide-react';
import type { CalendarContent } from './calendarData';
import type { PlatformFilter, StatusFilter } from './CalendarShell';
import Link from 'next/link';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
  for (let i = startDow - 1; i >= 0; i--) {
    let d = new Date(year, month, -i);
    days.push(d);
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push(new Date(year, month + 1, d));
  }

  return days;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function hasGapWarning(date: Date, contentByDate: Map<string, CalendarContent[]>): boolean {
  const prev1 = new Date(date); prev1.setDate(date.getDate() - 1);
  const prev2 = new Date(date); prev2.setDate(date.getDate() - 2);
  const key = formatDate(date);
  const key1 = formatDate(prev1);
  const key2 = formatDate(prev2);
  const hasToday = (contentByDate.get(key)?.length ?? 0) === 0;
  const hasPrev1 = (contentByDate.get(key1)?.length ?? 0) === 0;
  const hasPrev2 = (contentByDate.get(key2)?.length ?? 0) === 0;
  return hasToday && hasPrev1 && hasPrev2;
}

interface Props {
  currentDate: Date;
  platformFilter: PlatformFilter;
  statusFilter: StatusFilter;
  onSelectContent: (c: CalendarContent) => void;
  allContent: CalendarContent[];
}

export default function MonthCalendarGrid({ currentDate, platformFilter, statusFilter, onSelectContent, allContent }: Props) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getDaysInMonth(year, month);
  const todayStr = formatDate(new Date());

  const filtered = allContent.filter((c) => {
    if (platformFilter !== 'all' && c.platform !== platformFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  const contentByDate = new Map<string, CalendarContent[]>();
  filtered.forEach((c) => {
    if (!c.scheduledDate) return;
    const existing = contentByDate.get(c.scheduledDate) ?? [];
    contentByDate.set(c.scheduledDate, [...existing, c]);
  });

  if (allContent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>No content scheduled yet</p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Create content in the editor and schedule it to see it here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
        {DAYS.map((d) => (
          <div
            key={`day-hdr-${d}`}
            className="py-2 text-center text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: 'repeat(6, minmax(120px, 1fr))' }}>
        {days.map((day, idx) => {
          const dateStr = formatDate(day);
          const isCurrentMonth = day.getMonth() === month;
          const isToday = dateStr === todayStr;
          const dayContent = contentByDate.get(dateStr) ?? [];
          const showGap = isCurrentMonth && hasGapWarning(day, contentByDate);
          const maxVisible = 3;
          const overflow = dayContent.length - maxVisible;

          return (
            <div
              key={`cell-${dateStr}-${idx}`}
              className="border-b border-r p-2 flex flex-col gap-1 transition-colors duration-100 group"
              style={{
                borderColor: 'var(--border)',
                background: isToday
                  ? 'rgba(167,139,250,0.06)'
                  : !isCurrentMonth
                  ? 'rgba(0,0,0,0.2)'
                  : showGap
                  ? 'rgba(251,191,36,0.03)'
                  : 'transparent',
                minHeight: '120px',
              }}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full"
                  style={{
                    color: isToday ? 'var(--primary-foreground)' : isCurrentMonth ? 'var(--foreground)' : 'var(--muted-foreground)',
                    background: isToday ? 'var(--primary)' : 'transparent',
                    opacity: isCurrentMonth ? 1 : 0.4,
                  }}
                >
                  {day.getDate()}
                </span>
                <div className="flex items-center gap-1">
                  {showGap && (
                    <AlertTriangle size={11} style={{ color: '#fbbf24' }} title="3+ day gap — consider scheduling content here" />
                  )}
                  <Link href="/content-editor">
                    <button
                      className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{ color: 'var(--muted-foreground)' }}
                      title="Add content on this day"
                    >
                      <Plus size={11} />
                    </button>
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-0.5 flex-1">
                {dayContent.slice(0, maxVisible).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectContent(c)}
                    className={`${c.platform === 'youtube' ? 'calendar-pill-yt' : 'calendar-pill-ig'} w-full text-left`}
                    title={c.title}
                  >
                    {c.platform === 'youtube' ? (
                      <Youtube size={9} className="flex-shrink-0" />
                    ) : (
                      <Instagram size={9} className="flex-shrink-0" />
                    )}
                    <span className="truncate text-xs">{c.title}</span>
                  </button>
                ))}
                {overflow > 0 && (
                  <span className="text-xs pl-1" style={{ color: 'var(--muted-foreground)' }}>
                    +{overflow} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}