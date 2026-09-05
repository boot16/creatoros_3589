'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { YoutubeIcon, InstagramIcon } from '@/components/ui/PlatformIcons';
import type { CalendarContent } from './calendarData';
import type { PlatformFilter, StatusFilter } from './CalendarShell';
import Link from 'next/link';

const TIME_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];

function getWeekDays(date: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(date);
  const dow = start.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  start.setDate(start.getDate() + diff);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

interface Props {
  currentDate: Date;
  platformFilter: PlatformFilter;
  statusFilter: StatusFilter;
  onSelectContent: (c: CalendarContent) => void;
  allContent: CalendarContent[];
}

export default function WeekCalendarGrid({ currentDate, platformFilter, statusFilter, onSelectContent, allContent }: Props) {
  const weekDays = getWeekDays(currentDate);
  const todayStr = formatDate(new Date());

  const filtered = allContent.filter((c) => {
    if (platformFilter !== 'all' && c.platform !== platformFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  const contentByDateAndSlot = (dateStr: string, slot: string): CalendarContent[] => {
    return filtered.filter((c) => {
      if (c.scheduledDate !== dateStr) return false;
      const hour = c.scheduledTime.slice(0, 2) + ':00';
      return hour === slot;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-auto scrollbar-thin">
      {/* Day headers */}
      <div className="sticky top-0 z-10 grid border-b" style={{ gridTemplateColumns: '64px repeat(7, 1fr)', borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="py-3" />
        {weekDays.map((day, i) => {
          const dateStr = formatDate(day);
          const isToday = dateStr === todayStr;
          const dayContent = filtered.filter((c) => c.scheduledDate === dateStr);
          return (
            <div key={`week-hdr-${dateStr}`} className="py-3 text-center border-l" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                {DAY_LABELS[i]}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span
                  className="text-base font-bold w-8 h-8 flex items-center justify-center rounded-full"
                  style={{
                    color: isToday ? 'var(--primary-foreground)' : 'var(--foreground)',
                    background: isToday ? 'var(--primary)' : 'transparent',
                  }}
                >
                  {day.getDate()}
                </span>
                {dayContent.length > 0 && (
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(167,139,250,0.12)', color: 'var(--primary)' }}
                  >
                    {dayContent.length}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time slots */}
      {TIME_SLOTS.map((slot) => (
        <div
          key={`slot-${slot}`}
          className="grid border-b"
          style={{
            gridTemplateColumns: '64px repeat(7, 1fr)',
            borderColor: 'var(--border)',
            minHeight: '72px',
          }}
        >
          {/* Time label */}
          <div
            className="flex items-start justify-end pr-3 pt-2"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <span className="text-xs font-mono">{slot}</span>
          </div>

          {/* Day cells */}
          {weekDays.map((day) => {
            const dateStr = formatDate(day);
            const slotContent = contentByDateAndSlot(dateStr, slot);
            const isToday = dateStr === todayStr;

            return (
              <div
                key={`slot-cell-${dateStr}-${slot}`}
                className="border-l p-1.5 flex flex-col gap-1 group transition-colors duration-100"
                style={{
                  borderColor: 'var(--border)',
                  background: isToday ? 'rgba(167,139,250,0.03)' : 'transparent',
                  minHeight: '72px',
                }}
              >
                {slotContent.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectContent(c)}
                    className={`${c.platform === 'youtube' ? 'calendar-pill-yt' : 'calendar-pill-ig'} w-full text-left`}
                    title={c.title}
                  >
                    {c.platform === 'youtube' ? (
                      <YoutubeIcon size={10} className="flex-shrink-0" style={{}} />
                    ) : (
                      <InstagramIcon size={10} className="flex-shrink-0" style={{}} />
                    )}
                    <span className="truncate">{c.title}</span>
                  </button>
                ))}
                {slotContent.length === 0 && (
                  <Link href="/content-editor">
                    <button
                      className="w-full h-full min-h-[48px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center"
                      style={{ border: '1px dashed var(--border)', color: 'var(--muted-foreground)' }}
                      title="Add content at this time"
                    >
                      <Plus size={12} />
                    </button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}