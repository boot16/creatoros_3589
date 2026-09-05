'use client';

import React, { useState, useEffect } from 'react';
import { FileEdit, CalendarPlus, Lightbulb } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const YoutubeIcon = ({ size = 10, style, className = '' }: { size?: number; style?: React.CSSProperties; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = ({ size = 10, style, className = '' }: { size?: number; style?: React.CSSProperties; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  target: string;
  platform: string;
  time: string;
  iconColor: string;
  iconBg: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay} days ago`;
}

export default function RecentActivityFeed() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const [draftsRes, ideasRes, calendarRes] = await Promise.all([
          supabase
            .from('drafts')
            .select('id, title, platform, status, updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(3),
          supabase
            .from('ideas')
            .select('id, title, platform, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(2),
          supabase
            .from('calendar_entries')
            .select('id, title, platform, scheduled_at, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(2),
        ]);

        const items: ActivityItem[] = [];

        draftsRes.data?.forEach((d) => {
          items.push({
            id: `draft-${d.id}`,
            type: 'draft',
            message: d.status === 'published' ? 'Published —' : 'Draft saved for',
            target: d.title,
            platform: d.platform,
            time: timeAgo(d.updated_at),
            iconColor: d.status === 'published' ? '#34d399' : '#fbbf24',
            iconBg: d.status === 'published' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
          });
        });

        ideasRes.data?.forEach((idea) => {
          items.push({
            id: `idea-${idea.id}`,
            type: 'idea',
            message: 'New idea added —',
            target: idea.title,
            platform: idea.platform,
            time: timeAgo(idea.created_at),
            iconColor: '#f472b6',
            iconBg: 'rgba(244,114,182,0.1)',
          });
        });

        calendarRes.data?.forEach((entry) => {
          items.push({
            id: `cal-${entry.id}`,
            type: 'calendar',
            message: 'Post scheduled —',
            target: entry.title,
            platform: entry.platform,
            time: timeAgo(entry.created_at),
            iconColor: '#60a5fa',
            iconBg: 'rgba(96,165,250,0.1)',
          });
        });

        items.sort((a, b) => {
          const aMs = new Date(a.time).getTime();
          const bMs = new Date(b.time).getTime();
          return bMs - aMs;
        });

        setActivities(items.slice(0, 6));
      } catch {}
      setLoading(false);
    };
    fetchActivity();
  }, [user]);

  const getIcon = (type: string, iconColor: string) => {
    if (type === 'draft') return <FileEdit size={13} style={{ color: iconColor }} />;
    if (type === 'idea') return <Lightbulb size={13} style={{ color: iconColor }} />;
    return <CalendarPlus size={13} style={{ color: iconColor }} />;
  };

  return (
    <div
      className="rounded-xl p-5 flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Recent Activity</p>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Last 7 days</span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`act-skel-${i}`} className="h-10 rounded-lg ai-shimmer" />
          ))
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No activity yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Start creating content to see your activity</p>
          </div>
        ) : (
          activities.map((act) => {
            const platformColor = act.platform === 'youtube' ? '#a78bfa' : '#f472b6';
            return (
              <div key={act.id} className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: act.iconBg }}
                >
                  {getIcon(act.type, act.iconColor)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-snug" style={{ color: 'var(--muted-foreground)' }}>
                    {act.message}{' '}
                    <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                      {act.target}
                    </span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {act.platform === 'youtube' ? (
                      <YoutubeIcon size={10} style={{ color: platformColor }} />
                    ) : (
                      <InstagramIcon size={10} style={{ color: platformColor }} />
                    )}
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{act.time}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}