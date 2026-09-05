'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, Tag, FileEdit, Zap, CheckCircle, Trash2 } from 'lucide-react';
import { YoutubeIcon, InstagramIcon } from '@/components/ui/PlatformIcons';
import type { CalendarContent } from './calendarData';
import { toast } from 'sonner';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  idea: { label: 'Idea', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  draft: { label: 'Draft', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  scheduled: { label: 'Scheduled', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  published: { label: 'Published', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
};

const typeLabels: Record<string, string> = {
  video: 'Long-form Video',
  short: 'YouTube Short',
  reel: 'Instagram Reel',
  carousel: 'Carousel Post',
  post: 'Static Post',
  tutorial: 'Tutorial Video',
};

interface Props {
  content: CalendarContent;
  onClose: () => void;
}

export default function ContentDetailModal({ content, onClose }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const sc = statusConfig[content.status] ?? statusConfig.idea;
  const PlatformIcon = content.platform === 'youtube' ? YoutubeIcon : InstagramIcon;
  const platformColor = content.platform === 'youtube' ? '#a78bfa' : '#f472b6';

  const handleDelete = () => {
    // Backend: DELETE /api/content/:id
    toast.success(`"${content.title}" removed from calendar`);
    onClose();
  };

  const handleMarkPublished = () => {
    // Backend: PATCH /api/content/:id { status: 'published' }
    toast.success('Marked as published');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-5 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${platformColor}15` }}
            >
              <PlatformIcon size={18} style={{ color: platformColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold leading-snug mb-1" style={{ color: 'var(--foreground)' }}>
                {content.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: sc.bg, color: sc.color }}
                >
                  {sc.label}
                </span>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {typeLabels[content.type] ?? content.type}
                </span>
                <span className="text-xs capitalize" style={{ color: platformColor }}>
                  {content.platform}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 flex-shrink-0 ml-2"
            style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Schedule info */}
          {content.scheduledDate && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={14} style={{ color: 'var(--muted-foreground)' }} />
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{content.scheduledDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: 'var(--muted-foreground)' }} />
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{content.scheduledTime}</span>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--muted)' }}>
              <p className="text-lg font-bold metric-value" style={{ color: 'var(--foreground)' }}>
                {content.wordCount > 0 ? content.wordCount.toLocaleString() : '—'}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Words</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--muted)' }}>
              <div className="flex items-center justify-center gap-1">
                {content.aiAssisted ? (
                  <Zap size={14} style={{ color: 'var(--primary)' }} />
                ) : (
                  <FileEdit size={14} style={{ color: 'var(--muted-foreground)' }} />
                )}
                <p className="text-sm font-semibold" style={{ color: content.aiAssisted ? 'var(--primary)' : 'var(--muted-foreground)' }}>
                  {content.aiAssisted ? 'AI' : 'Manual'}
                </p>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Drafted</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--muted)' }}>
              <p className="text-lg font-bold metric-value" style={{ color: 'var(--foreground)' }}>
                {content.tags.length}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Tags</p>
            </div>
          </div>

          {/* Tags */}
          {content.tags.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {content.tags.map((tag) => (
                  <span
                    key={`modal-tag-${tag}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{ background: 'rgba(167,139,250,0.1)', color: 'var(--primary)', border: '1px solid rgba(167,139,250,0.2)' }}
                  >
                    <Tag size={9} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {content.notes && (
            <div
              className="p-3 rounded-xl"
              style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)' }}
            >
              <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>Notes</p>
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>{content.notes}</p>
            </div>
          )}

          {/* Delete confirm */}
          {showDeleteConfirm && (
            <div
              className="p-4 rounded-xl"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
            >
              <p className="text-sm font-medium mb-3" style={{ color: '#f87171' }}>
                Delete this content piece? This cannot be undone.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                  style={{ background: '#f87171', color: '#fff' }}
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <Link href="/content-editor" className="flex-1">
            <button className="btn-secondary w-full justify-center text-sm">
              <FileEdit size={14} />
              Open in Editor
            </button>
          </Link>

          {content.status !== 'published' && (
            <button
              onClick={handleMarkPublished}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
              style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
            >
              <CheckCircle size={14} />
              Mark Published
            </button>
          )}

          {!showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150"
              style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
              title="Delete this content piece — this cannot be undone"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}