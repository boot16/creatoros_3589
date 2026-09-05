'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, Plus, RotateCcw } from 'lucide-react';
import type { EditorState, AiPanel } from './ContentEditorShell';
import { toast } from 'sonner';

const promptTemplates = [
  { id: 'tpl-full-script', label: 'Full Script', prompt: 'Write a full script for this video including hook, body, and CTA.' },
  { id: 'tpl-improve', label: 'Improve my draft', prompt: 'Improve the existing draft — make it more engaging and tighten the pacing.' },
  { id: 'tpl-shorter', label: 'Make it shorter', prompt: 'Condense the content to 60% of its current length without losing key points.' },
  { id: 'tpl-caption', label: 'Caption from script', prompt: 'Turn the script into an Instagram caption with emojis and hashtags.' },
  { id: 'tpl-cta', label: 'Write a CTA', prompt: 'Write 3 different calls-to-action for the end of this video.' },
];

const mockGeneratedOutputs: Record<string, string[]> = {
  'tpl-full-script': [
    `[HOOK]\nHere's a question most creators never ask themselves: what would my workflow look like if I removed every manual step?\n\n[BODY]\nI spent 3 weeks documenting every single thing I do to publish one YouTube video. The result was embarrassing — 73% of my time was going to tasks that AI could handle in seconds.\n\nHere's what I automated:\n• Idea validation using search trend analysis\n• Script outlines from a single sentence prompt\n• Thumbnail concepts generated from my script\n• Description and tags from final script\n• Scheduling and cross-posting\n\n[CTA]\nI've packaged the entire system into a free template. Comment "SYSTEM" below and I'll send it to you directly.`,
  ],
  'tpl-improve': [
    `[HOOK]\nMost creators waste 6 hours every week on tasks that take AI 6 seconds. I was one of them — until I built this system.\n\n[BODY]\nAfter 8 months of iteration, here's the workflow that changed everything:\n\n1. AI-powered idea validation before you write a single word\n2. One-prompt script generation that sounds like you, not a robot\n3. Automated thumbnail, title, and description pipeline\n4. Smart scheduling that keeps your channel consistent\n\n[CTA]\nDrop "WORKFLOW" in the comments for the full template pack — 47 creators used it last month to cut their production time in half.`,
  ],
};

interface Props {
  state: EditorState;
  onInsert: (text: string) => void;
  activePanel: AiPanel;
  setActivePanel: (p: AiPanel) => void;
}

export default function EditorAiPanel({ state, onInsert, activePanel, setActivePanel }: Props) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [variantCount, setVariantCount] = useState(1);

  const generate = (templateId?: string) => {
    const tid = templateId ?? selectedTemplate;
    if (!tid && !customPrompt.trim()) return;
    setLoading(true);
    setOutput(null);
    if (templateId) setSelectedTemplate(templateId);
    // Backend: POST /api/ai/generate — send {platform, contentType, tone, prompt, title, body}
    setTimeout(() => {
      const results = tid ? mockGeneratedOutputs[tid] : null;
      setOutput(results?.[0] ?? `Here is a custom AI-generated ${state.contentType} for "${state.title}" in a ${state.tone} tone.\n\nThe AI would generate tailored content based on your channel style, audience, and the specific prompt you provided. This output would reflect your voice and match the platform requirements for ${state.platform}.`);
      setLoading(false);
    }, 1800);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <Sparkles size={16} style={{ color: 'var(--primary)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>AI Content Generator</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {/* Templates */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>
            Quick Templates
          </p>
          <div className="space-y-1">
            {promptTemplates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => generate(tpl.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-150"
                style={{
                  background: selectedTemplate === tpl.id ? 'rgba(167,139,250,0.1)' : 'var(--muted)',
                  color: selectedTemplate === tpl.id ? 'var(--primary)' : 'var(--foreground)',
                  border: `1px solid ${selectedTemplate === tpl.id ? 'rgba(167,139,250,0.2)' : 'transparent'}`,
                }}
              >
                <span>{tpl.label}</span>
                {loading && selectedTemplate === tpl.id && (
                  <Loader2 size={13} className="animate-spin" style={{ color: 'var(--primary)' }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom prompt */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>
            Custom Prompt
          </p>
          <textarea
            className="input-base text-sm resize-none"
            rows={4}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={`Describe what you want AI to generate for this ${state.contentType}…`}
          />
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Variants:</span>
              {[1, 2, 3].map((n) => (
                <button
                  key={`variant-${n}`}
                  onClick={() => setVariantCount(n)}
                  className="w-6 h-6 rounded text-xs font-semibold transition-all duration-100"
                  style={{
                    background: variantCount === n ? 'var(--primary)' : 'var(--muted)',
                    color: variantCount === n ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => generate()}
              disabled={loading || !customPrompt.trim()}
              className="btn-primary text-xs px-3 py-2"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Generate
            </button>
          </div>
        </div>

        {/* Output */}
        {(loading && !output) && (
          <div className="space-y-2">
            <div className="h-4 rounded ai-shimmer" />
            <div className="h-4 rounded ai-shimmer w-5/6" />
            <div className="h-4 rounded ai-shimmer w-4/6" />
            <div className="h-4 rounded ai-shimmer" />
            <div className="h-4 rounded ai-shimmer w-3/4" />
          </div>
        )}

        {output && !loading && (
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>Generated Output</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(output);
                    toast.success('Copied to clipboard');
                  }}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-100"
                  style={{ color: 'var(--muted-foreground)' }}
                  title="Copy output"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={() => generate()}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-100"
                  style={{ color: 'var(--muted-foreground)' }}
                  title="Regenerate"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>
            <pre
              className="text-xs leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--foreground)', fontFamily: 'var(--font-sans)' }}
            >
              {output}
            </pre>
            <button
              onClick={() => onInsert(output)}
              className="btn-primary w-full justify-center mt-3 text-xs"
            >
              <Plus size={12} />
              Insert into Editor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}