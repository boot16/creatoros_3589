'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { LayoutDashboard, FolderOpen, TrendingUp, Lightbulb, MessageSquare, FileText, CalendarDays, BookmarkCheck, Settings, ChevronLeft, ChevronRight, Zap, LogOut,  } from 'lucide-react';
import { YoutubeIcon, InstagramIcon } from '@/components/ui/PlatformIcons';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';


interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  group: string;
}

const navItems: NavItem[] = [
  { id: 'nav-dashboard', label: 'Dashboard', href: '/', icon: LayoutDashboard, group: 'workspace' },
  { id: 'nav-projects', label: 'Projects', href: '/projects', icon: FolderOpen, group: 'workspace' },
  { id: 'nav-calendar', label: 'Calendar', href: '/content-calendar', icon: CalendarDays, group: 'workspace' },
  { id: 'nav-scripts', label: 'Scripts', href: '/scripts', icon: FileText, group: 'workspace' },
  { id: 'nav-feed', label: 'Opportunity Feed', href: '/opportunity-feed', icon: TrendingUp, group: 'intelligence' },
  { id: 'nav-trends', label: 'Trend Radar', href: '/trend-radar', icon: TrendingUp, group: 'intelligence' },
  { id: 'nav-ideas', label: 'Idea Lab', href: '/idea-lab', icon: Lightbulb, group: 'intelligence' },
  { id: 'nav-studio', label: 'Studio', href: '/studio', icon: MessageSquare, group: 'intelligence' },
  { id: 'nav-shortlist', label: 'Shortlist', href: '/shortlist', icon: BookmarkCheck, group: 'intelligence' },
  { id: 'nav-settings', label: 'Settings', href: '/settings', icon: Settings, group: 'account' },
];

const groupLabels: Record<string, string> = {
  workspace: 'Workspace',
  intelligence: 'Intelligence',
  account: 'Account',
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [aiCredits, setAiCredits] = useState<{ used: number; limit: number }>({ used: 0, limit: 500 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchCredits = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('user_profiles')
          .select('ai_credits_used, ai_credits_limit')
          .eq('id', user.id)
          .single();
        if (data) {
          setAiCredits({ used: data.ai_credits_used ?? 0, limit: data.ai_credits_limit ?? 500 });
        }
      } catch {}
    };
    fetchCredits();
  }, [user]);

  const groups = Array.from(new Set(navItems.map((i) => i.group)));

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Creator';
  const initials = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch {}
  };

  return (
    <aside
      className="relative flex flex-col h-full transition-all duration-300 ease-in-out"
      style={{
        width: collapsed ? '64px' : '220px',
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b"
        style={{ borderColor: 'var(--border)', minHeight: '64px' }}
      >
        <div className="flex-shrink-0">
          <AppLogo size={28} />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight text-foreground truncate">
            CreatorOS
          </span>
        )}
      </div>

      {/* Channel badges */}
      {!collapsed && (
        <div className="px-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>
            Channels
          </p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(167,139,250,0.07)' }}>
              <YoutubeIcon size={13} className="flex-shrink-0" style={{ color: '#a78bfa' }} />
              <span className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>Connect YouTube</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(244,114,182,0.07)' }}>
              <InstagramIcon size={13} className="flex-shrink-0" style={{ color: '#f472b6' }} />
              <span className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>Connect Instagram</span>
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="px-2 py-2.5 border-b flex flex-col gap-1.5 items-center" style={{ borderColor: 'var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.1)' }}>
            <YoutubeIcon size={13} className="flex-shrink-0" style={{ color: '#a78bfa' }} />
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(244,114,182,0.1)' }}>
            <InstagramIcon size={13} className="flex-shrink-0" style={{ color: '#f472b6' }} />
          </div>
        </div>
      )}

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2">
        {groups.map((group, gi) => (
          <div key={`group-${group}`} className={gi > 0 ? 'mt-3' : ''}>
            {!collapsed && (
              <p className="text-xs font-medium uppercase tracking-widest px-3 mb-1" style={{ color: 'var(--muted-foreground)' }}>
                {groupLabels[group]}
              </p>
            )}
            {navItems
              .filter((item) => item.group === group)
              .map((item) => {
                const Icon = item.icon;
                const isActive = mounted
                  ? item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href) && item.href !== '/'
                  : false;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate text-xs">{item.label}</span>
                        {item.badge != null && (
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.15)', color: 'var(--primary)' }}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>

      {/* AI Credits */}
      {!collapsed && (
        <div className="px-3 py-2.5 mx-2 mb-2 rounded-lg" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Zap size={12} style={{ color: 'var(--primary)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>AI Credits</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
            <div className="h-1.5 rounded-full" style={{ width: `${Math.min((aiCredits.used / aiCredits.limit) * 100, 100)}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }} />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{aiCredits.used} / {aiCredits.limit} used</p>
        </div>
      )}

      {/* User profile + sign out */}
      <div className="flex items-center gap-2.5 px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #7c3aed, #f472b6)', color: '#fff' }}>
          {initials}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{displayName}</p>
              <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)', fontSize: '10px' }}>{user?.email || ''}</p>
            </div>
            <button onClick={handleSignOut} title="Sign out" className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:opacity-80" style={{ color: 'var(--muted-foreground)' }}>
              <LogOut size={13} />
            </button>
          </>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 z-10"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}