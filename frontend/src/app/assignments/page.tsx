'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Plus, Search, Filter, MoreVertical, Trash2, Eye, Calendar, FileText, Sparkles, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import Header from '../../components/layout/Header';
import { useAssignmentStore } from '../../store/assignmentStore';
import { assignmentApi } from '../../lib/api';
import { Assignment } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { clsx } from 'clsx';

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center flex-1 py-24 px-6"
    >
      {/* Orbital animation */}
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 rounded-full"
          style={{ border: '1px dashed rgba(249,115,22,0.2)' }} />
        <div className="absolute inset-4 rounded-full"
          style={{ border: '1px dashed rgba(249,115,22,0.15)' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--surface-3)', border: '1px solid var(--border-bright)' }}>
            <FileText size={20} style={{ color: 'var(--brand)' }} />
          </div>
        </div>
        {/* Orbiting dot */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 rounded-full"
            style={{ background: 'var(--brand)', boxShadow: '0 0 8px var(--brand)' }} />
        </div>
      </div>

      <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--ink-primary)' }}>
        No assignments yet
      </h3>
      <p className="text-sm text-center max-w-xs mb-8" style={{ color: 'var(--ink-muted)', lineHeight: 1.7 }}>
        Create your first AI-powered assignment to start collecting and grading student submissions.
      </p>
      <Link href="/assignments/new" className="btn-primary">
        <Plus size={15} />
        Create Your First Assignment
      </Link>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: Assignment['status'] }) {
  const map = {
    pending: { icon: Clock, color: '#facc15', bg: 'rgba(234,179,8,0.1)', label: 'Pending' },
    processing: { icon: Loader2, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', label: 'Generating' },
    completed: { icon: CheckCircle, color: '#4ade80', bg: 'rgba(74,222,128,0.1)', label: 'Ready' },
    failed: { icon: XCircle, color: '#f87171', bg: 'rgba(248,113,113,0.1)', label: 'Failed' },
  };
  const { icon: Icon, color, bg, label } = map[status];
  return (
    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: bg, color }}>
      <Icon size={10} className={status === 'processing' ? 'animate-spin' : ''} />
      {label}
    </span>
  );
}

function AssignmentCard({ assignment, onDelete }: { assignment: Assignment; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const totalQ = assignment.questionTypes?.reduce((s, qt) => s + qt.numberOfQuestions, 0) || 0;
  const totalM = assignment.questionTypes?.reduce((s, qt) => s + qt.numberOfQuestions * qt.marksPerQuestion, 0) || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="assignment-card group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={assignment.status} />
          </div>
          <Link href={`/assignments/${assignment._id}`}>
            <h3 className="font-semibold text-sm leading-snug hover:text-brand-400 transition-colors cursor-pointer"
              style={{ color: 'var(--ink-primary)' }}>
              {assignment.title}
            </h3>
          </Link>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
            {assignment.subject} · Class {assignment.className}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--ink-muted)', border: '1px solid var(--border)' }}
          >
            <MoreVertical size={13} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                className="absolute right-0 top-8 w-40 rounded-xl overflow-hidden z-50"
                style={{ background: 'var(--surface-4)', border: '1px solid var(--border-bright)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
              >
                <Link href={`/assignments/${assignment._id}`}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors"
                  style={{ color: 'var(--ink-secondary)' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--surface-5)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => setMenuOpen(false)}>
                  <Eye size={13} /> View Assignment
                </Link>
                <button
                  onClick={() => { onDelete(assignment._id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors"
                  style={{ color: '#f87171' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3"
        style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            <FileText size={10} /> {totalQ}Q · {totalM}M
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          <Calendar size={10} />
          <span>Due {format(new Date(assignment.dueDate), 'dd MMM yyyy')}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function AssignmentsPage() {
  const { assignments, setAssignments, removeAssignment, isLoadingAssignments } = useAssignmentStore();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async (q?: string) => {
    try {
      setLoading(true);
      const res = await assignmentApi.list({ search: q });
      setAssignments(res.data, res.pagination?.total || 0);
    } catch {
      // Use cached store data
    } finally {
      setLoading(false);
    }
  }, [setAssignments]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  useEffect(() => {
    const t = setTimeout(() => fetchAssignments(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchAssignments]);

  const handleDelete = async (id: string) => {
    try {
      await assignmentApi.delete(id);
      removeAssignment(id);
      toast.success('Assignment deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <AppShell>
      <Header
        breadcrumbs={[{ label: 'Assignments' }]}
        actions={
          <Link href="/assignments/new" className="btn-primary text-xs py-2 px-3">
            <Plus size={13} /> New
          </Link>
        }
      />

      <div className="flex-1 p-6 page-enter">
        {/* Page title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="dot-pulse" />
            <h1 className="text-xl font-bold" style={{ color: 'var(--ink-primary)', letterSpacing: '-0.03em' }}>
              Assignments
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
            Manage and create AI-powered assignments for your classes.
          </p>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-muted)' }} />
            <input
              className="input-field pl-9 py-2 text-sm"
              placeholder="Search assignments..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-ghost py-2 text-xs gap-1.5">
            <Filter size={13} /> Filter
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 rounded-2xl shimmer" />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map(a => (
                <AssignmentCard key={a._id} assignment={a} onDelete={handleDelete} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Floating Create FAB */}
      {assignments.length > 0 && (
        <Link href="/assignments/new"
          className="fixed bottom-8 right-8 btn-primary rounded-full px-5 py-3 shadow-2xl glow-brand"
          style={{ zIndex: 50 }}>
          <Plus size={16} />
          Create Assignment
        </Link>
      )}
    </AppShell>
  );
}
