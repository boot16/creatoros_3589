'use client';

import React, { useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function ScheduledThisWeekCard() {
  const { user } = useAuth();
  const [scheduled, setScheduled] = useState(0);
  const [loading, setLoading] = useState(true);
  const target = 5;

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const supabase = createClient();
        const now = new Date();
        const startOfWeek = new Date(now);
        const day = now?.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        startOfWeek?.setDate(now?.getDate() + diff);
        startOfWeek?.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek?.setDate(startOfWeek?.getDate() + 6);
        endOfWeek?.setHours(23, 59, 59, 999);

        const { count } = await supabase?.from('calendar_entries')?.select('*', { count: 'exact', head: true })?.eq('user_id', user?.id)?.gte('scheduled_at', startOfWeek?.toISOString())?.lte('scheduled_at', endOfWeek?.toISOString());

        setScheduled(count ?? 0);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [user]);

  const pct = Math.round((scheduled / target) * 100);
  const isAlert = scheduled < 2;

  return (
    <div
      className={`rounded-xl p-5 h-full flex flex-col justify-between ${isAlert && !loading ? 'card-glow-danger' : ''}`}
      style={{
        background: isAlert && !loading ? 'rgba(248,113,113,0.06)' : 'var(--card)',
        border: `1px solid ${isAlert && !loading ? 'rgba(248,113,113,0.2)' : 'var(--border)'}`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>
            Scheduled This Week
          </p>
          {loading ? (
            <div className="h-10 w-16 rounded ai-shimmer" />
          ) : (
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold metric-value" style={{ color: isAlert ? '#f87171' : 'var(--foreground)' }}>
                {scheduled}
              </span>
              <span className="text-lg mb-0.5" style={{ color: 'var(--muted-foreground)' }}>/ {target}</span>
            </div>
          )}
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: isAlert && !loading ? 'rgba(248,113,113,0.12)' : 'rgba(96,165,250,0.1)' }}
        >
          <CalendarCheck size={18} style={{ color: isAlert && !loading ? '#f87171' : '#60a5fa' }} />
        </div>
      </div>

      <div>
        <div className="w-full h-1.5 rounded-full mb-1.5" style={{ background: 'var(--border)' }}>
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${Math.min(pct, 100)}%`, background: isAlert && !loading ? '#f87171' : '#60a5fa' }}
          />
        </div>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {loading ? 'Loading…' : `${pct}% of weekly target filled`}
        </p>
      </div>
    </div>
  );
}