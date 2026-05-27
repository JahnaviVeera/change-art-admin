import { useState, useEffect, useCallback } from 'react';
import { X, Download, Edit2, UserPlus, Send, AlertCircle } from 'lucide-react';
import { cn } from '@lib/utils';
import { type Job, jobImage } from '../mocks/jobs';

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  onConfirmJob?: (job: Job) => void;
  /** Open the edit form for this job (wired to the "Edit Job" footer button). */
  onEdit?: (job: Job) => void;
  /**
   * Render the quote popup (Review & Set Price section, blue step, no Dispatch).
   * Driven by CONTEXT — only the Quotes page/section sets this. Job lists leave
   * it false so a quote-stage job still opens the regular job popup.
   */
  quoteView?: boolean;
}

function buildFlowSteps(hasSewout: boolean): { role: string; sub: string }[] {
  return hasSewout
    ? [
        { role: 'CS',        sub: 'Created'  },
        { role: 'TL',        sub: 'Assigned' },
        { role: 'Execution', sub: ''         },
        { role: 'Sewout',    sub: 'Pending'  },
        { role: 'QC',        sub: 'Review'   },
        { role: 'CS',        sub: 'Dispatch' },
      ]
    : [
        { role: 'CS',        sub: 'Created'  },
        { role: 'TL',        sub: 'Assigned' },
        { role: 'Execution', sub: ''         },
        { role: 'QC',        sub: 'Review'   },
        { role: 'CS',        sub: 'Dispatch' },
      ];
}

function currentStepIndex(job: Job, hasSewout: boolean): number {
  switch (job.stage) {
    case 'quote':     return 0;
    case 'junior':
    case 'senior':    return 2;
    case 'sewout':    return 3;
    case 'qc':        return hasSewout ? 4 : 3;
    case 'delivered': return hasSewout ? 5 : 4;
    default:          return 0;
  }
}

function orderAccent(order: string): string {
  const map: Record<string, string> = {
    Artwork: 'navy', Digitizing: 'teal',
    'Digitizing + Sewout': 'purple', Sewout: 'purple',
  };
  return map[order] ?? 'gray';
}

function statusAccent(status: string): string {
  const map: Record<string, string> = {
    'In QC': 'teal', 'In Production': 'amber', 'Senior Review': 'purple',
    Sewout: 'purple', Delivered: 'green', 'Quote Submitted': 'blue',
    'Quote Approved': 'amber', 'Pending Client Confirm': 'amber',
    Cancelled: 'gray', Amend: 'amber', 'In Review': 'purple',
  };
  return map[status] ?? 'gray';
}

function priorityClass(priority: string): string {
  const map: Record<string, string> = {
    Normal: 'normal', Rush: 'rush', 'Super Rush': 'super-rush',
  };
  return map[priority] ?? 'normal';
}

