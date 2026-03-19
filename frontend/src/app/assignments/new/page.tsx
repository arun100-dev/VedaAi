'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Plus, X, ChevronLeft, ChevronRight, Minus, Upload, FileText, Sparkles, Calendar, BookOpen, GraduationCap, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import AppShell from '../../../components/layout/AppShell';
import Header from '../../../components/layout/Header';
import { useAssignmentStore } from '../../../store/assignmentStore';
import { assignmentApi } from '../../../lib/api';
import { QUESTION_TYPE_OPTIONS } from '../../../types';
import { useWebSocket } from '../../../hooks/useWebSocket';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

// ── Sub-components ──────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider"
      style={{ color: 'var(--ink-secondary)' }}>
      {children}
      {required && <span className="ml-1" style={{ color: 'var(--brand)' }}>*</span>}
    </label>
  );
}

function FormCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-2xl p-6', className)}
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { subscribe } = useWebSocket();
  const {
    formData, updateFormData, addQuestionType, removeQuestionType,
    updateQuestionType, resetForm, setJobStatus, jobStatus, setCurrentAssignment,
  } = useAssignmentStore();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // File drop
  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const text = await file.text();
      updateFormData({ file, fileName: file.name, fileContent: text.slice(0, 5000) });
      toast.success(`${file.name} uploaded`);
    } catch {
      toast.error('Failed to read file');
    } finally {
      setUploadingFile(false);
    }
  }, [updateFormData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  // Validation
  function validate() {
    const e: Record<string, string> = {};
    if (!formData.title.trim()) e.title = 'Title is required';
    if (!formData.subject.trim()) e.subject = 'Subject is required';
    if (!formData.className.trim()) e.className = 'Class is required';
    if (!formData.dueDate) e.dueDate = 'Due date is required';
    if (new Date(formData.dueDate) < new Date()) e.dueDate = 'Due date must be in the future';
    formData.questionTypes.forEach((qt, i) => {
      if (!qt.type) e[`qt_type_${i}`] = 'Type required';
      if (qt.numberOfQuestions < 1) e[`qt_num_${i}`] = 'Min 1 question';
      if (qt.marksPerQuestion < 1) e[`qt_marks_${i}`] = 'Min 1 mark';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) {
      toast.error('Please fix the errors above');
      return;
    }
    setSubmitting(true);
    try {
      const res = await assignmentApi.create(formData);
      const { assignmentId, jobId } = res.data;

      setJobStatus({
        jobId, assignmentId,
        status: 'waiting', progress: 0,
        message: 'Job queued...',
      });

      subscribe(assignmentId);
      toast.success('Assignment created! Generating your paper...');
      resetForm();
      router.push(`/assignments/${assignmentId}?generating=true`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
      setSubmitting(false);
    }
  }

  const totalQuestions = formData.questionTypes.reduce((s, qt) => s + qt.numberOfQuestions, 0);
  const totalMarks = formData.questionTypes.reduce((s, qt) => s + qt.numberOfQuestions * qt.marksPerQuestion, 0);

  return (
    <AppShell>
      <Header
        breadcrumbs={[
          { label: 'Assignments', href: '/assignments' },
          { label: 'Create Assignment' },
        ]}
      />

      <div className="flex-1 p-6 page-enter max-w-3xl mx-auto w-full">
        {/* Hero header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea6c0a)' }}>
              <Sparkles size={15} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--ink-primary)', letterSpacing: '-0.04em' }}>
              Create Assignment
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
            Set up a new AI-powered assignment for your students.
          </p>
        </div>

        <div className="space-y-5">
          {/* ── Assignment Details ── */}
          <FormCard>
            <div className="flex items-center gap-2.5 mb-5 pb-4"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--brand-dim)' }}>
                <BookOpen size={13} style={{ color: 'var(--brand)' }} />
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>Assignment Details</h2>
                <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>Basic information about your assignment</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Title */}
              <div>
                <FieldLabel required>Assignment Title</FieldLabel>
                <input
                  className={clsx('input-field', errors.title && 'border-red-500/50')}
                  placeholder="e.g. Quiz on Electricity"
                  value={formData.title}
                  onChange={e => { updateFormData({ title: e.target.value }); setErrors(p => ({ ...p, title: '' })); }}
                />
                {errors.title && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Subject */}
                <div>
                  <FieldLabel required>Subject</FieldLabel>
                  <input
                    className={clsx('input-field', errors.subject && 'border-red-500/50')}
                    placeholder="e.g. Science"
                    value={formData.subject}
                    onChange={e => { updateFormData({ subject: e.target.value }); setErrors(p => ({ ...p, subject: '' })); }}
                  />
                  {errors.subject && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.subject}</p>}
                </div>

                {/* Class */}
                <div>
                  <FieldLabel required>Class / Grade</FieldLabel>
                  <div className="relative">
                    <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--ink-muted)' }} />
                    <input
                      className={clsx('input-field pl-9', errors.className && 'border-red-500/50')}
                      placeholder="e.g. 8th, Grade 10"
                      value={formData.className}
                      onChange={e => { updateFormData({ className: e.target.value }); setErrors(p => ({ ...p, className: '' })); }}
                    />
                  </div>
                  {errors.className && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.className}</p>}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <FieldLabel required>Due Date</FieldLabel>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--ink-muted)' }} />
                  <input
                    type="date"
                    className={clsx('input-field pl-9', errors.dueDate && 'border-red-500/50')}
                    value={formData.dueDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => { updateFormData({ dueDate: e.target.value }); setErrors(p => ({ ...p, dueDate: '' })); }}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                {errors.dueDate && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.dueDate}</p>}
              </div>

              {/* File Upload */}
              <div>
                <FieldLabel>Reference Material <span className="font-normal normal-case ml-1" style={{ color: 'var(--ink-muted)' }}>(optional)</span></FieldLabel>
                <div
                  {...getRootProps()}
                  className={clsx(
                    'relative rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center cursor-pointer transition-all',
                    isDragActive ? 'border-brand-500 bg-brand-500/5' : 'border-surface-5 hover:border-brand-500/50'
                  )}
                  style={{ minHeight: '100px' }}
                >
                  <input {...getInputProps()} />
                  {formData.fileName ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(249,115,22,0.1)' }}>
                        <FileText size={18} style={{ color: 'var(--brand)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>{formData.fileName}</p>
                        <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Click to change file</p>
                      </div>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); updateFormData({ file: null, fileName: '', fileContent: '' }); }}
                        className="ml-4 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--surface-4)', color: 'var(--ink-secondary)' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : uploadingFile ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" style={{ color: 'var(--brand)' }} />
                      <span className="text-sm" style={{ color: 'var(--ink-secondary)' }}>Reading file...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                        style={{ background: 'var(--surface-3)' }}>
                        <Upload size={18} style={{ color: 'var(--ink-muted)' }} />
                      </div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--ink-secondary)' }}>
                        {isDragActive ? 'Drop to upload' : 'Choose a file or drag & drop it here'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>PDF, TXT – up to 10MB</p>
                      <button type="button" className="btn-ghost mt-3 text-xs py-1.5 px-3">
                        Browse Files
                      </button>
                    </>
                  )}
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--ink-muted)' }}>
                  Upload reference material to generate more accurate, topic-specific questions.
                </p>
              </div>
            </div>
          </FormCard>

          {/* ── Question Types ── */}
          <FormCard>
            <div className="flex items-center justify-between mb-5 pb-4"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--brand-dim)' }}>
                  <FileText size={13} style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>Question Types</h2>
                  <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>Configure sections and marks</p>
                </div>
              </div>
              {/* Totals pill */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'var(--surface-4)', color: 'var(--ink-secondary)' }}>
                  {totalQuestions}Q
                </span>
                <span className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}>
                  {totalMarks}M total
                </span>
              </div>
            </div>

            {/* Column headers */}
            <div className="grid items-center mb-2 text-[11px] font-semibold uppercase tracking-wider px-1"
              style={{ color: 'var(--ink-muted)', gridTemplateColumns: '1fr 120px 120px 28px' }}>
              <span>Type</span>
              <span className="text-center">Questions</span>
              <span className="text-center">Marks each</span>
              <span />
            </div>

            <div className="space-y-2.5">
              <AnimatePresence>
                {formData.questionTypes.map((qt, i) => (
                  <motion.div
                    key={qt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    className="grid items-center gap-2"
                    style={{ gridTemplateColumns: '1fr 120px 120px 28px' }}
                  >
                    {/* Type selector */}
                    <select
                      className="input-field py-2 text-sm"
                      value={qt.type}
                      onChange={e => updateQuestionType(qt.id, { type: e.target.value })}
                      style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235c5c7a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}
                    >
                      {QUESTION_TYPE_OPTIONS.map(opt => (
                        <option key={opt} value={opt} style={{ background: '#1e1e2e' }}>{opt}</option>
                      ))}
                    </select>

                    {/* Num Questions */}
                    <div className="flex items-center rounded-xl overflow-hidden"
                      style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                      <button type="button"
                        className="w-8 h-9 flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{ color: 'var(--ink-muted)' }}
                        onMouseOver={e => (e.currentTarget.style.background = 'var(--surface-4)')}
                        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => updateQuestionType(qt.id, { numberOfQuestions: Math.max(1, qt.numberOfQuestions - 1) })}>
                        <Minus size={12} />
                      </button>
                      <input
                        type="number" min={1} max={50}
                        className="flex-1 bg-transparent text-center text-sm font-semibold outline-none w-0"
                        style={{ color: 'var(--ink-primary)' }}
                        value={qt.numberOfQuestions}
                        onChange={e => {
                          const v = parseInt(e.target.value);
                          if (!isNaN(v) && v >= 1) updateQuestionType(qt.id, { numberOfQuestions: v });
                        }}
                      />
                      <button type="button"
                        className="w-8 h-9 flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{ color: 'var(--ink-muted)' }}
                        onMouseOver={e => (e.currentTarget.style.background = 'var(--surface-4)')}
                        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => updateQuestionType(qt.id, { numberOfQuestions: Math.min(50, qt.numberOfQuestions + 1) })}>
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Marks */}
                    <div className="flex items-center rounded-xl overflow-hidden"
                      style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                      <button type="button"
                        className="w-8 h-9 flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{ color: 'var(--ink-muted)' }}
                        onMouseOver={e => (e.currentTarget.style.background = 'var(--surface-4)')}
                        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => updateQuestionType(qt.id, { marksPerQuestion: Math.max(1, qt.marksPerQuestion - 1) })}>
                        <Minus size={12} />
                      </button>
                      <input
                        type="number" min={1} max={100}
                        className="flex-1 bg-transparent text-center text-sm font-semibold outline-none w-0"
                        style={{ color: 'var(--ink-primary)' }}
                        value={qt.marksPerQuestion}
                        onChange={e => {
                          const v = parseInt(e.target.value);
                          if (!isNaN(v) && v >= 1) updateQuestionType(qt.id, { marksPerQuestion: v });
                        }}
                      />
                      <button type="button"
                        className="w-8 h-9 flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{ color: 'var(--ink-muted)' }}
                        onMouseOver={e => (e.currentTarget.style.background = 'var(--surface-4)')}
                        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => updateQuestionType(qt.id, { marksPerQuestion: Math.min(100, qt.marksPerQuestion + 1) })}>
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Remove */}
                    {formData.questionTypes.length > 1 && (
                      <button type="button"
                        onClick={() => removeQuestionType(qt.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{ color: 'var(--ink-muted)', border: '1px solid var(--border)' }}
                        onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(248,113,113,0.3)'; }}
                        onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add section */}
            <button
              type="button"
              onClick={addQuestionType}
              className="flex items-center gap-2 mt-4 text-sm font-medium transition-colors"
              style={{ color: 'var(--brand)' }}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'var(--brand-dim)' }}>
                <Plus size={12} />
              </div>
              Add Question Type
            </button>

            {/* Summary footer */}
            <div className="mt-5 pt-4 flex justify-end gap-6"
              style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Total Questions: <strong style={{ color: 'var(--ink-primary)' }}>{totalQuestions}</strong>
              </span>
              <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Total Marks: <strong style={{ color: 'var(--brand)' }}>{totalMarks}</strong>
              </span>
            </div>
          </FormCard>

          {/* ── Additional Instructions ── */}
          <FormCard>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--brand-dim)' }}>
                <MessageSquare size={13} style={{ color: 'var(--brand)' }} />
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>Additional Instructions</h2>
                <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>For better AI output (optional)</p>
              </div>
            </div>
            <textarea
              className="input-field resize-none text-sm"
              rows={3}
              placeholder="e.g. Generate a question paper for a 45-minute exam. Focus on NCERT chapters 3-5. Include 2 diagram-based questions..."
              value={formData.additionalInstructions}
              onChange={e => updateFormData({ additionalInstructions: e.target.value })}
            />
          </FormCard>

          {/* ── Footer buttons ── */}
          <div className="flex items-center justify-between py-2">
            <button
              type="button"
              onClick={() => { resetForm(); router.push('/assignments'); }}
              className="btn-ghost"
            >
              <ChevronLeft size={15} /> Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary px-8 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Generate with AI
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
