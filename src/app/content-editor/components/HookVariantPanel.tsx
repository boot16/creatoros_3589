'use client';

import React, { useState, useEffect } from 'react';
import { Anchor, Copy, Plus, RefreshCw, X } from 'lucide-react';
import type { Platform, Tone } from './ContentEditorShell';
import { toast } from 'sonner';

const mockHooks: Record<string, string[]> = {
  youtube: [
    "What if I told you that 80% of your YouTube workflow could be handled by AI — in under 10 minutes a day?",
    "I almost quit YouTube in 2025. Then I discovered the automation system that changed everything.",
    "Most creators spend 6 hours doing what I now do in 45 minutes. Here's the exact system.",
  ],
  instagram: [
    "The workflow that helped me stay consistent for 180 days straight 👇",
    "Hot take: if you're still manually writing every caption, you're working harder than you need to.",
    "POV: You just found the content system that 3x'd my posting frequency without burning out 🧵",
  ],
};

interface Props {
  contentTitle: string;
  platform: Platform;
  tone: Tone;
  onInsert: (text: string) => void;
  onClose: () => void;
}

export default function HookVariantPanel({ contentTitle, platform, tone, onInsert, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [hooks, setHooks] = useState<string[]>([]);
  const [selectedHook, setSelectedHook] = useState<number | null>(null);

  const generate = () => {
    setLoading(true);
    setSelectedHook(null);
    // Backend: POST /api/ai/hooks — generate hook variants for {title, platform, tone}
    setTimeout(() => {
      setHooks(mockHooks[platform] ?? mockHooks.youtube);
      setLoading(false);
    }, 1200);
  };

  useEffect(() => {
    generate();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Anchor size={16} style={{ color: '#f472b6' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Hook Variants</span>
        </div>
        <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg" aria-label="Close hook panel">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {/* Context */}
        <div
          className="p-3 rounded-lg text-xs"
          style={{ background: 'rgba(244,114,182,0.06)', border: '1px solid rgba(244,114,182,0.15)' }}
        >
          <p style={{ color: 'var(--muted-foreground)' }}>
            Generating hooks for: <span className="font-medium" style={{ color: 'var(--foreground)' }}>"{contentTitle}"</span>
          </p>
          <p className="mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Platform: <span className="font-medium capitalize" style={{ color: '#f472b6' }}>{platform}</span> · Tone: <span className="font-medium capitalize" style={{ color: 'var(--foreground)' }}>{tone}</span>
          </p>
        </div>

        {/* Hooks */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={`hook-skel-${i}`} className="h-20 rounded-xl ai-shimmer" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {hooks.map((hook, i) => (
              <div
                key={`hook-variant-${i + 1}`}
                onClick={() => setSelectedHook(i)}
                className="p-4 rounded-xl cursor-pointer transition-all duration-150"
                style={{
                  background: selectedHook === i ? 'rgba(244,114,182,0.08)' : 'var(--muted)',
                  border: `1px solid ${selectedHook === i ? 'rgba(244,114,182,0.3)' : 'var(--border)'}`,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(244,114,182,0.1)', color: '#f472b6' }}
                  >
                    Hook {i + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(hook);
                        toast.success(`Hook ${i + 1} copied`);
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--muted-foreground)' }}
                      title="Copy hook"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{hook}</p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={generate}
          disabled={loading}
          className="btn-secondary w-full justify-center text-sm"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Regenerate All Hooks
        </button>
      </div>

      {/* Insert selected */}
      {selectedHook !== null && (
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => {
              onInsert(hooks[selectedHook]);
              toast.success(`Hook ${selectedHook + 1} inserted into editor`);
            }}
            className="btn-primary w-full justify-center"
          >
            <Plus size={14} />
            Insert Hook {selectedHook + 1} into Editor
          </button>
        </div>
      )}
    </div>
  );
}