'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Columns, PanelRight, Plus, Video, Camera } from 'lucide-react';
import Link from 'next/link';
import type { CalendarView, PlatformFilter, StatusFilter } from './CalendarShell';
import Icon from '@/components/ui/AppIcon';


const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface Props {
  view: CalendarView;
  setView: (v: CalendarView) => void;
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  platformFilter: PlatformFilter;
  setPlatformFilter: (f: PlatformFilter) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (f: StatusFilter) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
}

const statusOptions: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'idea', label: 'Idea' },
  { id: 'draft', label: 'Draft' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'published', label: 'Published' },
];

export default function CalendarHeader({
  view, setView, currentDate, setCurrentDate,
  platformFilter, setPlatformFilter,
  statusFilter, setStatusFilter,
  sidebarOpen, setSidebarOpen,
}: Props) {
  const navigate = (dir: -1 | 1) => {
    const d = new Date(currentDate);
    if (view === 'month') {
      d.setMonth(d.getMonth() + dir);
    } else {
      d.setDate(d.getDate() + dir * 7);
    }
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date(2026, 8, 5));

  return (
    <div
      className="flex flex-wrap items-center gap-3 px-5 py-3 border-b"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
          aria-label="Previous"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          onClick={goToday}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          Today
        </button>
        <button
          onClick={() => navigate(1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
          aria-label="Next"
        >
          <ChevronRight size={15} />
        </button>
        <h2 className="text-base font-semibold ml-1" style={{ color: 'var(--foreground)' }}>
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--muted)' }}>
        {([
          { id: 'month' as CalendarView, icon: LayoutGrid, label: 'Month' },
          { id: 'week' as CalendarView, icon: Columns, label: 'Week' },
        ]).map((v) => {
          const Icon = v.icon;
          return (
            <button
              key={`view-${v.id}`}
              onClick={() => setView(v.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
              style={{
                background: view === v.id ? 'var(--card)' : 'transparent',
                color: view === v.id ? 'var(--foreground)' : 'var(--muted-foreground)',
                border: view === v.id ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              <Icon size={13} />
              {v.label}
            </button>
          );
        })}
      </div>

      {/* Platform filter */}
      <div className="flex items-center gap-1">
        {([
          { id: 'all' as PlatformFilter, label: 'All' },
          { id: 'youtube' as PlatformFilter, label: 'YouTube', icon: Video, color: '#a78bfa' },
          { id: 'instagram' as PlatformFilter, label: 'Instagram', icon: Camera, color: '#f472b6' },
        ]).map((p) => {
          const Icon = 'icon' in p ? p.icon : null;
          const active = platformFilter === p.id;
          return (
            <button
              key={`pf-${p.id}`}
              onClick={() => setPlatformFilter(p.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
              style={{
                background: active ? ('color' in p ? `${p.color}15` : 'rgba(167,139,250,0.1)') : 'transparent',
                color: active ? ('color' in p ? p.color : 'var(--primary)') : 'var(--muted-foreground)',
                border: `1px solid ${active ? ('color' in p ? `${p.color}40` : 'rgba(167,139,250,0.3)') : 'transparent'}`,
              }}
            >
              {Icon && <Icon size={11} />}
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1">
        {statusOptions.map((s) => {
          const active = statusFilter === s.id;
          return (
            <button
              key={`sf-${s.id}`}
              onClick={() => setStatusFilter(s.id)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
              style={{
                background: active ? 'rgba(167,139,250,0.1)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--muted-foreground)',
                border: `1px solid ${active ? 'rgba(167,139,250,0.2)' : 'transparent'}`,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
          style={{
            background: sidebarOpen ? 'rgba(167,139,250,0.1)' : 'var(--muted)',
            border: `1px solid ${sidebarOpen ? 'rgba(167,139,250,0.2)' : 'var(--border)'}`,
            color: sidebarOpen ? 'var(--primary)' : 'var(--muted-foreground)',
          }}
          title="Toggle drafts sidebar"
        >
          <PanelRight size={14} />
        </button>
        <Link href="/content-editor">
          <button className="btn-primary text-xs">
            <Plus size={13} />
            New Post
          </button>
        </Link>
      </div>
    </div>
  );
}