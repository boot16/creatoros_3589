'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle2, Loader2, Plus, Trash2, FileText, Layers, Clock, ChevronDown } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  objective: string;
  content_type: string;
  platform: string;
  status: string;
  brief_markdown: string;
  brief_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CreativeObject {
  id: string;
  object_type: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

interface ActivityEvent {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: '#34d399' },
  { value: 'paused', label: 'Paused', color: '#fbbf24' },
  { value: 'completed', label: 'Completed', color: '#60a5fa' },
  { value: 'discarded', label: 'Discard', color: '#f87171' },
];

const OBJECT_TYPES = ['note', 'research', 'outline', 'hook', 'cta', 'reference'];

export default function ProjectWorkspacePage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [objects, setObjects] = useState<CreativeObject[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'brief' | 'content' | 'activity'>('brief');
  const [briefContent, setBriefContent] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [addingObject, setAddingObject] = useState(false);
  const [newObjectType, setNewObjectType] = useState('note');
  const [newObjectTitle, setNewObjectTitle] = useState('');
  const [newObjectBody, setNewObjectBody] = useState('');
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProject = useCallback(async () => {
    if (!user || !projectId) return;
    setLoading(true);
    try {
      const [projRes, objRes, actRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).eq('user_id', user.id).single(),
        supabase.from('creative_objects').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('activity_events').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(20),
      ]);
      if (projRes.error) throw projRes.error;
      setProject(projRes.data);
      setBriefContent(projRes.data.brief_markdown || '');
      setTitleValue(projRes.data.title);
      setObjects(objRes.data || []);
      setActivity(actRes.data || []);
    } catch (err) {
      console.error('Failed to fetch project:', err);
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const saveBrief = useCallback(async (content: string) => {
    if (!user || !projectId) return;
    setSaveState('saving');
    try {
      await supabase.from('projects').update({ brief_markdown: content, brief_updated_at: new Date().toISOString() }).eq('id', projectId).eq('user_id', user.id);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('idle');
    }
  }, [user, projectId]);

  const handleBriefChange = (val: string) => {
    setBriefContent(val);
    setSaveState('saving');
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => saveBrief(val), 700);
  };

  const handleTitleSave = async () => {
    if (!titleValue.trim() || !user || !projectId) return;
    setEditingTitle(false);
    await supabase.from('projects').update({ title: titleValue.trim() }).eq('id', projectId).eq('user_id', user.id);
    setProject((p) => p ? { ...p, title: titleValue.trim() } : p);
    await logActivity('title_updated', `Renamed project to "${titleValue.trim()}"`);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user || !projectId) return;
    setShowStatusMenu(false);
    await supabase.from('projects').update({ status: newStatus }).eq('id', projectId).eq('user_id', user.id);
    setProject((p) => p ? { ...p, status: newStatus } : p);
    await logActivity('status_changed', `Status changed to ${newStatus}`);
    if (newStatus === 'discarded') router.push('/projects');
  };

  const logActivity = async (eventType: string, description: string) => {
    if (!user || !projectId) return;
    const { data } = await supabase.from('activity_events').insert({ user_id: user.id, project_id: projectId, event_type: eventType, description }).select().single();
    if (data) setActivity((prev) => [data, ...prev.slice(0, 19)]);
  };

  const handleAddObject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !projectId || !newObjectTitle.trim()) return;
    const { data, error } = await supabase.from('creative_objects').insert({
      project_id: projectId,
      user_id: user.id,
      object_type: newObjectType,
      title: newObjectTitle.trim(),
      body: newObjectBody.trim(),
    }).select().single();
    if (!error && data) {
      setObjects((prev) => [data, ...prev]);
      setNewObjectTitle('');
      setNewObjectBody('');
      setAddingObject(false);
      await logActivity('object_created', `Added ${newObjectType}: "${newObjectTitle.trim()}"`);
    }
  };

  const handleDeleteObject = async (objId: string, objTitle: string) => {
    await supabase.from('creative_objects').delete().eq('id', objId);
    setObjects((prev) => prev.filter((o) => o.id !== objId));
    await logActivity('object_deleted', `Removed: "${objTitle}"`);
  };

  const handleUpdateObject = async (obj: CreativeObject) => {
    await supabase.from('creative_objects').update({ title: obj.title, body: obj.body }).eq('id', obj.id);
    setObjects((prev) => prev.map((o) => (o.id === obj.id ? obj : o)));
    setEditingObjectId(null);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === project?.status) || STATUS_OPTIONS[0];

  if (loading) {
    return (
      <AppLayout pageTitle="Project" pageSubtitle="Loading…">
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      </AppLayout>
    );
  }

  if (!project) return null;

  return (
    <AppLayout pageTitle={project.title} pageSubtitle={project.objective || 'Project workspace'}>
      <div className="flex h-full overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Project header */}
          <div className="px-6 py-4 border-b flex items-center gap-4 flex-shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <button onClick={() => router.push('/projects')} className="btn-ghost p-1.5">
              <ArrowLeft size={16} />
            </button>

            {editingTitle ? (
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') { setEditingTitle(false); setTitleValue(project.title); } }}
                className="flex-1 text-lg font-semibold bg-transparent outline-none border-b"
                style={{ color: 'var(--foreground)', borderColor: 'var(--primary)' }}
                autoFocus
              />
            ) : (
              <h1
                className="flex-1 text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity truncate"
                style={{ color: 'var(--foreground)' }}
                onClick={() => setEditingTitle(true)}
                title="Click to edit title"
              >
                {project.title}
              </h1>
            )}

            {/* Status selector */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid var(--border)', color: currentStatus.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: currentStatus.color }} />
                {currentStatus.label}
                <ChevronDown size={12} />
              </button>
              {showStatusMenu && (
                <div className="absolute right-0 top-full mt-1 w-36 rounded-xl overflow-hidden z-20" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                  {STATUS_OPTIONS.map((s) => (
                    <button key={s.value} onClick={() => handleStatusChange(s.value)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-white/5 transition-colors text-left">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                      <span style={{ color: s.color }}>{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Save indicator */}
            {saveState !== 'idle' && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: saveState === 'saved' ? '#34d399' : 'var(--muted-foreground)' }}>
                {saveState === 'saving' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                {saveState === 'saving' ? 'Saving…' : 'All changes saved'}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-6 py-2 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            {(['brief', 'content', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                style={{
                  background: activeTab === tab ? 'rgba(167,139,250,0.12)' : 'transparent',
                  color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
            {activeTab === 'brief' && (
              <div className="max-w-3xl">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Project Brief</h2>
                  {project.brief_updated_at && (
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Last updated {formatTime(project.brief_updated_at)}
                    </span>
                  )}
                </div>
                <textarea
                  value={briefContent}
                  onChange={(e) => handleBriefChange(e.target.value)}
                  placeholder={`## Brief\n\n### Goal\nWhat do you want to achieve with this content?\n\n### Target Audience\nWho is this for?\n\n### Key Angles\n- Angle 1\n- Angle 2\n\n### Format\nHow will this be structured?`}
                  className="w-full min-h-[500px] p-4 rounded-xl text-sm font-mono resize-none outline-none transition-all"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                    lineHeight: '1.7',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(167,139,250,0.4)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
                <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                  Supports Markdown. Auto-saves as you type.
                </p>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="max-w-3xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    Content Objects <span className="text-xs font-normal ml-1" style={{ color: 'var(--muted-foreground)' }}>({objects.length})</span>
                  </h2>
                  <button onClick={() => setAddingObject(true)} className="btn-secondary text-xs py-1.5 px-3">
                    <Plus size={13} /> Add
                  </button>
                </div>

                {addingObject && (
                  <form onSubmit={handleAddObject} className="mb-4 p-4 rounded-xl" style={{ background: 'var(--card)', border: '1px solid rgba(167,139,250,0.3)' }}>
                    <div className="flex gap-3 mb-3">
                      <select value={newObjectType} onChange={(e) => setNewObjectType(e.target.value)} className="input-base w-32 text-xs py-1.5">
                        {OBJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input
                        type="text"
                        value={newObjectTitle}
                        onChange={(e) => setNewObjectTitle(e.target.value)}
                        placeholder="Title"
                        className="input-base flex-1 text-sm"
                        autoFocus
                        required
                      />
                    </div>
                    <textarea
                      value={newObjectBody}
                      onChange={(e) => setNewObjectBody(e.target.value)}
                      placeholder="Content (optional)"
                      rows={3}
                      className="input-base w-full resize-none text-sm mb-3"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setAddingObject(false)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
                      <button type="submit" className="btn-primary text-xs py-1.5 px-3">Add</button>
                    </div>
                  </form>
                )}

                {objects.length === 0 && !addingObject ? (
                  <div className="text-center py-12">
                    <Layers size={24} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No content objects yet. Add notes, research, outlines, hooks, and more.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {objects.map((obj) => (
                      <div key={obj.id} className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                        {editingObjectId === obj.id ? (
                          <EditObjectForm obj={obj} onSave={handleUpdateObject} onCancel={() => setEditingObjectId(null)} />
                        ) : (
                          <div>
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: 'rgba(167,139,250,0.1)', color: 'var(--primary)' }}>
                                  {obj.object_type}
                                </span>
                                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{obj.title}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setEditingObjectId(obj.id)} className="btn-ghost p-1 text-xs">Edit</button>
                                <button onClick={() => handleDeleteObject(obj.id, obj.title)} className="btn-ghost p-1">
                                  <Trash2 size={12} style={{ color: '#f87171' }} />
                                </button>
                              </div>
                            </div>
                            {obj.body && (
                              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--muted-foreground)' }}>{obj.body}</p>
                            )}
                            <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>{formatTime(obj.updated_at)}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="max-w-2xl">
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Activity Log</h2>
                {activity.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No activity yet.</p>
                ) : (
                  <div className="space-y-2">
                    {activity.map((evt) => (
                      <div key={evt.id} className="flex items-start gap-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(167,139,250,0.1)' }}>
                          <Clock size={11} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>{evt.description}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{formatTime(evt.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar — project info */}
        <div className="w-64 flex-shrink-0 border-l overflow-y-auto scrollbar-thin p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted-foreground)' }}>Project Info</h3>
          <div className="space-y-3">
            <InfoRow label="Type" value={project.content_type.replace(/_/g, ' ')} />
            <InfoRow label="Platform" value={project.platform} />
            <InfoRow label="Status" value={project.status} />
            <InfoRow label="Created" value={formatTime(project.created_at)} />
            {project.objective && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Objective</p>
                <p className="text-xs" style={{ color: 'var(--foreground)' }}>{project.objective}</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => router.push('/scripts')} className="w-full btn-secondary text-xs py-2 justify-start">
                <FileText size={13} /> Write Script
              </button>
              <button onClick={() => router.push('/idea-lab')} className="w-full btn-secondary text-xs py-2 justify-start">
                <Plus size={13} /> Generate Ideas
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium mb-0.5 capitalize" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      <p className="text-xs capitalize" style={{ color: 'var(--foreground)' }}>{value}</p>
    </div>
  );
}

function EditObjectForm({ obj, onSave, onCancel }: { obj: CreativeObject; onSave: (o: CreativeObject) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(obj.title);
  const [body, setBody] = useState(obj.body);
  return (
    <div>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-base text-sm mb-2" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="input-base text-sm resize-none mb-2 w-full" />
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
        <button onClick={() => onSave({ ...obj, title, body })} className="btn-primary text-xs py-1.5 px-3">Save</button>
      </div>
    </div>
  );
}
