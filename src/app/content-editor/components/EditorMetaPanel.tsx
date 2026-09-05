'use client';

import React, { useState } from 'react';
import { Tag, Zap, Anchor, Save, Send, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { YoutubeIcon, InstagramIcon } from '@/components/ui/PlatformIcons';
import type { EditorState, Platform, ContentType, Tone, SaveStatus, AiPanel } from './ContentEditorShell';
import Icon from '@/components/ui/AppIcon';


const platforms: { id: Platform; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { id: 'youtube', label: 'YouTube', icon: YoutubeIcon, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { id: 'instagram', label: 'Instagram', icon: InstagramIcon, color: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
];

const contentTypes: { id: ContentType; label: string; platforms: Platform[] }[] = [
  { id: 'script', label: 'Full Script', platforms: ['youtube'] },
  { id: 'description', label: 'Video Description', platforms: ['youtube'] },
  { id: 'caption', label: 'Caption', platforms: ['instagram'] },
  { id: 'hook', label: 'Hook Only', platforms: ['youtube', 'instagram'] },
  { id: 'thread', label: 'Thread / Carousel', platforms: ['instagram'] },
];

const tones: { id: Tone; label: string; emoji: string }[] = [
  { id: 'educational', label: 'Educational', emoji: '📚' },
  { id: 'entertaining', label: 'Entertaining', emoji: '🎭' },
  { id: 'inspirational', label: 'Inspirational', emoji: '✨' },
  { id: 'controversial', label: 'Controversial', emoji: '🔥' },
  { id: 'casual', label: 'Casual', emoji: '😎' },
];

const saveStatusConfig = {
  idle: { label: 'Save Draft', icon: Save, color: 'var(--muted-foreground)' },
  saving: { label: 'Saving…', icon: Loader2, color: 'var(--primary)' },
  saved: { label: 'Saved ✓', icon: CheckCircle, color: '#34d399' },
  error: { label: 'Save failed', icon: AlertCircle, color: '#f87171' },
};

interface Props {
  state: EditorState;
  updateField: <K extends keyof EditorState>(key: K, value: EditorState[K]) => void;
  saveStatus: SaveStatus;
  onSave: () => void;
  onPublish: () => void;
  activeAiPanel: AiPanel;
  setActiveAiPanel: (p: AiPanel) => void;
}

export default function EditorMetaPanel({ state, updateField, saveStatus, onSave, onPublish, activeAiPanel, setActiveAiPanel }: Props) {
  const [tagInput, setTagInput] = useState('');

  const filteredTypes = contentTypes.filter((t) => t.platforms.includes(state.platform));
  const saveCfg = saveStatusConfig[saveStatus];
  const SaveIcon = saveCfg.icon;

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
      if (!state.tags.includes(newTag)) {
        updateField('tags', [...state.tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateField('tags', state.tags.filter((t) => t !== tag));
  };

  return (
    <div className="p-4 space-y-5">
      {/* Title */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
          Content Title
        </label>
        <input
          className="input-base text-sm font-medium"
          value={state.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Enter a title for this content piece"
        />
      </div>

      {/* Platform */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
          Platform
        </label>
        <div className="grid grid-cols-2 gap-2">
          {platforms.map((p) => {
            const Icon = p.icon;
            const active = state.platform === p.id;
            return (
              <button
                key={`plat-${p.id}`}
                onClick={() => {
                  updateField('platform', p.id);
                  const validTypes = contentTypes.filter((t) => t.platforms.includes(p.id));
                  if (!validTypes.find((t) => t.id === state.contentType)) {
                    updateField('contentType', validTypes[0].id);
                  }
                }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  background: active ? p.bg : 'var(--muted)',
                  border: `1px solid ${active ? p.color + '55' : 'var(--border)'}`,
                  color: active ? p.color : 'var(--muted-foreground)',
                }}
              >
                <Icon size={14} />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Type */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
          Content Type
        </label>
        <div className="space-y-1">
          {filteredTypes.map((t) => {
            const active = state.contentType === t.id;
            return (
              <button
                key={`type-${t.id}`}
                onClick={() => updateField('contentType', t.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150"
                style={{
                  background: active ? 'rgba(167,139,250,0.1)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--muted-foreground)',
                  border: `1px solid ${active ? 'rgba(167,139,250,0.2)' : 'transparent'}`,
                }}
              >
                <span>{t.label}</span>
                {active && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--primary)' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
          Tone
        </label>
        <div className="grid grid-cols-1 gap-1">
          {tones.map((t) => {
            const active = state.tone === t.id;
            return (
              <button
                key={`tone-${t.id}`}
                onClick={() => updateField('tone', t.id)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150"
                style={{
                  background: active ? 'rgba(167,139,250,0.08)' : 'transparent',
                  color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                  border: `1px solid ${active ? 'rgba(167,139,250,0.15)' : 'transparent'}`,
                }}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
          Schedule
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            className="input-base text-xs"
            value={state.scheduledDate}
            onChange={(e) => updateField('scheduledDate', e.target.value)}
          />
          <input
            type="time"
            className="input-base text-xs"
            value={state.scheduledTime}
            onChange={(e) => updateField('scheduledTime', e.target.value)}
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
          Tags
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {state.tags.map((tag) => (
            <span
              key={`tag-${tag}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
              style={{ background: 'rgba(167,139,250,0.1)', color: 'var(--primary)', border: '1px solid rgba(167,139,250,0.2)' }}
            >
              <Tag size={9} />
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-0.5 hover:opacity-70 transition-opacity"
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          className="input-base text-xs"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Add tag and press Enter"
        />
      </div>

      {/* AI Panels toggle */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
          AI Tools
        </label>
        <div className="space-y-1">
          <button
            onClick={() => setActiveAiPanel(activeAiPanel === 'generator' ? 'none' : 'generator')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: activeAiPanel === 'generator' ? 'rgba(167,139,250,0.1)' : 'var(--muted)',
              color: activeAiPanel === 'generator' ? 'var(--primary)' : 'var(--muted-foreground)',
              border: `1px solid ${activeAiPanel === 'generator' ? 'rgba(167,139,250,0.2)' : 'var(--border)'}`,
            }}
          >
            <Zap size={14} />
            AI Content Generator
          </button>
          <button
            onClick={() => setActiveAiPanel(activeAiPanel === 'hooks' ? 'none' : 'hooks')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: activeAiPanel === 'hooks' ? 'rgba(244,114,182,0.1)' : 'var(--muted)',
              color: activeAiPanel === 'hooks' ? '#f472b6' : 'var(--muted-foreground)',
              border: `1px solid ${activeAiPanel === 'hooks' ? 'rgba(244,114,182,0.2)' : 'var(--border)'}`,
            }}
          >
            <Anchor size={14} />
            Hook Variants
          </button>
        </div>
      </div>

      {/* Save / Publish */}
      <div className="pt-2 space-y-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
          style={{
            background: 'var(--muted)',
            border: '1px solid var(--border)',
            color: saveCfg.color,
          }}
        >
          <SaveIcon size={14} className={saveStatus === 'saving' ? 'animate-spin' : ''} />
          {saveCfg.label}
        </button>
        <button
          onClick={onPublish}
          className="btn-primary w-full justify-center"
        >
          <Send size={14} />
          Schedule & Publish
        </button>
      </div>
    </div>
  );
}