'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen, Video, Loader2, ChevronRight, Clock, CheckCircle2, Pause, Trash2, X } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  objective: string;
  content_type: string;
  platform: string;
  status: string;
  brief_markdown: string;
  created_at: string;
  updated_at: string;
}

const CONTENT_TYPES = [
  { value: 'youtube_video', label: 'YouTube Video', platform: 'youtube' },
  { value: 'instagram_reel', label: 'Instagram Reel', platform: 'instagram' },
  { value: 'instagram_post', label: 'Instagram Post', platform: 'instagram' },
  { value: 'instagram_carousel', label: 'Instagram Carousel', platform: 'instagram' },
  { value: 'short_form', label: 'Short-Form (Shorts/Reels)', platform: 'both' },
  { value: 'podcast', label: 'Podcast Episode', platform: 'youtube' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Active', color: '#34d399', icon: CheckCircle2 },
  paused: { label: 'Paused', color: '#fbbf24', icon: Pause },
  completed: { label: 'Completed', color: '#60a5fa', icon: CheckCircle2 },
  discarded: { label: 'Discarded', color: '#6b7280', icon: Trash2 },
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', objective: '', content_type: 'youtube_video' });
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('all');

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'discarded')
        .order('updated_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title.trim()) return;
    setCreating(true);
    try {
      const ct = CONTENT_TYPES.find((c) => c.value === form.content_type);
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: form.title.trim(),
          objective: form.objective.trim(),
          content_type: form.content_type,
          platform: ct?.platform || 'youtube',
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      setShowDialog(false);
      setForm({ title: '', objective: '', content_type: 'youtube_video' });
      router.push(`/projects/${data.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setCreating(false);
    }
  };

  const getContentTypeLabel = (ct: string) => CONTENT_TYPES.find((c) => c.value === ct)?.label || ct;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const activeCount = projects.filter((p) => p.status === 'active').length;

  return (
    <AppLayout pageTitle="Projects" pageSubtitle={`${activeCount} active project${activeCount !== 1 ? 's' : ''}`}>
      <div className="px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {(['all', 'active', 'paused', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 capitalize"
                style={{
                  background: filter === f ? 'rgba(167,139,250,0.15)' : 'transparent',
                  color: filter === f ? 'var(--primary)' : 'var(--muted-foreground)',
                  border: filter === f ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowDialog(true)}
            className="btn-primary"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {/* Projects grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(167,139,250,0.1)' }}>
              <FolderOpen size={28} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              {filter === 'all' ? 'No projects yet' : `No ${filter} projects`}
            </h3>
            <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--muted-foreground)' }}>
              {filter === 'all' ? 'Create your first project to start planning your next piece of content.' : `You have no ${filter} projects right now.`}
            </p>
            {filter === 'all' && (
              <button onClick={() => setShowDialog(true)} className="btn-primary">
                <Plus size={16} /> Create First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => {
              const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;
              const StatusIcon = statusCfg.icon;
              return (
                <button
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="text-left rounded-xl p-5 transition-all duration-200 hover:scale-[1.01] group"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: project.platform === 'instagram' ? 'rgba(244,114,182,0.1)' : 'rgba(167,139,250,0.1)' }}>
                        {project.platform === 'instagram' ? (
                          <Video size={14} style={{ color: '#f472b6' }} />
                        ) : (
                          <Video size={14} style={{ color: '#a78bfa' }} />
                        )}
                      </div>
                      <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        {getContentTypeLabel(project.content_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusIcon size={12} style={{ color: statusCfg.color }} />
                      <span className="text-xs font-medium" style={{ color: statusCfg.color }}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-base mb-1.5 group-hover:text-primary transition-colors line-clamp-2" style={{ color: 'var(--foreground)' }}>
                    {project.title}
                  </h3>

                  {/* Objective */}
                  {project.objective && (
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                      {project.objective}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
                      <Clock size={11} />
                      <span className="text-xs">{formatDate(project.updated_at)}</span>
                    </div>
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--primary)' }} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* New Project Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>New Project</h2>
              <button onClick={() => setShowDialog(false)} className="btn-ghost p-1.5">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Project Title <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  placeholder="e.g. AI Tools Deep Dive Series"
                  className="input-base"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Content Type
                </label>
                <select
                  value={form.content_type}
                  onChange={(e) => setForm((f) => ({ ...f, content_type: e.target.value }))}
                  className="input-base"
                >
                  {CONTENT_TYPES.map((ct) => (
                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Objective <span className="text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>(optional)</span>
                </label>
                <textarea
                  value={form.objective}
                  onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
                  placeholder="What do you want this content to achieve?"
                  rows={2}
                  className="input-base resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDialog(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={creating || !form.title.trim()} className="btn-primary flex-1 justify-center" style={{ opacity: creating || !form.title.trim() ? 0.6 : 1 }}>
                  {creating ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
