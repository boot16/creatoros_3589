'use client';

import React, { useState, useEffect } from 'react';
import { Zap, RefreshCw, ChevronRight, Sparkles } from 'lucide-react';
import { YoutubeIcon, InstagramIcon } from '@/components/ui/PlatformIcons';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Idea {
  id: string;
  title: string;
  platform: string;
  score: number;
  description: string;
}

export default function AiIdeaPanel() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIdeas = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ideas')
        .select('id, title, platform, score, description')
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(5);
      if (!error && data) {
        setIdeas(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchIdeas();
  }, [user]);

  const trendLabel = (score: number) => {
    if (score >= 90) return 'Trending now';
    if (score >= 80) return 'High potential';
    return 'Evergreen';
  };

  return (
    <div
      className="rounded-xl p-5 h-full flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: 'var(--primary)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>AI Idea Suggestions</p>
        </div>
        <button
          onClick={fetchIdeas}
          disabled={loading}
          className="btn-ghost p-1.5 rounded-lg"
          aria-label="Refresh AI ideas"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={`idea-skel-${i + 1}`} className="h-16 rounded-lg ai-shimmer" />
            ))
          : ideas.length === 0
          ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Sparkles size={24} style={{ color: 'var(--muted-foreground)' }} className="mb-2" />
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No ideas yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Start adding ideas to your bank</p>
            </div>
          )
          : ideas.map((idea) => (
              <div
                key={idea.id}
                className="group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150"
                style={{ background: 'var(--muted)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(167,139,250,0.08)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)';
                }}
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: idea.platform === 'youtube' ? 'rgba(167,139,250,0.12)' : 'rgba(244,114,182,0.12)' }}
                >
                  {idea.platform === 'youtube' ? (
                    <YoutubeIcon size={13} className="" style={{ color: '#a78bfa' }} />
                  ) : (
                    <InstagramIcon size={13} className="" style={{ color: '#f472b6' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug mb-1" style={{ color: 'var(--foreground)' }}>
                    {idea.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{trendLabel(idea.score)}</span>
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}
                    >
                      {idea.score}
                    </span>
                  </div>
                </div>
                <ChevronRight size={13} className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--primary)' }} />
              </div>
            ))}
      </div>

      <Link href="/content-editor">
        <button className="btn-primary w-full mt-4 justify-center">
          <Zap size={14} />
          Generate More Ideas
        </button>
      </Link>
    </div>
  );
}