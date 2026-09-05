'use client';

import React, { useRef, useState } from 'react';
import { Bold, Italic, List, Copy, Maximize2 } from 'lucide-react';
import { YoutubeIcon, InstagramIcon } from '@/components/ui/PlatformIcons';
import type { EditorState, SaveStatus } from './ContentEditorShell';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';


const PLATFORM_LIMITS: Record<string, Record<string, number>> = {
  youtube: { script: 50000, description: 5000, hook: 500 },
  instagram: { caption: 2200, hook: 150, thread: 10000 },
};

const SECTION_MARKERS = ['[HOOK]', '[BODY]', '[CTA]', '[INTRO]', '[OUTRO]', '[B-ROLL]'];

interface Props {
  state: EditorState;
  updateField: <K extends keyof EditorState>(key: K, value: EditorState[K]) => void;
  saveStatus: SaveStatus;
}

export default function EditorWritingPane({ state, updateField, saveStatus }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const limit = PLATFORM_LIMITS[state.platform]?.[state.contentType] ?? 5000;
  const charCount = state.body.length;
  const wordCount = state.body.trim() ? state.body.trim().split(/\s+/).length : 0;
  const pct = Math.min((charCount / limit) * 100, 100);
  const isNearLimit = pct > 85;
  const isOverLimit = charCount > limit;

  const insertSection = (marker: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const before = state.body.slice(0, start);
    const after = state.body.slice(start);
    updateField('body', `${before}\n\n${marker}\n${after}`);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + marker.length + 3, start + marker.length + 3);
    }, 0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(state.body);
    toast.success('Content copied to clipboard');
  };

  const wrapText = (prefix: string, suffix = prefix) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = state.body.slice(start, end);
    const newBody = state.body.slice(0, start) + prefix + selected + suffix + state.body.slice(end);
    updateField('body', newBody);
  };

  const PlatformIcon = state.platform === 'youtube' ? YoutubeIcon : InstagramIcon;
  const platformColor = state.platform === 'youtube' ? '#a78bfa' : '#f472b6';

  return (
    <div className={`flex flex-col flex-1 overflow-hidden ${fullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={{ background: 'var(--background)' }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-5 py-2.5 border-b flex-wrap"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        {/* Platform badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold mr-2"
          style={{ background: `${platformColor}15`, color: platformColor, border: `1px solid ${platformColor}30` }}
        >
          <PlatformIcon size={12} />
          <span className="capitalize">{state.platform}</span>
          <span className="opacity-60">·</span>
          <span className="capitalize">{state.contentType}</span>
        </div>

        {/* Format buttons */}
        <div className="flex items-center gap-0.5">
          {[
            { icon: Bold, label: 'Bold', action: () => wrapText('**') },
            { icon: Italic, label: 'Italic', action: () => wrapText('_') },
            { icon: List, label: 'List', action: () => insertSection('•') },
          ].map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={`fmt-${btn.label}`}
                onClick={btn.action}
                title={btn.label}
                className="w-8 h-8 rounded-md flex items-center justify-center transition-all duration-100"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(167,139,250,0.1)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)';
                }}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>

        {/* Section markers */}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs mr-1" style={{ color: 'var(--muted-foreground)' }}>Insert:</span>
          {SECTION_MARKERS.slice(0, 4).map((m) => (
            <button
              key={`section-${m}`}
              onClick={() => insertSection(m)}
              className="px-2 py-0.5 rounded text-xs font-medium transition-all duration-100"
              style={{ background: 'rgba(167,139,250,0.08)', color: 'var(--primary)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(167,139,250,0.18)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(167,139,250,0.08)';
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Autosave status */}
          <span
            className="text-xs px-2 py-1 rounded-md"
            style={{
              background: saveStatus === 'saved' ? 'rgba(52,211,153,0.1)' : saveStatus === 'saving' ? 'rgba(167,139,250,0.1)' : 'transparent',
              color: saveStatus === 'saved' ? '#34d399' : saveStatus === 'saving' ? 'var(--primary)' : 'var(--muted-foreground)',
            }}
          >
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : 'Unsaved'}
          </span>

          <button
            onClick={handleCopy}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-all duration-100"
            style={{ color: 'var(--muted-foreground)' }}
            title="Copy content"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => setFullscreen((f) => !f)}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-all duration-100"
            style={{ color: 'var(--muted-foreground)' }}
            title="Toggle fullscreen"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Writing area */}
      <div className="flex-1 overflow-hidden flex flex-col px-6 py-5">
        <textarea
          ref={textareaRef}
          className="flex-1 w-full resize-none outline-none bg-transparent text-sm leading-relaxed scrollbar-thin"
          style={{
            color: 'var(--foreground)',
            fontFamily: 'var(--font-sans)',
            lineHeight: '1.8',
            minHeight: '0',
          }}
          value={state.body}
          onChange={(e) => updateField('body', e.target.value)}
          placeholder={`Start writing your ${state.contentType}…\n\nTip: Use [HOOK], [BODY], [CTA] markers to structure your script.`}
          spellCheck
        />
      </div>

      {/* Footer stats */}
      <div
        className="flex items-center justify-between px-6 py-2.5 border-t"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <div className="flex items-center gap-4">
          <span className="text-xs metric-value" style={{ color: 'var(--muted-foreground)' }}>
            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{wordCount.toLocaleString()}</span> words
          </span>
          <span className="text-xs metric-value" style={{ color: isOverLimit ? '#f87171' : isNearLimit ? '#fbbf24' : 'var(--muted-foreground)' }}>
            <span style={{ fontWeight: 600 }}>{charCount.toLocaleString()}</span> / {limit.toLocaleString()} chars
          </span>
        </div>

        {/* Character limit bar */}
        <div className="flex items-center gap-2">
          <div className="w-32 h-1 rounded-full" style={{ background: 'var(--border)' }}>
            <div
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                background: isOverLimit ? '#f87171' : isNearLimit ? '#fbbf24' : 'var(--primary)',
              }}
            />
          </div>
          {isOverLimit && (
            <span className="text-xs font-medium" style={{ color: '#f87171' }}>
              {charCount - limit} over limit
            </span>
          )}
        </div>
      </div>
    </div>
  );
}