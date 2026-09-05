'use client';

import React, { useState, useCallback } from 'react';
import EditorMetaPanel from './EditorMetaPanel';
import EditorWritingPane from './EditorWritingPane';
import EditorAiPanel from './EditorAiPanel';
import HookVariantPanel from './HookVariantPanel';
import { toast } from 'sonner';

export type Platform = 'youtube' | 'instagram';
export type ContentType = 'script' | 'caption' | 'hook' | 'thread' | 'description';
export type Tone = 'educational' | 'entertaining' | 'inspirational' | 'controversial' | 'casual';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type AiPanel = 'generator' | 'hooks' | 'none';

export interface EditorState {
  title: string;
  platform: Platform;
  contentType: ContentType;
  tone: Tone;
  body: string;
  tags: string[];
  scheduledDate: string;
  scheduledTime: string;
}

const initialState: EditorState = {
  title: 'How I Automated My Entire YouTube Workflow with AI',
  platform: 'youtube',
  contentType: 'script',
  tone: 'educational',
  body: `[HOOK]
You've been uploading to YouTube for months, maybe years — but you're still manually writing every title, description, and script from scratch. What if I told you there's a smarter way?

[BODY]
In this video, I'm going to walk you through the exact AI-powered workflow I've built that saves me 6+ hours every single week. We'll cover:

• How I use AI to generate and validate video ideas before I spend a single minute scripting
• The prompting system I built for writing full scripts that actually sound like me
• How I automate thumbnail concepts, titles, and descriptions in one go
• The scheduling stack that keeps my channel consistent — even on my busiest weeks

I've been refining this system for the past 8 months and it has completely changed how I run my channel.

[CTA]
If you want the full template pack I use — including all my AI prompts — drop a comment below saying "WORKFLOW" and I'll DM you the link. And if you found this useful, subscribe because I drop creator productivity videos every single week.`,
  tags: ['youtube', 'ai', 'creator', 'workflow', 'productivity'],
  scheduledDate: '2026-09-06',
  scheduledTime: '14:00',
};

export default function ContentEditorShell() {
  const [state, setState] = useState<EditorState>(initialState);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [activeAiPanel, setActiveAiPanel] = useState<AiPanel>('none');
  const [aiPanelOpen, setAiPanelOpen] = useState(true);

  const updateField = useCallback(<K extends keyof EditorState>(key: K, value: EditorState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setSaveStatus('saving');
    // Backend: PATCH /api/content/:id — autosave field changes
    setTimeout(() => setSaveStatus('saved'), 800);
  }, []);

  const handleInsertText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, body: prev.body + '\n\n' + text }));
    setSaveStatus('saving');
    setTimeout(() => setSaveStatus('saved'), 800);
    toast.success('AI content inserted into editor');
  }, []);

  const handleSave = useCallback(() => {
    setSaveStatus('saving');
    // Backend: PUT /api/content/:id — full save
    setTimeout(() => {
      setSaveStatus('saved');
      toast.success('Draft saved successfully');
    }, 900);
  }, []);

  const handlePublish = useCallback(() => {
    toast.success('Content scheduled for ' + state.scheduledDate + ' at ' + state.scheduledTime);
  }, [state.scheduledDate, state.scheduledTime]);

  return (
    <div className="flex h-full overflow-hidden" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Left meta + controls panel */}
      <div
        className="w-72 xl:w-80 flex-shrink-0 border-r overflow-y-auto scrollbar-thin"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <EditorMetaPanel
          state={state}
          updateField={updateField}
          saveStatus={saveStatus}
          onSave={handleSave}
          onPublish={handlePublish}
          activeAiPanel={activeAiPanel}
          setActiveAiPanel={setActiveAiPanel}
        />
      </div>

      {/* Center writing pane */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <EditorWritingPane
          state={state}
          updateField={updateField}
          saveStatus={saveStatus}
        />
      </div>

      {/* Right AI panel */}
      {aiPanelOpen && (
        <div
          className="w-80 xl:w-96 flex-shrink-0 border-l overflow-y-auto scrollbar-thin flex flex-col"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          {activeAiPanel === 'hooks' ? (
            <HookVariantPanel
              contentTitle={state.title}
              platform={state.platform}
              tone={state.tone}
              onInsert={handleInsertText}
              onClose={() => setActiveAiPanel('none')}
            />
          ) : (
            <EditorAiPanel
              state={state}
              onInsert={handleInsertText}
              activePanel={activeAiPanel}
              setActivePanel={setActiveAiPanel}
            />
          )}
        </div>
      )}
    </div>
  );
}