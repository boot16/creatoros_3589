'use client';

import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function AiUsageCard() {
  const { user } = useAuth();
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(500);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase?.from('user_profiles')?.select('ai_credits_used, ai_credits_limit')?.eq('id', user?.id)?.single();

        if (data) {
          setUsed(data?.ai_credits_used ?? 0);
          setLimit(data?.ai_credits_limit ?? 500);
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [user]);

  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;

  return (
    <div
      className="rounded-xl p-5 h-full flex flex-col justify-between"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>
            AI Assists
          </p>
          {loading ? (
            <div className="h-10 w-16 rounded ai-shimmer" />
          ) : (
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold metric-value" style={{ color: 'var(--foreground)' }}>{used}</span>
              <span className="text-sm mb-0.5" style={{ color: 'var(--muted-foreground)' }}>/ {limit}</span>
            </div>
          )}
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(244,114,182,0.1)' }}>
          <Zap size={18} style={{ color: '#f472b6' }} />
        </div>
      </div>

      <div>
        <div className="w-full h-1.5 rounded-full mb-1.5" style={{ background: 'var(--border)' }}>
          <div
            className="h-1.5 rounded-full"
            style={{ width: `${Math.min(pct, 100)}%`, background: 'linear-gradient(90deg, #f472b6, #a78bfa)' }}
          />
        </div>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {loading ? 'Loading…' : used === 0 ? 'No AI credits used yet' : `${pct}% of monthly credits used`}
        </p>
      </div>
    </div>
  );
}