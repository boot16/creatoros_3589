'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, FileText, Trash2, CheckCircle2, Wand2, Key } from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';
import toast from 'react-hot-toast';

interface ScriptDraft {
  id: string;
  title: string;
  hook: string;
  body: string;
  word_count: number;
  status: string;
  platform: string;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

const REFINE_PILLS = [
  'Make the hook stronger',
  'Add more examples',
  'Shorten by 30%',
  'Make it more conversational',
];

export default function ScriptsPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [scripts, setScripts] = useState<ScriptDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScript, setActiveScript] = useState<ScriptDraft | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [refineInput, setRefineInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(true);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { response, isLoading: refining, error, sendMessage } = useChat('OPEN_AI', 'gpt-4o', false);

  useEffect(() => {
    if (error) {
      if (error.message?.includes('401') || error.message?.includes('API key')) {
        setHasApiKey(false);
      } else {
        toast.error('Refinement failed. Please try again.');
      }
    }
  }, [error]);

  useEffect(() => {
    if (response && !refining && activeScript) {
      const updated = { ...activeScript, body: response, word_count: response.split(/\s+/).length };
      setActiveScript(updated);
      setEditBody(response);
      setScripts((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      supabase.from('script_drafts').update({ body: response, word_count: response.split(/\s+/).length }).eq('id', activeScript.id);
      toast.success('Script refined!');
    }
  }, [response, refining]);

  const fetchScripts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('script_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setScripts(data || []);
      if (data && data.length > 0 && !activeScript) {
        setActiveScript(data[0]);
        setEditBody(data[0].body || '');
        setEditTitle(data[0].title || '');
      }
    } catch (err) {
      console.error('Failed to fetch scripts:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  const handleSelectScript = (script: ScriptDraft) => {
    setActiveScript(script);
    setEditBody(script.body || '');
    setEditTitle(script.title || '');
    setSaveState('idle');
  };

  const handleBodyChange = (val: string) => {
    setEditBody(val);
    setSaveState('saving');
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      if (!activeScript || !user) return;
      const wc = val.split(/\s+/).filter(Boolean).length;
      await supabase.from('script_drafts').update({ body: val, word_count: wc }).eq('id', activeScript.id);
      setActiveScript((s) => s ? { ...s, body: val, word_count: wc } : s);
      setScripts((prev) => prev.map((s) => s.id === activeScript.id ? { ...s, body: val, word_count: wc } : s));
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    }, 700);
  };

  const handleCreateNew = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('script_drafts').insert({
      user_id: user.id,
      title: 'Untitled Script',
      hook: '',
      body: '',
      platform: 'youtube',
      status: 'draft',
      word_count: 0,
    }).select().single();
    if (error) return;
    setScripts((prev) => [data, ...prev]);
    handleSelectScript(data);
  };

  const handleDelete = async (scriptId: string) => {
    await supabase.from('script_drafts').delete().eq('id', scriptId);
    setScripts((prev) => prev.filter((s) => s.id !== scriptId));
    if (activeScript?.id === scriptId) {
      const remaining = scripts.filter((s) => s.id !== scriptId);
      if (remaining.length > 0) handleSelectScript(remaining[0]);
      else setActiveScript(null);
    }
  };

  const handleRefine = (instruction: string) => {
    if (!activeScript || !editBody) return;
    setHasApiKey(true);
    sendMessage([
      { role: 'system', content: 'You are a professional YouTube script editor. Rewrite the provided script based on the instruction. Return ONLY the rewritten script, no explanations.' },
      { role: 'user', content: `Instruction: ${instruction}\n\nScript:\n${editBody}` },
    ], { max_completion_tokens: 3000 });
  };

  const wordCount = editBody.split(/\s+/).filter(Boolean).length;

  return (
    <AppLayout pageTitle="Script Drafts" pageSubtitle="Write, edit, and refine your scripts">
      <div className="flex h-full overflow-hidden">
        {/* Scripts list */}
        <div className="w-56 flex-shrink-0 border-r flex flex-col overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="p-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            <button onClick={handleCreateNew} className="w-full btn-primary text-xs py-2 justify-center">
              <Plus size={13} /> New Script
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
              </div>
            ) : scripts.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: 'var(--muted-foreground)' }}>No scripts yet</p>
            ) : (
              scripts.map((script) => (
                <button
                  key={script.id}
                  onClick={() => handleSelectScript(script)}
                  className="w-full text-left px-3 py-2.5 rounded-lg mb-1 group transition-all"
                  style={{
                    background: activeScript?.id === script.id ? 'rgba(167,139,250,0.12)' : 'transparent',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate flex-1" style={{ color: activeScript?.id === script.id ? 'var(--primary)' : 'var(--foreground)' }}>
                      {script.title}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(script.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
                    >
                      <Trash2 size={10} style={{ color: '#f87171' }} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)', fontSize: '10px' }}>{script.word_count}w</span>
                    {script.ai_generated && <span className="text-xs" style={{ color: 'var(--primary)', fontSize: '10px' }}>AI</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Editor */}
        {activeScript ? (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Editor header */}
            <div className="px-5 py-3 border-b flex items-center gap-3 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={async () => {
                  if (editTitle !== activeScript.title) {
                    await supabase.from('script_drafts').update({ title: editTitle }).eq('id', activeScript.id);
                    setActiveScript((s) => s ? { ...s, title: editTitle } : s);
                    setScripts((prev) => prev.map((s) => s.id === activeScript.id ? { ...s, title: editTitle } : s));
                  }
                }}
                className="flex-1 text-base font-semibold bg-transparent outline-none"
                style={{ color: 'var(--foreground)' }}
              />
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <span>{wordCount} words</span>
                {saveState !== 'idle' && (
                  <span className="flex items-center gap-1" style={{ color: saveState === 'saved' ? '#34d399' : 'var(--muted-foreground)' }}>
                    {saveState === 'saving' ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                    {saveState === 'saving' ? 'Saving…' : 'Saved'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Writing pane */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
                <textarea
                  value={editBody}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  placeholder="Start writing your script here…&#10;&#10;Use ## for sections, **bold** for emphasis.&#10;&#10;Example:&#10;## HOOK&#10;Your opening line here…&#10;&#10;## BEAT 1&#10;First major point…"
                  className="w-full h-full min-h-[500px] bg-transparent outline-none text-sm resize-none font-mono"
                  style={{ color: 'var(--foreground)', lineHeight: '1.8' }}
                />
              </div>

              {/* Refine sidebar */}
              <div className="w-56 flex-shrink-0 border-l overflow-y-auto scrollbar-thin p-4" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>Refine with AI</h3>

                {!hasApiKey && (
                  <div className="mb-3 p-3 rounded-lg text-center" style={{ background: 'rgba(167,139,250,0.06)', border: '1px dashed rgba(167,139,250,0.3)' }}>
                    <Key size={14} className="mx-auto mb-1.5" style={{ color: 'var(--primary)' }} />
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Add OpenAI API key to enable AI refinement</p>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {REFINE_PILLS.map((pill) => (
                    <button
                      key={pill}
                      onClick={() => handleRefine(pill)}
                      disabled={refining || !editBody}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all hover:scale-[1.01]"
                      style={{ background: 'rgba(167,139,250,0.08)', color: 'var(--foreground)', border: '1px solid rgba(167,139,250,0.15)', opacity: refining || !editBody ? 0.5 : 1 }}
                    >
                      {pill}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={refineInput}
                    onChange={(e) => setRefineInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && refineInput.trim()) { handleRefine(refineInput); setRefineInput(''); } }}
                    placeholder="Custom instruction…"
                    className="input-base text-xs py-2"
                    disabled={refining}
                  />
                  <button
                    onClick={() => { if (refineInput.trim()) { handleRefine(refineInput); setRefineInput(''); } }}
                    disabled={refining || !refineInput.trim() || !editBody}
                    className="w-full btn-primary text-xs py-2 justify-center"
                    style={{ opacity: refining || !refineInput.trim() || !editBody ? 0.6 : 1 }}
                  >
                    {refining ? <><Loader2 size={12} className="animate-spin" /> Refining…</> : <><Wand2 size={12} /> Refine</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(167,139,250,0.1)' }}>
              <FileText size={28} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>No Script Selected</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>Create a new script or select one from the list</p>
            <button onClick={handleCreateNew} className="btn-primary">
              <Plus size={16} /> New Script
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
