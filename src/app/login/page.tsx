'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@creatoros.app');
    setPassword('demo1234');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--background)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <AppLogo size={48} />
          <h1 className="mt-4 text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Welcome back
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Sign in to your CreatorOS workspace
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {/* Demo credentials */}
          <button
            type="button"
            onClick={fillDemo}
            className="w-full mb-6 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-150 text-left"
            style={{
              background: 'rgba(167,139,250,0.08)',
              border: '1px dashed rgba(167,139,250,0.3)',
              color: 'var(--primary)',
            }}
          >
            <span className="font-semibold">Try demo account</span>
            <span style={{ color: 'var(--muted-foreground)' }}>
              {' '}— demo@creatoros.app / demo1234
            </span>
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--foreground)' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
                style={{
                  background: 'var(--input)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--foreground)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 rounded-lg text-sm outline-none transition-all duration-150"
                  style={{
                    background: 'var(--input)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p
                className="text-sm px-3 py-2 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5 mt-2"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium transition-colors"
            style={{ color: 'var(--primary)' }}
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
