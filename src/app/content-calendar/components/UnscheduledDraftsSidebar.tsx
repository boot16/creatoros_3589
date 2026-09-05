'use client';

import React, { useState } from 'react';
import type { CalendarContent } from './calendarData';
import { FileEdit, Lightbulb, Search, Zap } from 'lucide-react';
import { YoutubeIcon, InstagramIcon } from '@/components/ui/PlatformIcons';
import Link from 'next/link';

const statusIcons: Record<string, React.ElementType> = {
  draft: FileEdit,
  idea: Lightbulb,
  review: FileEdit,
};

const statusColors: Record<string, string> = {
  draft: '#fbbf24',
  idea: '#a78bfa',
  review: '#60a5fa',
};

interface Props {
  onSelectContent: (c: CalendarContent) => void;
  unscheduledDrafts: CalendarContent[];
}

export default function UnscheduledDraftsSidebar({ onSelectContent, unscheduledDrafts }: Props) {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'youtube' | 'instagram'>('all');

  const filtered = unscheduledDrafts.filter((d) => {
    if (platformFilter !== 'all' && d.platform !== platformFilter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Unscheduled Drafts</p>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}
          >
            {unscheduledDrafts.length}
          </span>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          <Search size={13} style={{ color: 'var(--muted-foreground)' }} />
          <input
            className="bg-transparent outline-none text-xs flex-1"
            style={{ color: 'var(--foreground)' }}
            placeholder="Search drafts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Platform filter */}
        <div className="flex items-center gap-1">
          {(['all', 'youtube', 'instagram'] as const).map((p) => (
            <button
              key={`sidebar-pf-${p}`}
              onClick={() => setPlatformFilter(p)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all duration-150"
              style={{
                background: platformFilter === p ? 'rgba(167,139,250,0.1)' : 'transparent',
                color: platformFilter === p ? 'var(--primary)' : 'var(--muted-foreground)',
                border: `1px solid ${platformFilter === p ? 'rgba(167,139,250,0.2)' : 'transparent'}`,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Drafts list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileEdit size={32} style={{ color: 'var(--muted-foreground)', marginBottom: '12px' }} />
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>No unscheduled drafts</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>All your drafts have been scheduled</p>
          </div>
        ) : (
          filtered.map((draft) => {
            const PlatformIcon = draft.platform === 'youtube' ? YoutubeIcon : InstagramIcon;
            const platformColor = draft.platform === 'youtube' ? '#a78bfa' : '#f472b6';
            const StatusIcon = statusIcons[draft.status] ?? FileEdit;
            const statusColor = statusColors[draft.status] ?? '#fbbf24';

            return (
              <div
                key={draft.id}
                className="p-3 rounded-xl cursor-pointer transition-all duration-150 group"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                onClick={() => onSelectContent(draft)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(167,139,250,0.07)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(167,139,250,0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${platformColor}15` }}
                  >
                    <PlatformIcon size={12} style={{ color: platformColor }} />
                  </div>
                  <p className="text-xs font-medium leading-snug flex-1" style={{ color: 'var(--foreground)' }}>
                    {draft.title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <StatusIcon size={10} style={{ color: statusColor }} />
                    <span className="text-xs capitalize" style={{ color: statusColor }}>{draft.status}</span>
                  </div>
                  {(draft.wordCount ?? 0) > 0 && (
                    <span className="text-xs metric-value" style={{ color: 'var(--muted-foreground)' }}>
                      {(draft.wordCount ?? 0).toLocaleString()} words
                    </span>
                  )}
                  {draft.aiAssisted && (
                    <div className="flex items-center gap-0.5">
                      <Zap size={9} style={{ color: 'var(--primary)' }} />
                      <span className="text-xs" style={{ color: 'var(--primary)' }}>AI</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <Link href="/content-editor">
          <button className="btn-secondary w-full justify-center text-xs">
            <FileEdit size={13} />
            Create New Draft
          </button>
        </Link>
      </div>
    </div>
  );
}