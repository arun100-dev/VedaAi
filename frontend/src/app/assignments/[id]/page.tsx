'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, Download, Printer, Sparkles, CheckCircle, Loader2, AlertCircle, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import Link from 'next/link';
import AppShell from '../../../components/layout/AppShell';
import Header from '../../../components/layout/Header';
import { useAssignmentStore } from '../../../store/assignmentStore';
import { useAuthStore } from '../../../store/authStore';
import { assignmentApi } from '../../../lib/api';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { Assignment, GeneratedPaper, Question } from '../../../types';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

function DifficultyBadge({ difficulty }: { difficulty: Question['difficulty'] }) {
  const map = {
    easy: { cls: 'badge-easy', label: 'Easy' },
    medium: { cls: 'badge-medium', label: 'Moderate' },
    hard: { cls: 'badge-hard', label: 'Hard' },
  };
  const { cls, label } = map[difficulty] || map.medium;
  return <span className={cls}>{label}</span>;
}

function GeneratingScreen({ progress, message }: { progress: number; message: string }) {
  const steps = [
    'Preparing your prompt...',
    'Connecting to GPT-4 Turbo...',
    'Generating questions...',
    'Applying difficulty distribution...',
    'Building answer key...',
    'Structuring question paper...',
    'Finalising output...',
  ];
  const stepIdx = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1);

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-24 px-6 page-enter">
      <div className="relative w-36 h-36 mb-10">
        {[0, 1, 2].map(i => (
          <div key={i} className="absolute inset-0 rounded-full"
            style={{ border: `1.5px solid rgba(249,115,22,${0.3 - i * 0.08})`, animation: `spin ${6 + i * 3}s linear infinite ${i % 2 ? 'reverse' : ''}` }} />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea6c0a)', boxShadow: '0 0 30px rgba(249,115,22,0.4)' }}>
            <Sparkles size={24} className="text-white animate-pulse" />
          </div>
        </div>
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--ink-primary)', letterSpacing: '-0.03em' }}>
        Generating your question paper
      </h2>
      <p className="text-sm mb-8" style={{ color: 'var(--ink-muted)' }}>
        GPT-4 is crafting structured, curriculum-aligned questions
      </p>
      <div className="w-full max-w-xs mb-3">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.max(progress, 5)}%` }} />
        </div>
      </div>
      <p className="text-xs font-mono font-medium mb-8" style={{ color: 'var(--brand)' }}>{progress}%</p>
      <div className="space-y-2.5 w-full max-w-xs">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-xs transition-all duration-300"
            style={{ color: i < stepIdx ? 'var(--ink-muted)' : i === stepIdx ? 'var(--ink-primary)' : 'var(--ink-faint)' }}>
            {i < stepIdx ? (
              <CheckCircle size={12} style={{ color: '#4ade80', flexShrink: 0 }} />
            ) : i === stepIdx ? (
              <Loader2 size={12} className="animate-spin flex-shrink-0" style={{ color: 'var(--brand)' }} />
            ) : (
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ border: '1.5px solid var(--ink-faint)' }} />
            )}
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionPaper({ paper, assignmentTitle, onRegenerate, regenerating, userSchool }: {
  paper: GeneratedPaper; assignmentTitle: string;
  onRegenerate: () => void; regenerating: boolean;
  userSchool?: string;
}) {
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [section, setSection] = useState('');
  const paperRef = useRef<HTMLDivElement>(null);

  const totalQ = paper.sections.reduce((s, sec) => s + sec.questions.length, 0);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    try {
      toast.loading('Preparing PDF...', { id: 'pdf' });
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const el = paperRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const w = pdf.internal.pageSize.getWidth();
      const ratio = canvas.height / canvas.width;
      const pageH = pdf.internal.pageSize.getHeight();
      let imgH = w * ratio;
      let position = 0;
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, w, imgH);
      // Multi-page support
      while (imgH > pageH) {
        position -= pageH;
        imgH -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, w, w * ratio);
      }
      pdf.save(`${assignmentTitle.replace(/\s+/g, '_')}_QuestionPaper.pdf`);
      toast.success('PDF downloaded!', { id: 'pdf' });
    } catch (e) {
      toast.error('PDF generation failed', { id: 'pdf' });
    }
  };

  return (
    <div className="page-enter">
      {/* Action bar */}
      <div className="flex items-center justify-between mb-5 p-4 rounded-2xl no-print"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(74,222,128,0.1)' }}>
            <CheckCircle size={16} style={{ color: '#4ade80' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>Paper generated successfully</p>
            <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
              {paper.sections.length} sections · {totalQ} questions · {paper.totalMarks} marks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRegenerate} disabled={regenerating}
            className="btn-ghost text-xs py-2 px-3 gap-1.5 disabled:opacity-50">
            <RefreshCw size={13} className={regenerating ? 'animate-spin' : ''} />
            Regenerate
          </button>
          <button onClick={handlePrint} className="btn-ghost text-xs py-2 px-3 gap-1.5">
            <Printer size={13} /> Print
          </button>
          <button onClick={handleDownloadPDF} className="btn-primary text-xs py-2 px-3 gap-1.5">
            <Download size={13} /> Download PDF
          </button>
        </div>
      </div>

      {/* Difficulty legend */}
      <div className="flex items-center gap-3 mb-4 no-print">
        <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>Difficulty:</span>
        <span className="badge-easy">Easy</span>
        <span className="badge-medium">Moderate</span>
        <span className="badge-hard">Hard</span>
        <span className="text-xs ml-auto" style={{ color: 'var(--ink-muted)' }}>
          Distribution: 30% Easy · 50% Medium · 20% Hard
        </span>
      </div>

      {/* THE PAPER */}
      <div ref={paperRef} className="print-paper rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#ffffff' }}>

        {/* Header */}
        <div className="text-center py-8 px-10" style={{ borderBottom: '2.5px solid #1a1a2e' }}>
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
            {userSchool || paper.schoolName || 'Delhi Public School'}
          </h1>
          <div className="flex justify-center items-center gap-8 mt-3">
            <p className="text-sm font-semibold text-gray-700">Subject: <span className="font-bold">{paper.subject}</span></p>
            <p className="text-sm font-semibold text-gray-700">Class: <span className="font-bold">{paper.className}</span></p>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between px-10 py-3"
          style={{ borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
          <p className="text-sm font-medium text-gray-700">Time Allowed: <strong>{paper.timeAllowed}</strong></p>
          <p className="text-sm font-medium text-gray-700">Maximum Marks: <strong>{paper.totalMarks}</strong></p>
        </div>

        {/* General instructions */}
        {paper.instructions?.length > 0 && (
          <div className="px-10 py-4" style={{ borderBottom: '1px solid #e5e7eb', background: '#fffbf5' }}>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">General Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              {paper.instructions.map((inst, i) => (
                <li key={i} className="text-sm text-gray-700">{inst}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Student info */}
        <div className="px-10 py-5" style={{ borderBottom: '2px solid #1a1a2e' }}>
          <div className="grid grid-cols-3 gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Name</span>
              <div className="flex items-center gap-2">
                <input value={studentName} onChange={e => setStudentName(e.target.value)}
                  className="flex-1 border-b-2 border-gray-400 bg-transparent text-sm text-gray-900 outline-none pb-0.5 focus:border-gray-700"
                  placeholder="________________________" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Roll Number</span>
              <input value={rollNumber} onChange={e => setRollNumber(e.target.value)}
                className="border-b-2 border-gray-400 bg-transparent text-sm text-gray-900 outline-none pb-0.5 focus:border-gray-700"
                placeholder="____________" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Section</span>
              <input value={section} onChange={e => setSection(e.target.value)}
                className="border-b-2 border-gray-400 bg-transparent text-sm text-gray-900 outline-none pb-0.5 focus:border-gray-700"
                placeholder="______" />
            </div>
          </div>
        </div>

        {/* Sections */}
        {paper.sections.map((sec, si) => (
          <div key={sec.id} style={{ borderBottom: si < paper.sections.length - 1 ? '1.5px solid #d1d5db' : 'none' }}>
            {/* Section header */}
            <div className="px-10 pt-6 pb-3 text-center" style={{ background: '#f8f9fa' }}>
              <h2 className="text-base font-bold text-gray-900 uppercase tracking-widest">{sec.title}</h2>
              <p className="text-sm italic text-gray-600 mt-1">{sec.instruction}</p>
              <p className="text-xs font-semibold text-gray-500 mt-1">
                [{sec.questionType} — {sec.questions.length} Question{sec.questions.length !== 1 ? 's' : ''} — {sec.totalMarks} Marks]
              </p>
            </div>

            {/* Questions */}
            <div className="px-10 py-4 space-y-4">
              {sec.questions.map((q, qi) => (
                <div key={q.id} className="flex gap-3">
                  <span className="text-sm font-bold text-gray-800 flex-shrink-0 mt-0.5 w-6">{qi + 1}.</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm text-gray-800 leading-relaxed flex-1">{q.text}</p>
                      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                        {/* Difficulty badge — shown digitally */}
                        <span className={clsx(
                          'no-print text-[10px] font-bold px-2 py-0.5 rounded-full',
                          q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                        )}>
                          {q.difficulty === 'easy' ? 'Easy' : q.difficulty === 'medium' ? 'Moderate' : 'Hard'}
                        </span>
                        <span className="text-xs font-bold text-gray-600 whitespace-nowrap">
                          [{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* End marker */}
        <div className="px-10 py-4 text-center font-semibold text-gray-700 text-sm"
          style={{ borderTop: '2.5px solid #1a1a2e', background: '#fafafa' }}>
          *** End of Question Paper ***
        </div>

        {/* Answer key — toggleable */}
        <AnimatePresence>
          {showAnswerKey && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
              style={{ borderTop: '2px dashed #9ca3af' }}>
              <div className="px-10 py-6" style={{ background: '#f0fdf4' }}>
                <h2 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wide">Answer Key</h2>
                {paper.sections.map((sec, si) => (
                  <div key={sec.id} className="mb-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">{sec.title}</h3>
                    <div className="space-y-3">
                      {sec.questions.map((q, qi) => (
                        <div key={q.id} className="flex gap-3 text-sm">
                          <span className="font-bold text-gray-700 flex-shrink-0 w-6">{qi + 1}.</span>
                          <p className="text-gray-600 leading-relaxed">{q.answer || 'Refer to textbook.'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle answer key */}
      <div className="mt-4 flex justify-center gap-3 no-print">
        <button onClick={() => setShowAnswerKey(!showAnswerKey)} className="btn-ghost gap-2 text-sm">
          {showAnswerKey ? <><ChevronUp size={15} /> Hide Answer Key</> : <><ChevronDown size={15} /> Show Answer Key</>}
        </button>
      </div>
    </div>
  );
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { subscribe } = useWebSocket(params.id as string);
  const { jobStatus, setJobStatus } = useAssignmentStore();
  const { user } = useAuthStore();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const pollRef = useRef<NodeJS.Timeout>();
  const isGenerating = searchParams.get('generating') === 'true';

  const fetchAssignment = async () => {
    try {
      const res = await assignmentApi.get(params.id as string);
      setAssignment(res.data);
      return res.data as Assignment;
    } catch {
      toast.error('Assignment not found');
      router.push('/assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignment();
    if (isGenerating) {
      pollRef.current = setInterval(async () => {
        const a = await fetchAssignment();
        if (a && (a.status === 'completed' || a.status === 'failed')) {
          clearInterval(pollRef.current);
          if (a.status === 'completed') {
            toast.success('Question paper is ready!');
            router.replace(`/assignments/${params.id}`);
          }
        }
      }, 2500);
    }
    return () => clearInterval(pollRef.current);
  }, [params.id]);

  useEffect(() => {
    if (jobStatus?.status === 'completed' && jobStatus.assignmentId === params.id) {
      clearInterval(pollRef.current);
      fetchAssignment();
      setJobStatus(null);
    }
  }, [jobStatus]);

  const handleRegenerate = async () => {
    if (!assignment) return;
    setRegenerating(true);
    try {
      await assignmentApi.regenerate(assignment._id);
      toast.success('Regenerating paper...');
      router.push(`/assignments/${assignment._id}?generating=true`);
    } catch {
      toast.error('Failed to regenerate');
    } finally {
      setRegenerating(false);
    }
  };

  const progress = jobStatus?.assignmentId === params.id ? jobStatus.progress : 0;
  const isProcessing = assignment?.status === 'processing' || assignment?.status === 'pending' || isGenerating;

  if (loading) {
    return (
      <AppShell>
        <Header breadcrumbs={[{ label: 'Assignments', href: '/assignments' }, { label: '...' }]} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--brand)' }} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header
        breadcrumbs={[{ label: 'Assignments', href: '/assignments' }, { label: assignment?.title || '...' }]}
        actions={assignment?.status === 'completed' ? (
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>✓ Ready</span>
        ) : null}
      />
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {isProcessing && <GeneratingScreen progress={progress} message={jobStatus?.message || 'Generating...'} />}
        {assignment?.status === 'failed' && (
          <div className="flex flex-col items-center justify-center py-24 page-enter">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(248,113,113,0.1)' }}>
              <AlertCircle size={24} style={{ color: '#f87171' }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--ink-primary)' }}>Generation failed</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>Something went wrong. Please try regenerating.</p>
            <button onClick={handleRegenerate} className="btn-primary">
              <RefreshCw size={15} /> Try Again
            </button>
          </div>
        )}
        {assignment?.status === 'completed' && assignment.generatedPaper && (
          <QuestionPaper paper={assignment.generatedPaper} assignmentTitle={assignment.title}
            onRegenerate={handleRegenerate} regenerating={regenerating}
            userSchool={user?.school} />
        )}
      </div>
    </AppShell>
  );
}
