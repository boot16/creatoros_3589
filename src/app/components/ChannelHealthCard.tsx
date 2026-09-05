'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Link as LinkIcon } from 'lucide-react';
import { YoutubeIcon, InstagramIcon } from '@/components/ui/PlatformIcons';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function ChannelHealthCard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ youtube_channel: string; instagram_handle: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('user_profiles')
          .select('youtube_channel, instagram_handle')
          .eq('id', user.id)
          .single();
        setProfile(data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [user]);

  const hasYoutube = !!profile?.youtube_channel;
  const hasInstagram = !!profile?.instagram_handle;
  const hasAny = hasYoutube || hasInstagram;

  return (
    <div
      className="rounded-xl p-5 h-full flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--muted-foreground)' }}>
        Channel Health
      </p>

      {loading ? (
        <div className="flex flex-col gap-3 flex-1">
          <div className="h-14 rounded-lg ai-shimmer" />
          <div className="h-14 rounded-lg ai-shimmer" />
        </div>
      ) : !hasAny ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center py-4">
          <LinkIcon size={24} style={{ color: 'var(--muted-foreground)' }} className="mb-2" />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>No channels connected</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Connect your YouTube or Instagram to track channel health</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 flex-1">
          {hasYoutube && (
            <div
              className="flex items-center gap-4 p-3 rounded-lg"
              style={{ background: 'rgba(167,139,250,0.08)' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(167,139,250,0.18)' }}>
                <YoutubeIcon size={16} className="text-[#a78bfa]" style={{ color: '#a78bfa' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{profile?.youtube_channel}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>YouTube · Connected</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <TrendingUp size={14} style={{ color: '#34d399' }} />
              </div>
            </div>
          )}
          {hasInstagram && (
            <div
              className="flex items-center gap-4 p-3 rounded-lg"
              style={{ background: 'rgba(244,114,182,0.08)' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(244,114,182,0.18)' }}>
                <InstagramIcon size={16} className="text-[#f472b6]" style={{ color: '#f472b6' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{profile?.instagram_handle}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Instagram · Connected</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <TrendingUp size={14} style={{ color: '#34d399' }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}