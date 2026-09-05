'use client';

import React, { useEffect, useState } from 'react';
import { Flame, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function StreakCard() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStreak = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase?.from('drafts')?.select('published_at')?.eq('user_id', user?.id)?.eq('status', 'published')?.not('published_at', 'is', null)?.order('published_at', { ascending: false });

        if (!data || data?.length === 0) {
          setStreak(0);
          setLoading(false);
          return;
        }

        // Calculate consecutive days streak
        const dates = data?.map((d) => new Date(d.published_at)?.toDateString());
        const unique = [...new Set(dates)];
        let count = 0;
        const today = new Date();
        for (let i = 0; i < unique?.length; i++) {
          const check = new Date(today);
          check?.setDate(today?.getDate() - i);
          if (unique?.[i] === check?.toDateString()) {
            count++;
          } else {
            break;
          }
        }
        setStreak(count);
      } catch {}
      setLoading(false);
    };
    fetchStreak();
  }, [user]);

  return (
    <div
      className="relative rounded-xl p-5 h-full flex flex-col justify-between overflow-hidden card-glow-primary"
      style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(167,139,250,0.08) 100%)', border: '1px solid rgba(167,139,250,0.2)' }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(167,139,250,0.12) 0%, transparent 70%)' }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>
              Publishing Streak
            </p>
            <div className="flex items-end gap-2">
              {loading ? (
                <div className="h-12 w-16 rounded ai-shimmer" />
              ) : (
                <>
                  <span className="text-5xl font-bold metric-value text-gradient-primary">{streak}</span>
                  <span className="text-lg font-semibold mb-1" style={{ color: 'var(--primary)' }}>days</span>
                </>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.12)' }}>
            <Flame size={24} style={{ color: '#a78bfa' }} />
          </div>
        </div>

        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {streak === 0 ? 'Publish your first piece to start your streak' : `Keep going — ${streak} day${streak !== 1 ? 's' : ''} strong!`}
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(167,139,250,0.12)' }}>
        <TrendingUp size={14} style={{ color: '#34d399' }} />
        <span className="text-xs" style={{ color: '#34d399' }}>
          {streak > 0 ? 'Active streak — keep publishing!' : 'Start publishing to build your streak'}
        </span>
      </div>
    </div>
  );
}