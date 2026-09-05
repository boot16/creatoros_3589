'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Loader2, Key, Plus, Trash2, Bot, User } from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

const STARTER_PROMPTS = [
  'Help me brainstorm angles for a video about AI tools',
  'Write a compelling hook for a creator productivity video',
  'What makes a great YouTube thumbnail concept?',
  'Help me outline a 10-minute tutorial video',
  'Suggest 5 video titles for a channel growth topic',
];

export default function StudioPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { response, isLoading, error, sendMessage } = useChat('OPEN_AI', 'gpt-4o', true);

  useEffect(() => {
    if (error) {
      if (error.message?.includes('401') || error.message?.includes('API key')) {
        setHasApiKey(false);
      } else {
        toast.error('Message failed. Please try again.');
      }
    }
  }, [error]);

  // Append streaming response to messages
  const lastAssistantRef = useRef<string>('');
  useEffect(() => {
    if (response && isLoading) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.content !== response) {
          return [...prev.slice(0, -1), { ...last, content: response }];
        }
        if (last?.role !== 'assistant') {
          return [...prev, { role: 'assistant', content: response, timestamp: new Date().toISOString() }];
        }
        return prev;
      });
    }
    if (response && !isLoading && response !== lastAssistantRef.current) {
      lastAssistantRef.current = response;
      persistSession(response);
    }
  }, [response, isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from('studio_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      const parsed = (data || []).map((s) => ({
        ...s,
        messages: Array.isArray(s.messages) ? s.messages : JSON.parse(s.messages || '[]'),
      }));
      setSessions(parsed);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createNewSession = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('studio_sessions').insert({
      user_id: user.id,
      title: 'New Session',
      messages: [],
    }).select().single();
    if (error) return;
    const session = { ...data, messages: [] };
    setSessions((prev) => [session, ...prev]);
    setActiveSession(session);
    setMessages([]);
    lastAssistantRef.current = '';
  };

  const loadSession = (session: Session) => {
    setActiveSession(session);
    setMessages(session.messages || []);
    lastAssistantRef.current = '';
  };

  const persistSession = async (lastResponse: string) => {
    if (!user || !activeSession) return;
    const updatedMessages = messages.map((m) =>
      m.role === 'assistant' && m === messages[messages.length - 1] ? { ...m, content: lastResponse } : m
    );
    const title = updatedMessages.find((m) => m.role === 'user')?.content?.slice(0, 50) || 'Session';
    await supabase.from('studio_sessions').update({
      messages: updatedMessages,
      title,
      updated_at: new Date().toISOString(),
    }).eq('id', activeSession.id);
    setSessions((prev) => prev.map((s) => s.id === activeSession.id ? { ...s, messages: updatedMessages, title } : s));
  };

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    if (!activeSession) {
      await createNewSession();
    }
    setInput('');
    setHasApiKey(true);

    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    const apiMessages = [
      {
        role: 'system',
        content: `You are Studio, an AI creative assistant for YouTube and Instagram creators. You help with content strategy, scripting, hooks, titles, thumbnails, and channel growth. Be specific, actionable, and creator-focused. Keep responses concise but valuable.`,
      },
      ...newMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    sendMessage(apiMessages, { max_completion_tokens: 1500 });
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('studio_sessions').delete().eq('id', sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
      setMessages([]);
    }
  };

  return (
    <AppLayout pageTitle="Studio" pageSubtitle="Your AI creative assistant">
      <div className="flex h-full overflow-hidden">
        {/* Sessions sidebar */}
        <div className="w-56 flex-shrink-0 border-r flex flex-col overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="p-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            <button onClick={createNewSession} className="w-full btn-primary text-xs py-2 justify-center">
              <Plus size={13} /> New Session
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: 'var(--muted-foreground)' }}>No sessions yet</p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => loadSession(session)}
                  className="w-full text-left px-3 py-2.5 rounded-lg mb-1 group transition-all"
                  style={{
                    background: activeSession?.id === session.id ? 'rgba(167,139,250,0.12)' : 'transparent',
                    color: activeSession?.id === session.id ? 'var(--primary)' : 'var(--muted-foreground)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate flex-1">{session.title}</span>
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
                    >
                      <Trash2 size={10} style={{ color: '#f87171' }} />
                    </button>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)', fontSize: '10px' }}>
                    {new Date(session.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {!activeSession ? (
            /* Welcome state */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(167,139,250,0.1)' }}>
                <Bot size={28} style={{ color: 'var(--primary)' }} />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Studio Assistant</h2>
              <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--muted-foreground)' }}>
                Your AI creative partner for content strategy, scripting, and channel growth.
              </p>

              {!hasApiKey && (
                <div className="mb-6 p-4 rounded-xl max-w-sm" style={{ background: 'rgba(167,139,250,0.06)', border: '1px dashed rgba(167,139,250,0.3)' }}>
                  <Key size={18} className="mx-auto mb-2" style={{ color: 'var(--primary)' }} />
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Add API Key to Activate</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Set <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>OPENAI_API_KEY</code> in your .env file</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 max-w-md w-full">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => { createNewSession().then(() => handleSend(prompt)); }}
                    className="text-left px-4 py-3 rounded-xl text-sm transition-all hover:scale-[1.01]"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Start the conversation…</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(167,139,250,0.15)' }}>
                        <Bot size={14} style={{ color: 'var(--primary)' }} />
                      </div>
                    )}
                    <div
                      className="max-w-[75%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap"
                      style={{
                        background: msg.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : 'var(--card)',
                        color: msg.role === 'user' ? '#fff' : 'var(--foreground)',
                        border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      }}
                    >
                      {msg.content}
                      {msg.role === 'assistant' && isLoading && i === messages.length - 1 && (
                        <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse" style={{ background: 'var(--primary)', borderRadius: '1px' }} />
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #7c3aed, #f472b6)' }}>
                        <User size={12} style={{ color: '#fff' }} />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                {!hasApiKey && (
                  <div className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2 text-xs" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: 'var(--primary)' }}>
                    <Key size={12} />
                    Add your OpenAI API key to enable AI responses
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Ask Studio anything about your content…"
                    className="input-base flex-1"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim()}
                    className="btn-primary px-4"
                    style={{ opacity: isLoading || !input.trim() ? 0.6 : 1 }}
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
