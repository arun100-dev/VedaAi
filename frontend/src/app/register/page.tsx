'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import ThemeToggle from '../../components/ui/ThemeToggle';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', school: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: '' }));
    clearError();
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(form.name, form.email, form.password, form.school);
      toast.success('Welcome to VedaAI! 🎉');
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

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #0a0a12 0%, #1a1a2e 60%, #0d1b2a 100%)' }}>
        <div className="absolute top-1/3 right-1/3 w-72 h-72 rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea6c0a)' }}>
              <Sparkles size={22} className="text-white" />
            </div>
            <span className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.04em' }}>VedaAI</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4" style={{ letterSpacing: '-0.04em', lineHeight: 1.2 }}>
            Join thousands of<br />educators worldwide
          </h2>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            Start creating AI-powered assessments. Free forever.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[['10k+', 'Teachers'], ['500k+', 'Papers'], ['Free', 'Forever']].map(([val, label]) => (
              <div key={label} className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-2xl font-bold text-white">{val}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md py-8">

          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea6c0a)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--ink-primary)' }}>VedaAI</span>
          </div>

          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--ink-primary)', letterSpacing: '-0.04em' }}>
            Create your account
          </h1>
          <p className="mb-8 text-sm" style={{ color: 'var(--ink-muted)' }}>Start generating AI assessments for free</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#ef4444' }}>
              <span className="flex-1">{error}</span>
              <button type="button" onClick={clearError} className="text-xs opacity-60 hover:opacity-100">✕</button>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: 'var(--ink-secondary)' }}>Full Name *</label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.name ? '#ef4444' : 'var(--input-border)',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = errors.name ? '#ef4444' : 'var(--input-border)'; e.target.style.boxShadow = 'none'; }}
              />
              {errors.name && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: 'var(--ink-secondary)' }}>Email *</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="teacher@school.edu"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.email ? '#ef4444' : 'var(--input-border)',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = errors.email ? '#ef4444' : 'var(--input-border)'; e.target.style.boxShadow = 'none'; }}
              />
              {errors.email && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email}</p>}
            </div>

            {/* School */}
            <div>
              <label htmlFor="reg-school" className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: 'var(--ink-secondary)' }}>School / Institution</label>
              <input
                id="reg-school"
                type="text"
                autoComplete="organization"
                placeholder="e.g. Delhi Public School, Bokaro"
                value={form.school}
                onChange={e => update('school', e.target.value)}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--input-border)'; e.target.style.boxShadow = 'none'; }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
                This will appear on your generated question papers
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: 'var(--ink-secondary)' }}>Password *</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  style={{
                    ...inputStyle,
                    paddingRight: '2.5rem',
                    borderColor: errors.password ? '#ef4444' : 'var(--input-border)',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = errors.password ? '#ef4444' : 'var(--input-border)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.password}</p>}
            </div>

            <button type="submit" disabled={isLoading}
              className="btn-primary w-full justify-center py-3 text-base mt-2">
              {isLoading
                ? <Loader2 size={18} className="animate-spin" />
                : <><span>Create Account</span><ArrowRight size={16} /></>
              }
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: 'var(--ink-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold" style={{ color: 'var(--brand)' }}>Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
