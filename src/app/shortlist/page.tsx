'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BookmarkCheck, Loader2, Trash2, TrendingUp, Users, Target, DollarSign, Clock, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ShortlistItem {
  id: string;
  opportunity_id: string;
  notes: string;
  created_at: string;
  opportunities: {
    id: string;
    title: string;
    description: string;
    category: string;
    score: number;
    trend_score: number;
    audience_fit: number;
    competition_gap: number;
    monetization_potential: number;
    timing_score: number;
    collab_potential: number;
    why_bullets: string[];
    tags: string[];
  };
}

interface CollabProfile {
  id: string;
  creator_name: string;
  channel_handle: string;
  platform: string;
  subscriber_count: number;
  niche: string;
  content_style: string;
  compatibility_score: number;
  audience_overlap: number;
  style_match: number;
  topic_alignment: number;
  engagement_rate: number;
  bio: string;
  tags: string[];
  is_proposed: boolean;
}

const SCORE_DIMS = [
  { key: 'trend_score', label: 'Trend', icon: TrendingUp },
  { key: 'audience_fit', label: 'Audience', icon: Users },
  { key: 'competition_gap', label: 'Gap', icon: Target },
  { key: 'monetization_potential', label: 'Monetize', icon: DollarSign },
  { key: 'timing_score', label: 'Timing', icon: Clock },
  { key: 'collab_potential', label: 'Collab', icon: Star },
];

