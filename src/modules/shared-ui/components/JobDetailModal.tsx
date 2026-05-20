import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@lib/utils';
import { type Job, jobImage } from '../mocks/jobs';

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  onConfirmJob?: (job: Job) => void;
}

const FLOW_STEPS = [
  'CS Review',
  'Approved',
  'Assigned',
  'In Work',
  'QC Review',
  'CS Delivery',
];

function currentStepIndex(job: Job): number {
  switch (job.stage) {
    case 'quote':
      return job.status === 'Quote Approved' || job.status === 'Pending Client Confirm' ? 1 : 0;
    case 'junior':
    case 'senior':
      return 3;
    case 'sewout':
      return 3;
    case 'qc':
      return 4;
    case 'delivered':
      return 5;
    default:
      return 0;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function statusAccent(status: string): string {
  const map: Record<string, string> = {
    'In QC': 'teal',
    'In Production': 'amber',
    'Senior Review': 'purple',
    Sewout: 'purple',
    Delivered: 'green',
    'Quote Submitted': 'blue',
    'Quote Approved': 'amber',
    'Pending Client Confirm': 'amber',
    Cancelled: 'gray',
    Amend: 'amber',
    'In Review': 'purple',
  };
  return map[status] || 'gray';
}

function orderAccent(order: string): string {
  const map: Record<string, string> = {
    Artwork: 'navy',
    Digitizing: 'teal',
    'Digitizing + Sewout': 'purple',
    Sewout: 'purple',
  };
  return map[order] || 'gray';
}

function priorityClass(priority: string): string {
  const map: Record<string, string> = { Normal: 'normal', Rush: 'rush', 'Super Rush': 'super-rush' };
  return map[priority] || 'normal';
}

export function JobDetailModal({ job, onClose, onConfirmJob }: JobDetailModalProps) {
  const [isAnimatedIn, setIsAnimatedIn] = useState(false);

  useEffect(() => {
    if (job) {
      const raf = requestAnimationFrame(() => {
        setIsAnimatedIn(true);
      });
      return () => cancelAnimationFrame(raf);
    }
    return undefined;
  }, [job]);

  const handleClose = useCallback(() => {
    setIsAnimatedIn(false);
    const timer = setTimeout(() => {
      onClose();
    }, 220);
    return () => clearTimeout(timer);
  }, [onClose]);

  useEffect(() => {
    if (!job) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [job]);

  useEffect(() => {
    if (!job) return undefined;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [job, handleClose]);

  if (!job) return null;

  const stepIdx = currentStepIndex(job);
  const isDelivered = job.stage === 'delivered';
  const showConfirm = job.status === 'Pending Client Confirm' || job.status === 'Quote Approved';
  const confirmPrice = job.negotiation?.agencyOffer ?? job.adminPrice ?? null;

  const etaHours = job.etaHours;

  const complexityAlloc: Record<string, [number, number, number]> = {
    Simple: [0.08, 0.72, 0.20],
    Medium: [0.10, 0.65, 0.25],
    'Super Medium': [0.10, 0.65, 0.25],
    Complex: [0.12, 0.63, 0.25],
    'Super Complex': [0.15, 0.60, 0.25],
  };
  const [tlPct, workerPct, qcPct] = complexityAlloc[job.complexity] ?? [0.10, 0.65, 0.25];
  const tlHours = etaHours * tlPct;
  const designerHours = etaHours * workerPct;
  const qcHours = etaHours * qcPct;

  const workerLabel =
    job.order === 'Artwork' ? 'Designer' :
      job.order === 'Sewout' ? 'Sewout Operator' : 'Digitator';

  const images = [
    jobImage(job, 0, 560, 420),
    jobImage(job, 1, 560, 420),
    jobImage(job, 2, 560, 420),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        background: isAnimatedIn ? 'rgba(15, 23, 42, 0.15)' : 'rgba(15, 23, 42, 0)',
        backdropFilter: isAnimatedIn ? 'blur(4px)' : 'blur(0px)',
        WebkitBackdropFilter: isAnimatedIn ? 'blur(4px)' : 'blur(0px)',
        transition: 'all 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: isAnimatedIn ? 1 : 0,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Job detail: ${job.design}`}
        className="glass-heavy relative w-full sm:max-w-2xl max-h-[96dvh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
        style={{
          transform: isAnimatedIn ? 'translateY(0px) scale(1)' : 'translateY(30px) scale(0.96)',
          opacity: isAnimatedIn ? 1 : 0,
          transition: 'all 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 px-5 pt-5 pb-4"
          style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', borderBottom: '1px solid var(--glass-border)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[11px] font-bold mb-1.5 tracking-wider" style={{ color: 'var(--color-crimson)' }}>
                {job.id} · {job.ref}
              </div>
              <h2 className="text-[17px] font-extrabold leading-tight" style={{ color: 'var(--text-main)' }}>
                {job.design}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className={cn('badge', orderAccent(job.order))}>{job.order}</span>
                <span className={cn('badge', statusAccent(job.status))}>{job.status}</span>
                <span className={cn('priority-badge', priorityClass(job.priority))}>{job.priority}</span>
                <span className="badge gray">{job.project}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex-shrink-0 p-2 rounded-lg border border-glass-border text-text-muted hover:border-crimson/50 hover:text-crimson transition mt-0.5"
              aria-label="Close"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="px-5 pb-6 pt-5 bg-white flex flex-col gap-6 overflow-y-auto flex-1">

          {/* ── QUOTE APPROVED ALERT ── */}
          {job.status === 'Quote Approved' && (
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.32)' }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-amber)' }} aria-hidden />
              <div>
                <div className="text-[12.5px] font-bold mb-0.5" style={{ color: 'var(--text-main)' }}>
                  Quote Ready — Action Required
                </div>
                <div className="text-[11.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Your quote has been approved and is ready for review. Check the price below and confirm to start production.
                </div>
              </div>
            </div>
          )}

          {/* ── JOB IMAGES ── */}
          <div>
            <SectionDivider label="Job Images" />
            <div className="grid grid-cols-3 gap-2">
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={i === 0 ? job.design : ''}
                  className="w-full aspect-[4/3] object-cover rounded-xl"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          </div>

          {/* ── JOB STATUS FLOW ── */}
          <div>
            <SectionDivider label="Job Status Flow" />
            <div className="px-1">
              <div className="flex items-start">
                {FLOW_STEPS.map((step, i) => {
                  const state = isDelivered
                    ? 'done'
                    : i < stepIdx
                      ? 'done'
                      : i === stepIdx
                        ? 'current'
                        : 'pending';
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                          style={
                            state === 'done'
                              ? { background: 'var(--color-navy-ink)', color: '#fff' }
                              : state === 'current'
                                ? { background: '#fff', border: '2.5px solid var(--color-crimson)', color: 'var(--color-crimson)', boxShadow: '0 0 0 3px rgba(196,30,58,0.15)' }
                                : { background: 'rgba(0,0,0,0.05)', border: '1.5px solid var(--glass-border)', color: 'var(--text-faint)' }
                          }
                        >
                          {state === 'done' ? '✓' : i + 1}
                        </div>
                        <span
                          className="text-[8px] font-bold uppercase tracking-wider whitespace-nowrap text-center"
                          style={{
                            color:
                              state === 'current'
                                ? 'var(--color-crimson)'
                                : state === 'done'
                                  ? 'var(--text-muted)'
                                  : 'var(--text-faint)',
                          }}
                        >
                          {step}
                        </span>
                      </div>
                      {i < FLOW_STEPS.length - 1 ? (
                        <div
                          className="flex-1 h-px mb-5 mx-0.5"
                          style={{ background: i < stepIdx ? 'var(--color-navy-ink)' : 'var(--glass-border)' }}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── ESTIMATED TIMELINE ── */}
          {!isDelivered ? (
            <div>
              <SectionDivider label="Estimated Timeline" />
              <div
                className="rounded-xl p-4"
                style={{ background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)' }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: 'var(--text-faint)' }}>
                      CS Estimated Turnaround
                    </div>
                    <div className="text-[34px] font-extrabold leading-none" style={{ color: 'var(--text-main)' }}>
                      {job.etaHours}h
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] mb-1" style={{ color: 'var(--text-faint)' }}>Current Stage</div>
                    <span className={cn('badge', statusAccent(job.status))}>{job.status}</span>
                  </div>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2.5" style={{ color: 'var(--text-faint)' }}>
                  Time Allocation Per Stage
                </div>
                <div className="space-y-2.5">
                  <TimeBar label="Team Lead — Review &amp; Assign" hours={tlHours} pct={Math.round(tlPct * 100)} color="var(--color-navy-ink)" />
                  <TimeBar label={workerLabel} hours={designerHours} pct={Math.round(workerPct * 100)} color="var(--color-crimson)" />
                  <TimeBar label="QC Review" hours={qcHours} pct={Math.round(qcPct * 100)} color="var(--color-green)" />
                </div>
                <div className="mt-3 text-[11px] leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                  Timeline is an estimate. Actual time may vary based on complexity and revision requests.
                </div>
              </div>
            </div>
          ) : null}

          {/* ── JOB DETAILS + REFERENCE ── */}
          <div>
            <SectionDivider label="Job Details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className="rounded-xl px-4 pt-1 pb-0"
                style={{ background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)' }}
              >
                <DetailRow label="Order Type" value={job.order} />
                {job.process ? <DetailRow label="Process" value={job.process} /> : null}
                <DetailRow label="Complexity" value={job.complexity} />
                <DetailRow label="Colors" value={`${job.colors} color${job.colors !== 1 ? 's' : ''}`} />
                <DetailRow label="Priority" value={job.priority} />
                <DetailRow label="Assigned To" value={job.assignedTo || 'Unassigned'} />
                <DetailRow label="Created" value={formatDate(job.created)} />
              </div>
              <div
                className="rounded-xl px-4 pt-1 pb-0"
                style={{ background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)' }}
              >
                <DetailRow label="Job ID" value={job.id} />
                <DetailRow label="Reference No." value={job.ref} />
                <DetailRow label="Project Type" value={job.project} />
                <DetailRow label="Status" value={job.status} />
                {job.placement ? <DetailRow label="Placement" value={job.placement} /> : null}
                {job.stitchCount ? <DetailRow label="Stitch Count" value={job.stitchCount.toLocaleString()} /> : null}
              </div>
            </div>
          </div>

          {/* ── CONFIRM & PLACE JOB ── */}
          {showConfirm ? (
            <div>
              <SectionDivider label="Confirm & Place Job" />
              <div
                className="rounded-xl p-5"
                style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.28)' }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div
                      className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1"
                      style={{ color: 'var(--text-main)' }}
                    >
                      Agency Quoted Price
                    </div>
                    <div className="text-[36px] font-extrabold leading-none" style={{ color: 'var(--color-crimson)' }}>
                      {confirmPrice != null ? `$${confirmPrice}` : 'Pending'}
                    </div>
                    <div className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      Reviewed &amp; set by your Client Servicing team
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      className="btn font-bold text-[13px] justify-center"
                      style={{ background: 'var(--color-amber)', color: '#0a1a3a', border: 'none', padding: '10px 18px', borderRadius: '999px' }}
                      onClick={() => onConfirmJob?.(job)}
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden />
                      Confirm &amp; Start Production
                    </button>
                    <button type="button" className="btn btn-outline justify-center" style={{ padding: '9px 18px', borderRadius: '999px' }}>
                      Discuss with CS
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-3 flex items-start gap-2 text-[11px] leading-relaxed" style={{ color: 'var(--color-amber)', borderTop: '1px dashed rgba(245,158,11,0.35)' }}>
                  <Clock className="w-3.5 h-3.5 mt-px shrink-0" aria-hidden />
                  Confirming starts production immediately. Your job will be assigned to the team and tracked in My Projects.
                </div>
              </div>
            </div>
          ) : null}

          {/* ── BRIEF / NOTES ── */}
          {job.notes ? (
            <div>
              <SectionDivider label="Brief / Notes" />
              <div
                className="text-[12.5px] leading-relaxed rounded-xl p-4"
                style={{ background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}
              >
                {job.notes}
              </div>
            </div>
          ) : null}

        </div>

        {/* Footer — outside scroll area so it always shows on solid white */}
        <div
          className="flex-shrink-0 flex items-center justify-end gap-3 px-5 py-4 bg-white"
          style={{ borderTop: '1px solid var(--glass-border)' }}
        >
          <button
            type="button"
            className="btn btn-outline justify-center"
            style={{ borderRadius: '999px', padding: '9px 22px' }}
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-crimson justify-center"
            style={{ borderRadius: '999px', padding: '9px 22px' }}
          >
            <Clock className="w-4 h-4" aria-hidden />
            Track This Job
          </button>
        </div>
      </div>
    </div>
  );
}

function TimeBar({ label, hours, pct, color }: { label: string; hours: number; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[11px] shrink-0 w-40" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[11.5px] font-bold w-10 text-right shrink-0" style={{ color }}>
        {hours.toFixed(1)}h
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-2"
      style={{ borderBottom: '1px solid var(--glass-border)' }}
    >
      <span className="text-[11.5px] shrink-0" style={{ color: 'var(--color-navy-ink)' }}>{label}</span>
      <span className="text-[12px] font-semibold text-right" style={{ color: 'var(--text-main)' }}>{value}</span>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span
        className="text-[10px] font-bold uppercase tracking-[0.14em] whitespace-nowrap shrink-0"
        style={{ color: 'var(--text-faint)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
    </div>
  );
}