export function JobDetailModal({ job, onClose, onEdit, quoteView = false }: JobDetailModalProps) {
  const [isIn, setIsIn] = useState(false);
  const [agencyPrice, setAgencyPrice] = useState('');
  const [confirmedEta, setConfirmedEta] = useState('');
  const [noteToClient, setNoteToClient] = useState('');
  const [priceError, setPriceError] = useState(false);

  useEffect(() => {
    if (job) {
      setAgencyPrice('');
      setConfirmedEta(job.etaHours ? String(job.etaHours) : '');
      setNoteToClient('');
      setPriceError(false);
      const raf = requestAnimationFrame(() => setIsIn(true));
      return () => cancelAnimationFrame(raf);
    }
    return undefined;
  }, [job]);

  const handleClose = useCallback(() => {
    setIsIn(false);
    const t = setTimeout(() => onClose(), 220);
    return () => clearTimeout(t);
  }, [onClose]);

  useEffect(() => {
    if (!job) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [job]);

  useEffect(() => {
    if (!job) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [job, handleClose]);

  if (!job) return null;

  const hasSewout  = job.order.includes('Sewout');
  const flowSteps  = buildFlowSteps(hasSewout);
  const stepIdx    = currentStepIndex(job, hasSewout);

  const images = [
    jobImage(job, 0, 560, 420),
    jobImage(job, 1, 560, 420),
    jobImage(job, 2, 560, 420),
  ];

  const clientBudget = job.negotiation?.clientOffer ?? job.clientPrice ?? null;
  const adminCounter = job.negotiation?.agencyOffer ?? job.adminPrice ?? null;
  const agreedPrice  = job.negotiation?.finalPrice ?? job.agreedPrice ?? null;

  const aiOverall = job.aiScore
    ? Math.round((job.aiScore.colour + job.aiScore.align + job.aiScore.res + job.aiScore.brief) / 4)
    : null;
  const aiPass = aiOverall !== null ? aiOverall >= 80 : null;

  // Quote popup is decided by CONTEXT (the Quotes page passes quoteView),
  // NOT by job.stage — otherwise quote-stage jobs in the Jobs lists would
  // wrongly open the quote popup.
  const isQuote = quoteView;

  // Workflow "current" node is blue ONLY on the quote popup; every other
  // popup keeps the original crimson so non-quote popups are unchanged.
  const curBorder = isQuote ? '#2563EB' : '#B22234';
  const curBg     = isQuote ? '#EBF0FA' : '#fff';
  const curGlow   = isQuote ? 'rgba(37,99,235,0.12)' : 'rgba(178,34,52,0.1)';

  const handleSendPrice = () => {
    const n = parseFloat(agencyPrice);
    if (!agencyPrice || !Number.isFinite(n) || n <= 0) {
      setPriceError(true);
      return;
    }
    setPriceError(false);
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: isIn ? 'rgba(15,23,42,0.45)' : 'rgba(15,23,42,0)',
        backdropFilter: isIn ? 'blur(5px)' : 'blur(0px)',
        WebkitBackdropFilter: isIn ? 'blur(5px)' : 'blur(0px)',
        transition: 'all 240ms cubic-bezier(0.16,1,0.3,1)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Job detail: ${job.design}`}
        className="relative w-full max-w-[660px] max-h-[92vh] rounded-2xl flex flex-col overflow-hidden"
        style={{
          background: '#fff',
          boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
          transform: isIn ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.96)',
          opacity: isIn ? 1 : 0,
          transition: 'all 240ms cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── HEADER ── */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4" style={{ borderBottom: '1px solid #E8EDF5' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div
                className="flex items-center gap-2 mb-1.5"
                style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11.5, fontWeight: 700, color: '#B22234', letterSpacing: '0.04em' }}
              >
                <span>{job.id}</span>
                <span style={{ color: '#CBD5E1' }}>•</span>
                <span>{job.ref}</span>
              </div>
              <h2 className="text-[20px] font-extrabold leading-tight" style={{ color: '#0D1B2A' }}>
                {job.design}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className={cn('badge', orderAccent(job.order))}>{job.order}</span>
                <span className={cn('badge', statusAccent(job.status))}>{job.status}</span>
                <span className="badge gray">{job.project}</span>
                <span className={cn('priority-badge', priorityClass(job.priority))}>{job.priority}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition"
              style={{ border: '1px solid #E8EDF5', color: '#94A3B8' }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ background: '#fff' }}>

          {/* JOB IMAGES */}
          <SectionLabel>JOB IMAGES</SectionLabel>
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={i === 0 ? job.design : ''}
                className="w-full rounded-xl object-cover"
                style={{ aspectRatio: '4/3' }}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>

          {/* WORKFLOW STEPPER */}
          <div className="mb-5 relative">
            {/* Background track */}
            <div
              className="absolute"
              style={{ top: 19, left: 19, right: 19, height: 2, background: '#E8EDF5', zIndex: 0 }}
            />
            {/* Progress fill */}
            <div
              className="absolute"
              style={{
                top: 19,
                left: 19,
                width: stepIdx === 0
                  ? 0
                  : `calc(${Math.min(stepIdx, flowSteps.length - 1)} / ${flowSteps.length - 1} * (100% - 38px))`,
                height: 2,
                background: '#B22234',
                zIndex: 0,
                transition: 'width 0.4s ease',
              }}
            />

            <div className="flex items-start relative" style={{ zIndex: 1 }}>
              {flowSteps.map((step, i) => {
                const state = i < stepIdx ? 'done'
                  : i === stepIdx ? 'current'
                  : 'pending';
                const subLabel = i === 2
                  ? (job.etaHours ? `ETA: ${job.etaHours}h` : 'In Progress')
                  : step.sub;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-[38px] h-[38px] rounded-full flex items-center justify-center"
                      style={
                        state === 'done'
                          ? { background: '#B22234', border: '2px solid #B22234' }
                          : state === 'current'
                            ? { background: curBg, border: `2.5px solid ${curBorder}`, boxShadow: `0 0 0 4px ${curGlow}` }
                            : { background: '#fff', border: '2px solid #E2E8F0' }
                      }
                    >
                      {state === 'done' ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : state === 'current' ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={curBorder} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                        </svg>
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#CBD5E1' }} />
                      )}
                    </div>
                    <div className="text-center mt-1.5">
                      <div
                        className="text-[11px] font-bold"
                        style={{ color: state === 'pending' ? '#94A3B8' : '#0D1B2A' }}
                      >
                        {step.role}
                      </div>
                      <div className="text-[10px] font-medium mt-0.5" style={{ color: '#94A3B8' }}>
                        {subLabel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TWO-COLUMN DETAILS */}
          <div
            className="grid grid-cols-2 gap-x-6 mb-5 pt-4"
            style={{ borderTop: '1px solid #E8EDF5' }}
          >
            {/* JOB DETAILS */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.13em] mb-2" style={{ color: '#94A3B8' }}>
                JOB DETAILS
              </div>
              <DetailRow label="Client"      value={job.client} />
              <DetailRow label="Client ID"   value={job.clientId} />
              <DetailRow label="Order Type"  value={job.order} />
              <DetailRow label="Complexity"  value={job.complexity} />
              {job.process ? <DetailRow label="Process" value={job.process} /> : null}
              <DetailRow label="Colors"      value={String(job.colors)} />
              <DetailRow label="Assigned To" value={job.assignedTo ?? 'Unassigned'} />
              {job.subType ? <DetailRow label="Sub-Type" value={job.subType} /> : null}
            </div>

            {/* SPECIFICATIONS */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.13em] mb-2" style={{ color: '#94A3B8' }}>
                SPECIFICATIONS
              </div>
              {job.etaHours ? <DetailRow label="ETA" value={`${job.etaHours}h`} /> : null}
              <DetailRow label="Created"   value={job.created} />
              <DetailRow
                label="Reference"
                value={job.ref}
                valueStyle={{ color: '#B22234', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10.5 }}
              />
              <DetailRow
                label="Client Budget"
                value={clientBudget !== null ? `₹${Number(clientBudget).toLocaleString()}` : 'Not provided'}
              />
              <DetailRow
                label="Admin Counter"
                value={adminCounter !== null ? `₹${Number(adminCounter).toLocaleString()}` : 'None'}
              />
              <DetailRow
                label="Agreed Price"
                value={agreedPrice !== null ? `₹${Number(agreedPrice).toLocaleString()}` : 'Pending'}
              />
              {job.aiScore && aiOverall !== null ? (
                <DetailRow
                  label="AI QC Score"
                  value={`${aiOverall}/100 — ${aiPass ? 'Pass' : 'Fail'}`}
                  valueStyle={{ color: aiPass ? '#059669' : '#DC2626', fontWeight: 700 }}
                />
              ) : null}
            </div>
          </div>

          {/* REVIEW & SET PRICE — quote-stage only */}
          {isQuote ? (
            <div className="mb-5">
              <SectionLabel>REVIEW &amp; SET PRICE</SectionLabel>
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1.5px solid rgba(245,158,11,0.25)' }}
              >
                {/* Budget + Agency price */}
                <div className="flex flex-wrap gap-4 items-start mb-4">
                  <div className="flex-1 min-w-[180px]">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] mb-1" style={{ color: '#94A3B8' }}>
                      Client's Suggested Budget
                    </div>
                    <div
                      className="text-[22px] font-extrabold leading-none"
                      style={{ color: clientBudget != null ? '#059669' : '#94A3B8' }}
                    >
                      {clientBudget != null ? `₹${Number(clientBudget).toLocaleString()}` : 'Not provided'}
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: '#94A3B8' }}>
                      This is a reference only — you set the final price.
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: '#64748B' }}>
                      Agency Price <span style={{ color: '#B22234' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 250"
                      value={agencyPrice}
                      onChange={(e) => { setAgencyPrice(e.target.value); setPriceError(false); }}
                      className="w-full rounded-lg px-3 py-2.5 text-[16px] font-bold outline-none transition border bg-white text-[#0D1B2A] focus:ring-2 focus:ring-[#B22234]/10"
                      style={{ borderColor: priceError ? '#DC2626' : 'rgba(245,158,11,0.45)' }}
                    />
                    <div className="text-[10.5px]" style={{ color: '#94A3B8' }}>
                      This price will be shown to the client for confirmation.
                    </div>
                  </div>
                </div>

                {/* Confirmed ETA */}
                <div className="mb-3">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.08em] mb-1.5" style={{ color: '#64748B' }}>
                    Confirmed ETA (hours) <span style={{ color: '#B22234' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 8"
                    value={confirmedEta}
                    onChange={(e) => setConfirmedEta(e.target.value)}
                    className="rounded-lg px-3 py-2.5 text-[12.5px] outline-none transition border bg-white text-[#0D1B2A] focus:border-[#B22234] focus:ring-2 focus:ring-[#B22234]/10"
                    style={{ maxWidth: 160, borderColor: '#E2E8F0' }}
                  />
                </div>

                {/* Note to client */}
                <div className="mb-3.5">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.08em] mb-1.5" style={{ color: '#64748B' }}>
                    Note to Client{' '}
                    <span className="font-normal lowercase text-[10px]" style={{ color: '#94A3B8' }}>(optional)</span>
                  </label>
                  <textarea
                    placeholder="e.g. Price includes 3 revisions. Delivery in DST + PDF formats. Rush surcharge applied."
                    value={noteToClient}
                    onChange={(e) => setNoteToClient(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-[12.5px] outline-none transition border bg-white text-[#0D1B2A] resize-y focus:border-[#B22234] focus:ring-2 focus:ring-[#B22234]/10"
                    style={{ minHeight: 60, borderColor: '#E2E8F0' }}
                  />
                </div>

                {/* Info callout */}
                <div
                  className="rounded-lg px-3 py-2.5 flex items-start gap-2 mb-3.5"
                  style={{ background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.25)' }}
                >
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#D97706' }} aria-hidden />
                  <span className="text-[11.5px] leading-relaxed" style={{ color: '#92733A' }}>
                    Once you click <strong>Send Price to Client</strong>, the job status changes to{' '}
                    <strong style={{ color: '#D97706' }}>Quote Approved</strong> and the client receives an in-app
                    notification to confirm and start production.
                  </span>
                </div>

                {/* Validation error */}
                {priceError ? (
                  <div
                    className="text-[12px] mb-2.5 px-2.5 py-1.5 rounded-md"
                    style={{ color: '#DC2626', background: 'rgba(220,38,38,0.08)' }}
                  >
                    Please enter a valid agency price before sending.
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex gap-2.5 justify-end">
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: 12, padding: '7px 13px', gap: 6, color: '#DC2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)' }}
                    onClick={handleClose}
                  >
                    <X className="w-3.5 h-3.5" aria-hidden />
                    Reject Quote
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: 12, padding: '7px 13px', gap: 6, color: '#059669', background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.3)' }}
                    onClick={handleSendPrice}
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden />
                    Send Price to Client
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* NOTES / BRIEF */}
          {job.notes ? (
            <div className="mb-5">
              <SectionLabel>NOTES / BRIEF</SectionLabel>
              <div
                className="text-[12.5px] leading-relaxed p-3.5 rounded-xl"
                style={{ background: '#F8FAFC', border: '1px solid #E8EDF5', color: '#475569' }}
              >
                {job.notes}
              </div>
            </div>
          ) : null}

          {/* AI QC REPORT */}
          {job.aiScore ? (
            <div className="mb-2">
              <SectionLabel>AI QC REPORT</SectionLabel>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E8EDF5' }}>
                {/* Badge row */}
                <div
                  className="px-4 pt-3 pb-2.5 flex items-center gap-3"
                  style={{ borderBottom: '1px solid #E8EDF5' }}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(178,34,52,0.10)', color: '#B22234', border: '1px solid rgba(178,34,52,0.18)' }}
                  >
                    AI ANALYSIS
                  </span>
                  <span className="text-[11px]" style={{ color: '#94A3B8' }}>
                    Auto-generated · First-pass reference only
                  </span>
                </div>

                {/* Score bars */}
                <div className="grid grid-cols-5 gap-2 px-4 py-3">
                  <ScoreBar label="COLOUR"     value={job.aiScore.colour} color="#ef4444" />
                  <ScoreBar label="ALIGNMENT"  value={job.aiScore.align}  color="#3b82f6" />
                  <ScoreBar label="RESOLUTION" value={job.aiScore.res}    color="#a855f7" />
                  <ScoreBar label="BRIEF"      value={job.aiScore.brief}  color="#f59e0b" />
                  <ScoreBar label="OVERALL"    value={aiOverall ?? 0}     color="#B22234" />
                </div>

                {/* Recommendation callout */}
                {aiPass !== null ? (
                  <div
                    className="mx-4 mb-3 px-3.5 py-2.5 rounded-lg flex items-start gap-2"
                    style={{
                      background: aiPass ? 'rgba(5,150,105,0.06)' : 'rgba(220,38,38,0.06)',
                      border: `1px solid ${aiPass ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`,
                    }}
                  >
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke={aiPass ? '#059669' : '#DC2626'}
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ flexShrink: 0, marginTop: 1 }}
                    >
                      {aiPass
                        ? <><circle cx="12" cy="12" r="10" /><polyline points="20 6 9 17 4 12" /></>
                        : <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
                      }
                    </svg>
                    <span className="text-[11.5px] leading-relaxed" style={{ color: aiPass ? '#059669' : '#DC2626' }}>
                      <strong>AI Recommendation: {aiPass ? 'PASS' : 'FAIL'}</strong>
                      {aiPass
                        ? ' — Design meets quality standards. Minor colour variance within acceptable tolerance.'
                        : ' — Review required. Quality threshold not met.'}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

        </div>

        {/* ── FOOTER ── */}
        <div
          className="flex-shrink-0 flex items-center gap-2 px-6 py-3.5 flex-wrap"
          style={{ borderTop: '1px solid #E8EDF5', background: '#FAFBFD' }}
        >
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: 12, padding: '7px 13px', gap: 6 }}
          >
            <Download className="w-3.5 h-3.5" aria-hidden />
            Download Files
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: 12, padding: '7px 13px', gap: 6, marginLeft: 'auto' }}
            onClick={handleClose}
          >
            <X className="w-3.5 h-3.5" aria-hidden />
            Close
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: 12, padding: '7px 13px', gap: 6 }}
            onClick={() => onEdit?.(job)}
          >
            <Edit2 className="w-3.5 h-3.5" aria-hidden />
            Edit Job
          </button>
          <button
            type="button"
            className="btn btn-crimson"
            style={{ fontSize: 12, padding: '7px 13px', gap: 6 }}
          >
            <UserPlus className="w-3.5 h-3.5" aria-hidden />
            Assign Job
          </button>
          {!isQuote ? (
            <button
              type="button"
              className="btn btn-crimson"
              style={{ fontSize: 12, padding: '7px 13px', gap: 6 }}
            >
              <Send className="w-3.5 h-3.5" aria-hidden />
              Dispatch to Client
            </button>
          ) : null}
        </div>

      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span
        className="text-[10px] font-bold uppercase tracking-[0.14em] whitespace-nowrap shrink-0"
        style={{ color: '#94A3B8' }}
      >
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: '#E8EDF5' }} />
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div
      className="flex items-baseline justify-between py-1.5 gap-3"
      style={{ borderBottom: '1px solid #F1F5F9' }}
    >
      <span className="text-[11.5px] shrink-0" style={{ color: '#64748B' }}>{label}</span>
      <span
        className="text-[12px] font-semibold text-right"
        style={{ color: '#0D1B2A', ...valueStyle }}
      >
        {value}
      </span>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div
        className="text-[9px] font-bold uppercase mb-1.5"
        style={{ color: '#6B7585', letterSpacing: '0.05em' }}
      >
        {label}
      </div>
      {/* Proportional fill over a grey track — matches reference */}
      <div className="overflow-hidden mb-1" style={{ height: 4, background: '#E4E8F0', borderRadius: 2 }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 500, color: '#0D1B2A' }}>
        {value}
      </div>
    </div>
  );
}