export default function ShortlistPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [collabs, setCollabs] = useState<CollabProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'saved' | 'collab'>('saved');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [proposingId, setProposingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [shortlistRes, collabRes] = await Promise.all([
        supabase
          .from('shortlist')
          .select('*, opportunities(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('collab_profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('compatibility_score', { ascending: false }),
      ]);

      if (shortlistRes.data) {
        setShortlist(
          shortlistRes.data.map((item) => ({
            ...item,
            opportunities: {
              ...item.opportunities,
              why_bullets: Array.isArray(item.opportunities?.why_bullets)
                ? item.opportunities.why_bullets
                : JSON.parse(item.opportunities?.why_bullets || '[]'),
            },
          }))
        );
      }
      if (collabRes.data) setCollabs(collabRes.data);
    } catch (err) {
      console.error('Failed to fetch shortlist:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRemove = async (itemId: string, oppId: string) => {
    setRemovingId(itemId);
    try {
      await supabase.from('shortlist').delete().eq('id', itemId);
      await supabase.from('opportunities').update({ is_saved: false }).eq('id', oppId);
      setShortlist((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error('Failed to remove:', err);
    } finally {
      setRemovingId(null);
    }
  };

  const handleProposeCollab = async (collabId: string) => {
    setProposingId(collabId);
    try {
      await supabase.from('collab_profiles').update({ is_proposed: true }).eq('id', collabId);
      setCollabs((prev) => prev.map((c) => c.id === collabId ? { ...c, is_proposed: true } : c));
    } catch (err) {
      console.error('Failed to propose:', err);
    } finally {
      setProposingId(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#34d399';
    if (score >= 70) return '#a78bfa';
    if (score >= 55) return '#fbbf24';
    return '#f87171';
  };

  const formatSubs = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };

  return (
    <AppLayout pageTitle="Shortlist" pageSubtitle="Saved opportunities and collab matches">
      <div className="px-6 lg:px-8 py-6 max-w-screen-lg mx-auto">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('saved')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            style={{
              background: activeTab === 'saved' ? 'rgba(167,139,250,0.15)' : 'transparent',
              color: activeTab === 'saved' ? 'var(--primary)' : 'var(--muted-foreground)',
            }}
          >
            <BookmarkCheck size={14} />
            Saved Opportunities
            {shortlist.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.2)', color: 'var(--primary)' }}>
                {shortlist.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('collab')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            style={{
              background: activeTab === 'collab' ? 'rgba(167,139,250,0.15)' : 'transparent',
              color: activeTab === 'collab' ? 'var(--primary)' : 'var(--muted-foreground)',
            }}
          >
            <Users size={14} />
            Collab Matches
            {collabs.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.2)', color: 'var(--primary)' }}>
                {collabs.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : activeTab === 'saved' ? (
          shortlist.length === 0 ? (
            <div className="text-center py-24">
              <BookmarkCheck size={32} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>No saved opportunities</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>Bookmark opportunities from the feed to save them here.</p>
              <button onClick={() => router.push('/opportunity-feed')} className="btn-primary">
                Browse Opportunities
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {shortlist.map((item) => {
                const opp = item.opportunities;
                if (!opp) return null;
                return (
                  <div key={item.id} className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: 'rgba(167,139,250,0.1)', color: 'var(--primary)' }}>
                            {opp.category}
                          </span>
                        </div>
                        <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--foreground)' }}>{opp.title}</h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>{opp.description}</p>

                        {/* Score bars */}
                        <div className="grid grid-cols-6 gap-2">
                          {SCORE_DIMS.map(({ key, label }) => {
                            const val = (opp as any)[key] as number;
                            return (
                              <div key={key} className="text-center">
                                <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)', fontSize: '10px' }}>{label}</div>
                                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                                  <div className="h-full rounded-full" style={{ width: `${val}%`, background: getScoreColor(val) }} />
                                </div>
                                <div className="text-xs mt-0.5 font-mono" style={{ color: 'var(--foreground)', fontSize: '10px' }}>{val}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold" style={{ background: `${getScoreColor(opp.score)}18`, color: getScoreColor(opp.score) }}>
                          {opp.score}
                        </div>
                        <button
                          onClick={() => handleRemove(item.id, opp.id)}
                          disabled={removingId === item.id}
                          className="btn-ghost p-1.5"
                          title="Remove from shortlist"
                        >
                          {removingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} style={{ color: '#f87171' }} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Collab tab */
          collabs.length === 0 ? (
            <div className="text-center py-24">
              <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>No collab matches yet</h3>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Collab matches will appear here as your channel data grows.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {collabs.map((collab) => (
                <div key={collab.id} className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #f472b6)', color: '#fff' }}>
                      {collab.creator_name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{collab.creator_name}</h3>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{collab.channel_handle}</span>
                        {collab.is_proposed && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>Proposed</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mb-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        <span>{formatSubs(collab.subscriber_count)} subscribers</span>
                        <span>•</span>
                        <span>{collab.niche}</span>
                        <span>•</span>
                        <span>{collab.engagement_rate}% engagement</span>
                      </div>
                      <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>{collab.bio}</p>

                      {/* Sub-scores */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Audience Overlap', value: collab.audience_overlap },
                          { label: 'Style Match', value: collab.style_match },
                          { label: 'Topic Alignment', value: collab.topic_alignment },
                        ].map(({ label, value }) => (
                          <div key={label} className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(167,139,250,0.06)' }}>
                            <div className="text-base font-bold" style={{ color: getScoreColor(value) }}>{value}</div>
                            <div className="text-xs" style={{ color: 'var(--muted-foreground)', fontSize: '10px' }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {collab.tags?.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--muted-foreground)' }}>#{tag}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex flex-col items-end gap-3">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold" style={{ background: `${getScoreColor(collab.compatibility_score)}18`, color: getScoreColor(collab.compatibility_score) }}>
                        {collab.compatibility_score}
                      </div>
                      <button
                        onClick={() => handleProposeCollab(collab.id)}
                        disabled={proposingId === collab.id || collab.is_proposed}
                        className="btn-primary text-xs py-1.5 px-3"
                        style={{ opacity: collab.is_proposed ? 0.6 : 1 }}
                      >
                        {proposingId === collab.id ? <Loader2 size={12} className="animate-spin" /> : null}
                        {collab.is_proposed ? 'Proposed ✓' : 'Propose Collab'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </AppLayout>
  );
}
