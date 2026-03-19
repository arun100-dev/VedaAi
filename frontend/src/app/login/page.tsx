'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import ThemeToggle from '../../components/ui/ThemeToggle';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error('Please fill all fields'); return; }
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/assignments');
    } catch {}
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--input-bg)',
    border: '1.5px solid var(--input-border)',
    borderRadius: '0.625rem',
    padding: '0.75rem 1rem',
    color: 'var(--input-text)',
    fontFamily: 'Sora, sans-serif',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface-0)' }}>
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>

      {/* Left decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #0a0a12 0%, #1a1a2e 60%, #0d1b2a 100%)' }}>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea6c0a)' }}>
              <Sparkles size={22} className="text-white" />
            </div>
            <span className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.04em' }}>VedaAI</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4" style={{ letterSpacing: '-0.04em', lineHeight: 1.2 }}>
            Create intelligent<br />assessments in seconds
          </h2>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            AI-powered question papers tailored to your curriculum.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-8">
            {['Groq LLaMA Powered', 'PDF Export', 'Real-time', 'Difficulty Tags'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)' }}>
                {f}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="relative z-10 mt-10 w-full max-w-sm rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4ade80' }} />
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Generating paper...</span>
          </div>
          <div className="h-2 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-2 rounded-full" style={{ width: '72%', background: 'linear-gradient(90deg, #f97316, #fb923c)' }} />
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Science · Class 8 · 25Q · 72%</p>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">

          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea6c0a)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--ink-primary)', letterSpacing: '-0.04em' }}>VedaAI</span>
          </div>

          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--ink-primary)', letterSpacing: '-0.04em' }}>
            Welcome back
          </h1>
          <p className="mb-8 text-sm" style={{ color: 'var(--ink-muted)' }}>Sign in to your account to continue</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#ef4444' }}>
              <span className="flex-1">{error}</span>
              <button type="button" onClick={clearError} className="text-xs opacity-60 hover:opacity-100">✕</button>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: 'var(--ink-secondary)' }}>Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="teacher@school.edu"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError(); }}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--input-border)'; e.target.style.boxShadow = 'none'; }}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: 'var(--ink-secondary)' }}>Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearError(); }}
                  style={{ ...inputStyle, paddingRight: '2.5rem' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--input-border)'; e.target.style.boxShadow = 'none'; }}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="btn-primary w-full justify-center py-3 text-base">
              {isLoading
                ? <Loader2 size={18} className="animate-spin" />
                : <><span>Sign In</span><ArrowRight size={16} /></>
              }
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: 'var(--ink-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold" style={{ color: 'var(--brand)' }}>
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
