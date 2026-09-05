'use client';

import React, { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function PipelineDepthCard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ idea: 0, draft: 0, scheduled: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase?.from('drafts')?.select('status')?.eq('user_id', user?.id)?.in('status', ['idea', 'draft', 'review', 'scheduled']);

        const idea = data?.filter((d) => d?.status === 'idea')?.length ?? 0;
        const draft = data?.filter((d) => d?.status === 'draft' || d?.status === 'review')?.length ?? 0;
        const scheduled = data?.filter((d) => d?.status === 'scheduled')?.length ?? 0;
        setCounts({ idea, draft, scheduled });
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [user]);

  const statusBreakdown = [
    { label: 'Idea', count: counts?.idea, color: '#a78bfa' },
    { label: 'Draft', count: counts?.draft, color: '#fbbf24' },
    { label: 'Scheduled', count: counts?.scheduled, color: '#60a5fa' },
  ];

  const total = statusBreakdown?.reduce((s, i) => s + i?.count, 0);

  return (
    <div
      className="rounded-xl p-5 h-full flex flex-col justify-between"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>
            Pipeline Depth
          </p>
          {loading ? (
            <div className="h-10 w-12 rounded ai-shimmer" />
          ) : (
            <span className="text-4xl font-bold metric-value" style={{ color: 'var(--foreground)' }}>{total}</span>
          )}
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.1)' }}>
          <Layers size={18} style={{ color: '#fbbf24' }} />
        </div>
      </div>

      <div className="space-y-2">
        {statusBreakdown?.map((s) => (
          <div key={`pipeline-${s?.label}`} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s?.color }} />
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{s?.label}</span>
            </div>
            <span className="text-xs font-semibold metric-value" style={{ color: 'var(--foreground)' }}>{s?.count}</span>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="flex rounded-full overflow-hidden h-1.5 mt-3">
          {statusBreakdown?.map((s) => (
            <div
              key={`bar-${s?.label}`}
              style={{ width: `${(s?.count / total) * 100}%`, background: s?.color }}
            />
          ))}
        </div>
      )}
      {total === 0 && !loading && (
        <div className="h-1.5 rounded-full mt-3" style={{ background: 'var(--border)' }} />
      )}
    </div>
  );
}