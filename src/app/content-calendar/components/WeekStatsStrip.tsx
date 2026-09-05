import React from 'react';
import type { CalendarContent } from './calendarData';
import { CheckCircle, Clock, FileEdit, Lightbulb } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface Props {
  currentDate: Date;
  allContent: CalendarContent[];
}

export default function WeekStatsStrip({ currentDate, allContent }: Props) {
  const { start, end } = getWeekRange(currentDate);

  const thisWeekContent = allContent.filter((c) => {
    if (!c.scheduledDate) return false;
    return c.scheduledDate >= formatDate(start) && c.scheduledDate <= formatDate(end);
  });

  const published = thisWeekContent.filter((c) => c.status === 'published').length;
  const scheduled = thisWeekContent.filter((c) => c.status === 'scheduled').length;
  const drafts = thisWeekContent.filter((c) => c.status === 'draft').length;
  const ideas = thisWeekContent.filter((c) => c.status === 'idea').length;

  const stats = [
    { id: 'stat-published', label: 'Published', value: published, icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    { id: 'stat-scheduled', label: 'Scheduled', value: scheduled, icon: Clock, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    { id: 'stat-drafts', label: 'In Draft', value: drafts, icon: FileEdit, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    { id: 'stat-ideas', label: 'Ideas', value: ideas, icon: Lightbulb, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  ];

  const weekLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return (
    <div
      className="flex items-center gap-4 px-5 py-3 border-b flex-wrap"
      style={{ borderColor: 'var(--border)', background: 'rgba(19,19,31,0.6)' }}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
        Week of {weekLabel}
      </span>
      <div className="w-px h-4" style={{ background: 'var(--border)' }} />
      <div className="flex items-center gap-3 flex-wrap">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{ background: s.bg }}
              >
                <Icon size={11} style={{ color: s.color }} />
              </div>
              <span className="text-xs font-semibold metric-value" style={{ color: 'var(--foreground)' }}>{s.value}</span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{s.label}</span>
            </div>
          );
        })}
      </div>
      <div className="ml-auto">
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Total: <span className="font-semibold metric-value" style={{ color: 'var(--foreground)' }}>{thisWeekContent.length}</span> pieces
        </span>
      </div>
    </div>
  );
}