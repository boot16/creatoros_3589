'use client';

import React, { useState } from 'react';
import { Search, Bell, Plus, Command } from 'lucide-react';
import Link from 'next/link';

interface TopbarProps {
  pageTitle: string;
  pageSubtitle?: string;
}

export default function Topbar({ pageTitle, pageSubtitle }: TopbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header
      className="flex items-center gap-4 px-6 py-3 border-b"
      style={{
        borderColor: 'var(--border)',
        background: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(12px)',
        minHeight: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold truncate" style={{ color: 'var(--foreground)' }}>
          {pageTitle}
        </h1>
        {pageSubtitle && (
          <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
            {pageSubtitle}
          </p>
        )}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 relative">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150"
          style={{
            background: searchFocused ? 'var(--input)' : 'var(--muted)',
            border: `1px solid ${searchFocused ? 'var(--primary)' : 'var(--border)'}`,
            width: searchFocused ? '280px' : '220px',
            boxShadow: searchFocused ? '0 0 0 3px rgba(167,139,250,0.15)' : 'none',
          }}
        >
          <Search size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
          <input
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: 'var(--foreground)' }}
            placeholder="Search content…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Command size={11} style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>K</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: '#f472b6' }}
          />
        </button>

        <Link href="/content-editor">
          <button className="btn-primary">
            <Plus size={16} />
            <span className="hidden sm:inline">New Content</span>
          </button>
        </Link>
      </div>
    </header>
  );
}