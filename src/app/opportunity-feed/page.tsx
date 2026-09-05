'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Loader2, Zap, Target, Users, DollarSign, Clock, Star } from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  category: string;
  platform: string;
  score: number;
  trend_score: number;
  audience_fit: number;
  competition_gap: number;
  monetization_potential: number;
  timing_score: number;
  collab_potential: number;
  why_bullets: string[];
  formula_breakdown: { formula: string; calculated: number };
  is_saved: boolean;
  tags: string[];
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  trending: '#a78bfa',
  evergreen: '#34d399',
  collab: '#f472b6',
  seasonal: '#fbbf24',
  niche: '#60a5fa',
};

const SCORE_DIMENSIONS = [
  { key: 'trend_score', label: 'Trend', icon: TrendingUp },
  { key: 'audience_fit', label: 'Audience Fit', icon: Users },
  { key: 'competition_gap', label: 'Gap', icon: Target },
  { key: 'monetization_potential', label: 'Monetization', icon: DollarSign },
  { key: 'timing_score', label: 'Timing', icon: Clock },
  { key: 'collab_potential', label: 'Collab', icon: Star },
];

export default function OpportunityFeedPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchOpportunities = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('opportunities')
        .select('*')
        .eq('user_id', user.id)
        .order('score', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('category', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOpportunities(
        (data || []).map((o) => ({
          ...o,
          why_bullets: Array.isArray(o.why_bullets) ? o.why_bullets : JSON.parse(o.why_bullets || '[]'),
          formula_breakdown: typeof o.formula_breakdown === 'object' ? o.formula_breakdown : JSON.parse(o.formula_breakdown || '{}'),
        }))
      );
    } catch (err) {
      console.error('Failed to fetch opportunities:', err);
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleSave = async (opp: Opportunity) => {
    if (!user) return;
    setSavingId(opp.id);
    try {
      if (opp.is_saved) {
        await supabase.from('shortlist').delete().eq('user_id', user.id).eq('opportunity_id', opp.id);
        await supabase.from('opportunities').update({ is_saved: false }).eq('id', opp.id);
      } else {
        await supabase.from('shortlist').upsert({ user_id: user.id, opportunity_id: opp.id });
        await supabase.from('opportunities').update({ is_saved: true }).eq('id', opp.id);
      }
      setOpportunities((prev) => prev.map((o) => o.id === opp.id ? { ...o, is_saved: !o.is_saved } : o));
    } catch (err) {
      console.error('Failed to save opportunity:', err);
    } finally {
      setSavingId(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#34d399';
    if (score >= 70) return '#a78bfa';
    if (score >= 55) return '#fbbf24';
    return '#f87171';
  };

  const categories = ['all', 'trending', 'evergreen', 'collab', 'seasonal', 'niche'];

  return (
    <AppLayout pageTitle="Opportunity Feed" pageSubtitle="Scored content opportunities ranked for your channel">
      <div className="px-6 lg:px-8 py-6 max-w-screen-lg mx-auto">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
              style={{
                background: filter === cat ? (cat === 'all' ? 'rgba(167,139,250,0.15)' : `${CATEGORY_COLORS[cat]}20`) : 'transparent',
                color: filter === cat ? (cat === 'all' ? 'var(--primary)' : CATEGORY_COLORS[cat]) : 'var(--muted-foreground)',
                border: `1px solid ${filter === cat ? (cat === 'all' ? 'rgba(167,139,250,0.3)' : `${CATEGORY_COLORS[cat]}40`) : 'transparent'}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-24">
            <TrendingUp size={32} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No opportunities found. Check back as your channel data grows.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {opportunities.map((opp, idx) => {
              const isExpanded = expandedId === opp.id;
              const catColor = CATEGORY_COLORS[opp.category] || '#a78bfa';
              return (
                <div
                  key={opp.id}
                  className="rounded-2xl overflow-hidden transition-all duration-200"
                  style={{ background: 'var(--card)', border: `1px solid ${isExpanded ? 'rgba(167,139,250,0.3)' : 'var(--border)'}` }}
                >
                  {/* Card header */}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(167,139,250,0.1)', color: 'var(--primary)' }}>
                        {idx + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: `${catColor}18`, color: catColor }}>
                            {opp.category}
                          </span>
                          {opp.tags?.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--muted-foreground)' }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--foreground)' }}>{opp.title}</h3>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{opp.description}</p>
                      </div>

                      {/* Score + actions */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                            style={{ background: `${getScoreColor(opp.score)}18`, color: getScoreColor(opp.score) }}
                          >
                            {opp.score}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSave(opp)}
                            disabled={savingId === opp.id}
                            className="btn-ghost p-1.5"
                            title={opp.is_saved ? 'Remove from shortlist' : 'Add to shortlist'}
                          >
                            {savingId === opp.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : opp.is_saved ? (
                              <BookmarkCheck size={14} style={{ color: 'var(--primary)' }} />
                            ) : (
                              <Bookmark size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                            className="btn-ghost p-1.5"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="mt-4 grid grid-cols-6 gap-2">
                      {SCORE_DIMENSIONS.map(({ key, label }) => {
                        const val = (opp as any)[key] as number;
                        return (
                          <div key={key} className="text-center">
                            <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                              <div className="h-full rounded-full" style={{ width: `${val}%`, background: getScoreColor(val) }} />
                            </div>
                            <div className="text-xs mt-0.5 font-mono" style={{ color: 'var(--foreground)' }}>{val}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--border)' }}>
                      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Why bullets */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--primary)' }}>
                            <Zap size={12} /> Why This Opportunity
                          </h4>
                          <ul className="space-y-2">
                            {opp.why_bullets.map((bullet, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--primary)' }} />
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Formula */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
                            Score Formula
                          </h4>
                          <div className="p-3 rounded-lg" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)' }}>
                            <p className="text-xs font-mono mb-2" style={{ color: 'var(--muted-foreground)' }}>
                              {opp.formula_breakdown?.formula}
                            </p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                              = {opp.formula_breakdown?.calculated?.toFixed(1)}
                            </p>
                          </div>
                          <button
                            onClick={() => {}}
                            className="mt-3 w-full btn-primary text-xs py-2 justify-center"
                          >
                            <Plus size={13} /> Create Project from This
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Plus({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
