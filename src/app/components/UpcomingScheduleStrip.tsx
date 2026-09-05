'use client';

import React, { useEffect, useState } from 'react';
import { Play as Youtube, Camera as Instagram, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ScheduleItem {
  id: string;
  title: string;
  platform: string;
  status: string;
  scheduled_at: string;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  idea: { label: 'Idea', cls: 'badge-idea' },
  draft: { label: 'Draft', cls: 'badge-draft' },
  scheduled: { label: 'Scheduled', cls: 'badge-scheduled' },
  published: { label: 'Published', cls: 'badge-published' },
};

function formatScheduledDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatScheduledTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function UpcomingScheduleStrip() {
  const { user } = useAuth();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const supabase = createClient();
        const now = new Date().toISOString();
        const { data } = await supabase
          .from('calendar_entries')
          .select('id, title, platform, status, scheduled_at')
          .eq('user_id', user.id)
          .gte('scheduled_at', now)
          .order('scheduled_at', { ascending: true })
          .limit(5);

        setItems(data ?? []);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <div
      className="rounded-xl p-5 flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Upcoming Schedule</p>
        <Link href="/content-calendar">
          <button className="btn-ghost text-xs flex items-center gap-1">
            View Calendar <ArrowRight size={12} />
          </button>
        </Link>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`sched-skel-${i}`} className="h-14 rounded-lg ai-shimmer" />
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <Clock size={24} style={{ color: 'var(--muted-foreground)' }} className="mb-2" />
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No upcoming posts scheduled</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Add content to your calendar to see it here</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg transition-all duration-150 cursor-pointer"
              style={{ background: 'var(--muted)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(167,139,250,0.07)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)';
              }}
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: item.platform === 'youtube' ? 'rgba(167,139,250,0.12)' : 'rgba(244,114,182,0.12)' }}
              >
                {item.platform === 'youtube' ? (
                  <Youtube size={13} style={{ color: '#a78bfa' }} />
                ) : (
                  <Instagram size={13} style={{ color: '#f472b6' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate mb-0.5" style={{ color: 'var(--foreground)' }}>{item.title}</p>
                <div className="flex items-center gap-1.5">
                  <Clock size={10} style={{ color: 'var(--muted-foreground)' }} />
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {formatScheduledDate(item.scheduled_at)} · {formatScheduledTime(item.scheduled_at)}
                  </span>
                </div>
              </div>
              <span className={statusConfig[item.status]?.cls ?? 'badge-idea'}>
                {statusConfig[item.status]?.label ?? item.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}