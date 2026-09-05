'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, List, BarChart2 } from 'lucide-react';

interface Trend {
  id: string;
  title: string;
  description: string;
  category: string;
  platform: string;
  momentum: number;
  volume: number;
  growth_rate: number;
  why_relevant: string;
  related_topics: string[];
  audience_tags: string[];
  opportunity_id: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  tech: '#a78bfa',
  lifestyle: '#f472b6',
  education: '#60a5fa',
  entertainment: '#fbbf24',
  business: '#34d399',
  health: '#fb923c',
  gaming: '#e879f9',
  other: '#94a3b8',
};

export default function TrendRadarPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'bubble' | 'list'>('bubble');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);

  const fetchTrends = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase.from('trends').select('*').eq('user_id', user.id).order('momentum', { ascending: false });
      if (selectedCategory !== 'all') query = query.eq('category', selectedCategory);
      const { data, error } = await query;
      if (error) throw error;
      setTrends(data || []);
    } catch (err) {
      console.error('Failed to fetch trends:', err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedCategory]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const categories = ['all', 'tech', 'lifestyle', 'education', 'entertainment', 'business', 'health', 'gaming', 'other'];

  const getMomentumLabel = (m: number) => {
    if (m >= 85) return 'Explosive';
    if (m >= 70) return 'Rising Fast';
    if (m >= 55) return 'Growing';
    return 'Emerging';
  };

  return (
    <AppLayout pageTitle="Trend Radar" pageSubtitle="Real-time signals from your niche">
      <div className="px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                style={{
                  background: selectedCategory === cat ? `${CATEGORY_COLORS[cat] || 'rgba(167,139,250,1)'}20` : 'transparent',
                  color: selectedCategory === cat ? (CATEGORY_COLORS[cat] || 'var(--primary)') : 'var(--muted-foreground)',
                  border: `1px solid ${selectedCategory === cat ? `${CATEGORY_COLORS[cat] || 'rgba(167,139,250,1)'}40` : 'transparent'}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <button onClick={() => setViewMode('bubble')} className="p-1.5 rounded-md transition-all" style={{ background: viewMode === 'bubble' ? 'rgba(167,139,250,0.15)' : 'transparent', color: viewMode === 'bubble' ? 'var(--primary)' : 'var(--muted-foreground)' }}>
              <BarChart2 size={14} />
            </button>
            <button onClick={() => setViewMode('list')} className="p-1.5 rounded-md transition-all" style={{ background: viewMode === 'list' ? 'rgba(167,139,250,0.15)' : 'transparent', color: viewMode === 'list' ? 'var(--primary)' : 'var(--muted-foreground)' }}>
              <List size={14} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : trends.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No trends found for this category.</p>
          </div>
        ) : viewMode === 'bubble' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bubble map */}
            <div className="lg:col-span-2 rounded-2xl p-6 relative overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)', minHeight: '420px' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Momentum × Volume Map</h3>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <span>← Low Volume | High Volume →</span>
                </div>
              </div>
              {/* Axis labels */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs" style={{ color: 'var(--muted-foreground)' }}>Momentum ↑</div>
              <div className="relative ml-8" style={{ height: '320px' }}>
                {/* Grid lines */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-20">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} style={{ border: '1px solid var(--border)' }} />
                  ))}
                </div>
                {/* Bubbles */}
                {trends.map((trend) => {
                  const x = (trend.volume / 100) * 85 + 5;
                  const y = 100 - ((trend.momentum / 100) * 85 + 5);
                  const size = Math.max(40, Math.min(90, trend.momentum * 0.7 + 20));
                  const color = CATEGORY_COLORS[trend.category] || '#a78bfa';
                  return (
                    <button
                      key={trend.id}
                      onClick={() => setSelectedTrend(selectedTrend?.id === trend.id ? null : trend)}
                      className="absolute flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 text-center"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        width: `${size}px`,
                        height: `${size}px`,
                        transform: 'translate(-50%, -50%)',
                        background: `${color}22`,
                        border: `2px solid ${selectedTrend?.id === trend.id ? color : `${color}60`}`,
                        boxShadow: selectedTrend?.id === trend.id ? `0 0 20px ${color}40` : 'none',
                      }}
                      title={trend.title}
                    >
                      <span className="text-xs font-semibold px-1 leading-tight" style={{ color, fontSize: size > 60 ? '11px' : '9px' }}>
                        {trend.title.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail panel */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              {selectedTrend ? (
                <TrendDetail trend={selectedTrend} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <BarChart2 size={24} className="mb-3" style={{ color: 'var(--muted-foreground)' }} />
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Click a bubble to see trend details</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {trends.map((trend) => {
              const color = CATEGORY_COLORS[trend.category] || '#a78bfa';
              return (
                <button
                  key={trend.id}
                  onClick={() => setSelectedTrend(selectedTrend?.id === trend.id ? null : trend)}
                  className="w-full text-left rounded-xl p-4 transition-all duration-150 hover:scale-[1.005]"
                  style={{
                    background: 'var(--card)',
                    border: `1px solid ${selectedTrend?.id === trend.id ? 'rgba(167,139,250,0.3)' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: `${color}18`, color }}>
                      {trend.momentum}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
                          {trend.category}
                        </span>
                        <span className="text-xs font-semibold" style={{ color }}>
                          {getMomentumLabel(trend.momentum)}
                        </span>
                        {trend.growth_rate > 0 && (
                          <span className="text-xs" style={{ color: '#34d399' }}>+{trend.growth_rate.toFixed(0)}%</span>
                        )}
                      </div>
                      <h3 className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{trend.title}</h3>
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--muted-foreground)' }}>{trend.description}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Volume</div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{trend.volume}</div>
                    </div>
                  </div>
                  {selectedTrend?.id === trend.id && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                      <TrendDetail trend={trend} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function TrendDetail({ trend }: { trend: Trend }) {
  const color = CATEGORY_COLORS[trend.category] || '#a78bfa';
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>{trend.category}</span>
        <span className="text-xs font-bold" style={{ color: '#34d399' }}>+{trend.growth_rate.toFixed(0)}% growth</span>
      </div>
      <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--foreground)' }}>{trend.title}</h3>
      <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>{trend.description}</p>

      {trend.why_relevant && (
        <div className="mb-4">
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--primary)' }}>Why it matters for you</p>
          <p className="text-xs" style={{ color: 'var(--foreground)' }}>{trend.why_relevant}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(167,139,250,0.06)' }}>
          <div className="text-lg font-bold" style={{ color }}>{trend.momentum}</div>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Momentum</div>
        </div>
        <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(167,139,250,0.06)' }}>
          <div className="text-lg font-bold" style={{ color }}>{trend.volume}</div>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Volume</div>
        </div>
      </div>

      {trend.related_topics?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Related Topics</p>
          <div className="flex flex-wrap gap-1.5">
            {trend.related_topics.map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--muted-foreground)' }}>#{t}</span>
            ))}
          </div>
        </div>
      )}

      {trend.audience_tags?.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Audience</p>
          <div className="flex flex-wrap gap-1.5">
            {trend.audience_tags.map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}12`, color }}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
