'use client';

import React, { useEffect, useState } from 'react';
import { Lightbulb, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function IdeasBankCard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ youtube: 0, instagram: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase?.from('ideas')?.select('platform')?.eq('user_id', user?.id);

        const youtube = data?.filter((d) => d?.platform === 'youtube')?.length ?? 0;
        const instagram = data?.filter((d) => d?.platform === 'instagram')?.length ?? 0;
        setCounts({ youtube, instagram });
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [user]);

  const count = counts?.youtube + counts?.instagram;
  const isLow = count < 5;

  return (
    <div
      className={`rounded-xl p-5 h-full flex flex-col justify-between ${isLow && !loading ? 'card-glow-warning' : ''}`}
      style={{
        background: isLow && !loading ? 'rgba(251,191,36,0.06)' : 'var(--card)',
        border: `1px solid ${isLow && !loading ? 'rgba(251,191,36,0.2)' : 'var(--border)'}`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>
            Ideas in Bank
          </p>
          {loading ? (
            <div className="h-10 w-12 rounded ai-shimmer" />
          ) : (
            <span className="text-4xl font-bold metric-value" style={{ color: isLow ? '#fbbf24' : 'var(--foreground)' }}>
              {count}
            </span>
          )}
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: isLow && !loading ? 'rgba(251,191,36,0.12)' : 'rgba(167,139,250,0.1)' }}
        >
          {isLow && !loading ? (
            <AlertTriangle size={18} style={{ color: '#fbbf24' }} />
          ) : (
            <Lightbulb size={18} style={{ color: '#a78bfa' }} />
          )}
        </div>
      </div>

      <div>
        {loading ? (
          <div className="h-4 w-32 rounded ai-shimmer" />
        ) : count === 0 ? (
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No ideas yet — start adding ideas</p>
        ) : (
          <>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{counts?.youtube} YouTube</span>
              {' · '}
              <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{counts?.instagram} Instagram</span>
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {isLow ? '⚠ Running low — generate more ideas' : 'Good reserve for next 2 weeks'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}