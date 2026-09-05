'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Lightbulb, Sparkles, RefreshCw, Loader2, ChevronRight, Key, Plus } from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';
import toast from 'react-hot-toast';

interface GeneratedIdea {
  concept: string;
  titles: string[];
  hooks: string[];
  structure: string[];
}

interface SavedIdea {
  id: string;
  title: string;
  description: string;
  platform: string;
  score: number;
  tags: string[];
  created_at: string;
}

const NICHE_PROMPTS = [
  'AI tools for creators',
  'YouTube growth strategies',
  'Content monetization',
  'Creator productivity',
  'Behind the scenes',
  'Audience building',
];

export default function IdeaLabPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [topic, setTopic] = useState('');
  const [generatedIdea, setGeneratedIdea] = useState<GeneratedIdea | null>(null);
  const [parseError, setParseError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [nonce, setNonce] = useState(0);

  const { response, isLoading, error, sendMessage } = useChat('OPEN_AI', 'gpt-4o', false);

  useEffect(() => {
    if (error) {
      if (error.message?.includes('401') || error.message?.includes('API key')) {
        setHasApiKey(false);
      } else {
        toast.error('Generation failed. Please try again.');
      }
    }
  }, [error]);

  useEffect(() => {
    if (response && !isLoading) {
      try {
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        setGeneratedIdea(parsed);
        setParseError(false);
      } catch {
        setParseError(true);
      }
    }
  }, [response, isLoading]);

  const fetchSavedIdeas = useCallback(async () => {
    if (!user) return;
    setLoadingIdeas(true);
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setSavedIdeas(data || []);
    } catch (err) {
      console.error('Failed to fetch ideas:', err);
    } finally {
      setLoadingIdeas(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedIdeas();
  }, [fetchSavedIdeas]);

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setGeneratedIdea(null);
    setParseError(false);
    setHasApiKey(true);

    const systemPrompt = `You are a YouTube content strategist. Generate a detailed content idea in JSON format.
Return ONLY valid JSON with this exact structure:
{
  "concept": "2-3 sentence concept description",
  "titles": ["Title 1", "Title 2", "Title 3", "Title 4"],
  "hooks": ["Hook 1 (first 15 seconds)", "Hook 2", "Hook 3"],
  "structure": ["Beat 1: ...", "Beat 2: ...", "Beat 3: ...", "Beat 4: ...", "Beat 5: ..."]
}`;

    sendMessage([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate a YouTube video idea about: ${topic}. Nonce: ${nonce}` },
    ], { max_completion_tokens: 1000 });
  };

  const handleRegenerate = () => {
    setNonce((n) => n + 1);
    setGeneratedIdea(null);
    handleGenerate();
  };

  const handleSaveIdea = async (title: string) => {
    if (!user || !generatedIdea) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('ideas').insert({
        user_id: user.id,
        title,
        description: generatedIdea.concept,
        platform: 'youtube',
        tags: [topic.toLowerCase()],
        score: Math.floor(Math.random() * 20) + 70,
      }).select().single();
      if (error) throw error;
      setSavedIdeas((prev) => [data, ...prev]);
      toast.success('Idea saved to your bank!');
    } catch (err) {
      toast.error('Failed to save idea');
    } finally {
      setSaving(false);
    }
  };

  const handleTurnIntoScript = async () => {
    if (!user || !generatedIdea) return;
    setSaving(true);
    try {
      const title = generatedIdea.titles[0] || topic;
      const { data, error } = await supabase.from('script_drafts').insert({
        user_id: user.id,
        title,
        hook: generatedIdea.hooks[0] || '',
        body: `## CONCEPT\n${generatedIdea.concept}\n\n## HOOKS\n${generatedIdea.hooks.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\n## STRUCTURE\n${generatedIdea.structure.map((b) => `- ${b}`).join('\n')}`,
        platform: 'youtube',
        ai_generated: true,
        word_count: 150,
      }).select().single();
      if (error) throw error;
      toast.success('Script draft created!');
      router.push('/scripts');
    } catch (err) {
      toast.error('Failed to create script');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout pageTitle="Idea Lab" pageSubtitle="AI-powered content idea generation">
      <div className="px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Generator panel */}
          <div className="lg:col-span-3 space-y-4">
            {/* Input */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <Lightbulb size={16} style={{ color: 'var(--primary)' }} />
                Generate New Idea
              </h2>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                  placeholder="Enter a topic or niche…"
                  className="input-base flex-1"
                />
                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !topic.trim()}
                  className="btn-primary px-4"
                  style={{ opacity: isLoading || !topic.trim() ? 0.6 : 1 }}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isLoading ? 'Generating…' : 'Generate'}
                </button>
              </div>
              {/* Quick prompts */}
              <div className="flex flex-wrap gap-1.5">
                {NICHE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setTopic(p)}
                    className="text-xs px-2.5 py-1 rounded-full transition-all"
                    style={{ background: 'rgba(167,139,250,0.08)', color: 'var(--muted-foreground)', border: '1px solid rgba(167,139,250,0.15)' }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* No API key state */}
            {!hasApiKey && (
              <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(167,139,250,0.06)', border: '1px dashed rgba(167,139,250,0.3)' }}>
                <Key size={24} className="mx-auto mb-3" style={{ color: 'var(--primary)' }} />
                <h3 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Add API Key to Activate</h3>
                <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  AI generation requires an OpenAI API key. Add your key to the <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(167,139,250,0.1)', color: 'var(--primary)' }}>.env</code> file to unlock Idea Lab.
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Set <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>OPENAI_API_KEY=your-key-here</code>
                </p>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.1)' }}>
                    <Sparkles size={16} className="animate-pulse" style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Generating idea…</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Analyzing your topic and crafting content angles</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[80, 60, 90, 70].map((w, i) => (
                    <div key={i} className="h-3 rounded-full ai-shimmer" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Generated idea */}
            {generatedIdea && !isLoading && !parseError && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid rgba(167,139,250,0.3)' }}>
                {/* Concept */}
                <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Concept</h3>
                    <button onClick={handleRegenerate} className="btn-ghost text-xs py-1 px-2 gap-1">
                      <RefreshCw size={11} /> Regenerate
                    </button>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>{generatedIdea.concept}</p>
                </div>

                {/* Titles */}
                <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>Title Options</h3>
                  <div className="space-y-2">
                    {generatedIdea.titles.map((title, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg group" style={{ background: 'rgba(167,139,250,0.05)' }}>
                        <span className="text-sm" style={{ color: 'var(--foreground)' }}>{title}</span>
                        <button
                          onClick={() => handleSaveIdea(title)}
                          disabled={saving}
                          className="opacity-0 group-hover:opacity-100 btn-ghost text-xs py-1 px-2 transition-opacity"
                        >
                          <Plus size={11} /> Save
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hooks */}
                <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>Hook Variants</h3>
                  <div className="space-y-2">
                    {generatedIdea.hooks.map((hook, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: 'rgba(244,114,182,0.05)' }}>
                        <span className="text-xs font-bold mt-0.5 flex-shrink-0" style={{ color: '#f472b6' }}>H{i + 1}</span>
                        <span className="text-sm" style={{ color: 'var(--foreground)' }}>{hook}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Structure */}
                <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>5-Beat Structure</h3>
                  <div className="space-y-2">
                    {generatedIdea.structure.map((beat, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: 'rgba(167,139,250,0.15)', color: 'var(--primary)' }}>
                          {i + 1}
                        </div>
                        <span className="text-sm" style={{ color: 'var(--foreground)' }}>{beat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-5 flex gap-3">
                  <button onClick={handleTurnIntoScript} disabled={saving} className="btn-primary flex-1 justify-center">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                    Turn into Script
                  </button>
                  <button onClick={() => handleSaveIdea(generatedIdea.titles[0])} disabled={saving} className="btn-secondary flex-1 justify-center">
                    Save to Idea Bank
                  </button>
                </div>
              </div>
            )}

            {parseError && !isLoading && (
              <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>Generation completed but response format was unexpected.</p>
                <button onClick={handleRegenerate} className="btn-secondary text-sm">
                  <RefreshCw size={14} /> Try Again
                </button>
              </div>
            )}
          </div>

          {/* Saved ideas sidebar */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl p-5 sticky top-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <h2 className="text-sm font-semibold mb-4 flex items-center justify-between" style={{ color: 'var(--foreground)' }}>
                <span>Idea Bank</span>
                <span className="text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>{savedIdeas.length} ideas</span>
              </h2>
              {loadingIdeas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary)' }} />
                </div>
              ) : savedIdeas.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb size={20} className="mx-auto mb-2" style={{ color: 'var(--muted-foreground)' }} />
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Generate and save ideas to build your bank</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
                  {savedIdeas.map((idea) => (
                    <div key={idea.id} className="p-3 rounded-xl" style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.1)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium line-clamp-2" style={{ color: 'var(--foreground)' }}>{idea.title}</p>
                        <span className="text-xs font-bold flex-shrink-0" style={{ color: idea.score >= 80 ? '#34d399' : 'var(--primary)' }}>{idea.score}</span>
                      </div>
                      {idea.description && (
                        <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--muted-foreground)' }}>{idea.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
