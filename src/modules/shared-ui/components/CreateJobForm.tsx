import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import {
  Send,
  Save,
  Upload,
  Sparkles,
  Stamp,
  Brush,
  Package,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { CLIENTS } from '../mocks';

interface CreateJobFormProps {
  /** 'quote' creates a quote request; 'order' submits a confirmed order. */
  mode: 'quote' | 'order';
  /** Called after successful submit (after the toast). */
  onSubmit?: (id: string) => void;
}

type Category = 'artwork' | 'digitizing' | 'swatches' | 'extras';

const ORDER_TYPES: { id: Category; label: string; sub: string; icon: typeof Brush }[] = [
  { id: 'artwork',    label: 'Artwork',            sub: 'Logo, Vector, Illustration', icon: Brush },
  { id: 'digitizing', label: 'Digitizing Services',sub: 'Embroidery conversion',      icon: Stamp },
  { id: 'swatches',   label: 'Swatches',           sub: 'Physical sample review',     icon: Sparkles },
  { id: 'extras',     label: 'Patches & Extras',   sub: 'Custom patches, Name drops', icon: Package },
];

// Specific services per category — mirrors the client portal v5 serviceMap.
// An empty list means the category has no sub-service selection.
const SERVICE_MAP: Record<Category, string[]> = {
  artwork: [
    'Vector Artwork', 'Illustration', 'Color Separation', 'Cut Contour',
    'Creative Designs', 'Line Art Conversions', 'Product / Virtual Mock Ups',
    'Image Rendering', 'Color Correction', 'Brochure Designing',
    'Clipping Path', 'Channel Mask', 'Business Card Designs',
    'Packaging Designs', 'Product Branding', 'Image Manipulation',
    'Black & White To Color',
  ],
  digitizing: ['Embroidery Digitizing', 'Embroidery Digitizing Swatches'],
  swatches: [],
  extras: ['Custom Embroidery Patches', 'Name Drops'],
};

const OUTPUT_FORMATS = ['PDF', 'EPS', 'AI', 'CDR'];

/**
 * Two-phase create-job wizard — used by both CS and Admin Create Quote /
 * Place Order pages. Mirrors the client portal v5 flow:
 *   Phase 1 — Client + Service Type (nothing pre-selected; Specific Service
 *             dropdown appears only after a category is chosen).
 *   Phase 2 — Job Details (Digitizing reveals placement/size/sewout fields),
 *             output formats, and file upload.
 * Submit is a UI mock (toast + reset), matching the prototype.
 */
export function CreateJobForm({ mode, onSubmit }: CreateJobFormProps) {
  const isOrder = mode === 'order';

  const [phase, setPhase] = useState<1 | 2>(1);
  const [clientId, setClientId] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [specificService, setSpecificService] = useState('');
  const [processType, setProcessType] = useState('');
  const [formats, setFormats] = useState<string[]>([]);
  const [formatOthers, setFormatOthers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDigitizing = category === 'digitizing';
  const services = category ? SERVICE_MAP[category] : [];

  function pickCategory(id: Category) {
    setCategory(id);
    setSpecificService('');
    setError(null);
  }

  function toggleFormat(fmt: string) {
    setFormats((prev) => (prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]));
  }

  function goToPhase2() {
    if (!clientId) return setError('Please select or enter a client.');
    if (!category) return setError('Please select a service type to continue.');
    if (services.length > 0 && !specificService)
      return setError('Please select a specific service to continue.');
    setError(null);
    setPhase(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goToPhase1() {
    setPhase(1);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm(form: HTMLFormElement) {
    form.reset();
    setPhase(1);
    setClientId('');
    setCategory('');
    setSpecificService('');
    setProcessType('');
    setFormats([]);
    setFormatOthers(false);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (!fd.get('design')) return setError('Design name is required.');
    if (!fd.get('eta')) return setError('Estimated turnaround is required.');
    if (isDigitizing) {
      if (!fd.get('placement')) return setError('Placement is required.');
      if (!fd.get('width')) return setError('Width is required.');
      if (!fd.get('height')) return setError('Height is required.');
    }
    if (!fd.get('brief')) return setError('Design brief is required.');
    setError(null);
    toast.success(isOrder ? 'Order submitted' : 'Quote request submitted');
    const newId = `J-2025-${String(50 + Math.floor(Math.random() * 50)).padStart(4, '0')}`;
    resetForm(form);
    onSubmit?.(newId);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[760px] mx-auto">
      <section className="panel p-7">
        {/* ── Phase stepper ── */}
        <div
          className="flex items-center gap-3 mb-7 pb-5"
          style={{ borderBottom: '1px solid var(--glass-border)' }}
        >
          <StepBadge n={1} label="Service Type" state={phase === 1 ? 'active' : 'done'} />
          <div
            className="w-10 h-0.5 rounded-full"
            style={{ background: phase === 2 ? 'var(--color-crimson)' : 'var(--glass-border)' }}
          />
          <StepBadge n={2} label="Job Details" state={phase === 2 ? 'active' : 'pending'} />
          <div className="ml-auto text-[11.5px] text-text-muted">
            All fields marked <span className="text-crimson">*</span> are required
          </div>
        </div>

        {/* ──────────────── PHASE 1 ──────────────── */}
        <div className={phase === 1 ? '' : 'hidden'}>
          <FormStep n={1} title="Client Details">
            <label className="fl">Select Existing Client</label>
            <select
              className="fi mb-2.5"
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setError(null);
              }}
            >
              <option value="">— Search or select an existing client —</option>
              {CLIENTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company} — {c.name} ({c.id})
                </option>
              ))}
              <option value="new">+ Enter New Client</option>
            </select>

            {clientId === 'new' ? (
              <div
                style={{
                  background: 'rgba(196,30,58,0.04)',
                  border: '1px dashed rgba(196,30,58,0.25)',
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div className="text-[11px] font-semibold uppercase tracking-wider text-crimson mb-3">
                  New Client Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field name="newClientName" label="Client Name *" placeholder="e.g. Ravi Kumar" />
                  <Field name="newClientCompany" label="Company Name *" placeholder="e.g. Ravi Textiles" />
                  <Field name="newClientContact" label="Contact Number" placeholder="+91 98765 43210" />
                  <Field name="newClientEmail" label="Email Address" type="email" placeholder="client@company.com" />
                  <Field name="newClientCity" label="Location / City" placeholder="e.g. Hyderabad" />
                  <Select
                    name="newClientPayment"
                    label="Payment Method"
                    options={['Bank Transfer', 'Credit', 'Cash', 'Card']}
                  />
                </div>
              </div>
            ) : null}
          </FormStep>

          <FormStep
            n={2}
            title={`${isOrder ? 'Place New Order' : 'New Quote Request'} — Select Service Type`}
            lastStep
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
              {ORDER_TYPES.map(({ id, label, sub, icon: Icon }) => {
                const active = category === id;
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => pickCategory(id)}
                    className="text-center cursor-pointer transition rounded-xl p-3"
                    style={{
                      border: `1px solid ${active ? 'var(--color-crimson)' : 'var(--glass-border)'}`,
                      background: active ? 'rgba(196,30,58,0.08)' : 'rgba(255,255,255,0.02)',
                    }}
                    aria-pressed={active}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-1.5 text-text" aria-hidden />
                    <div className="text-[12px] font-bold text-text">{label}</div>
                    <div className="text-[10.5px] text-text-muted">{sub}</div>
                  </button>
                );
              })}
            </div>

            {/* Specific Service appears only after a category with sub-services is chosen */}
            {category && services.length > 0 ? (
              <div className="mt-1">
                <label className="fl">
                  Specific Service <span className="text-crimson">*</span>
                </label>
                <select
                  className="fi"
                  value={specificService}
                  onChange={(e) => {
                    setSpecificService(e.target.value);
                    setError(null);
                  }}
                >
                  <option value="">Select specific service…</option>
                  {services.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </FormStep>

          {error && phase === 1 ? <ErrorBlock>{error}</ErrorBlock> : null}

          <div className="flex justify-end pt-1">
            <button type="button" className="btn btn-crimson" onClick={goToPhase2}>
              <span>Continue to Job Details</span>
              <ArrowRight aria-hidden className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ──────────────── PHASE 2 ──────────────── */}
        <div className={phase === 2 ? '' : 'hidden'}>
          <FormStep n={1} title="Job Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field name="design" label="Design Name *" placeholder="e.g. Winter Collection Print" />
              <Field name="ref" label="Client PO / Reference No." placeholder="e.g. PO-2025-001" />

              {/* Process Type — hidden for Digitizing orders */}
              {!isDigitizing ? (
                <div>
                  <label className="fl" htmlFor="process">Process Type</label>
                  <select
                    id="process"
                    name="process"
                    className="fi"
                    value={processType}
                    onChange={(e) => setProcessType(e.target.value)}
                  >
                    <option value="">Select process type</option>
                    <option>Screen Printing</option>
                    <option>Digital Printing</option>
                    <option>Offset Printing</option>
                    <option>Sublimation</option>
                    <option>Flex Printing</option>
                    <option>Others</option>
                  </select>
                  {processType === 'Others' ? (
                    <input
                      name="processOthers"
                      className="fi mt-2"
                      placeholder="Please specify"
                    />
                  ) : null}
                </div>
              ) : null}

              <Field name="colors" label="Number of Colors" type="number" min={1} max={12} placeholder="" />

              <div>
                <label className="fl" htmlFor="priority">Priority</label>
                <select id="priority" name="priority" className="fi" defaultValue="">
                  <option value="">Select priority</option>
                  <option>Normal</option>
                  <option>Rush</option>
                  <option>Super Rush</option>
                </select>
              </div>

              <div>
                <Field
                  name="eta"
                  label="Estimated Turnaround (hours) *"
                  type="number"
                  min={2}
                  placeholder="e.g. 8"
                />
                <div className="text-[11px] text-text-muted mt-1">
                  CS will confirm the final ETA after review.
                </div>
              </div>

              {/* Digitizing-only fields */}
              {isDigitizing ? (
                <>
                  <Select
                    name="placement"
                    label="Placement *"
                    defaultValue=""
                    options={[
                      '', 'Cap', 'Front of Cap', 'Back of Cap', 'Side of Cap', 'Visor',
                      'Beanie Cap', 'Towel', 'Bags', 'Left Chest', 'Sleeve', 'Pocket',
                      'Full Back', 'Full Front', 'Back Yoke', 'Other',
                    ]}
                    placeholderOption="Select placement"
                  />
                  <Field name="width" label="Width (inches) *" type="number" step="0.1" min={0.1} placeholder="" />
                  <Field name="height" label="Height (inches) *" type="number" step="0.1" min={0.1} placeholder="" />
                  <Field name="fabric" label="Fabric" placeholder="e.g. Cotton twill" />
                  <div>
                    <label className="fl">Sewout Required</label>
                    <div className="flex gap-4 mt-1.5">
                      <label className="flex items-center gap-1.5 text-[13px] font-normal cursor-pointer text-text">
                        <input type="radio" name="sewout" value="yes" style={{ accentColor: 'var(--color-crimson)' }} />
                        Yes
                      </label>
                      <label className="flex items-center gap-1.5 text-[13px] font-normal cursor-pointer text-text">
                        <input type="radio" name="sewout" value="no" style={{ accentColor: 'var(--color-crimson)' }} />
                        No
                      </label>
                    </div>
                  </div>
                </>
              ) : null}

              <div className="md:col-span-2">
                <label className="fl">Design Brief / Description *</label>
                <textarea
                  className="fi fi-ta"
                  name="brief"
                  style={{ minHeight: 90 }}
                  placeholder="Describe the design requirements, color codes, reference links, and any specific instructions…"
                />
              </div>

              <div className="md:col-span-2">
                <label className="fl">Expected Output File Formats</label>
                <div className="flex flex-wrap gap-2.5 mt-1.5">
                  {OUTPUT_FORMATS.map((fmt) => {
                    const checked = formats.includes(fmt);
                    return (
                      <label
                        key={fmt}
                        className="flex items-center gap-1.5 text-[13px] font-normal cursor-pointer px-3 py-1.5 rounded-lg"
                        style={{
                          border: `1px solid ${checked ? 'var(--color-crimson)' : 'var(--glass-border)'}`,
                          background: checked ? 'rgba(196,30,58,0.08)' : 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFormat(fmt)}
                          style={{ accentColor: 'var(--color-crimson)' }}
                        />
                        {fmt}
                      </label>
                    );
                  })}
                  <label
                    className="flex items-center gap-1.5 text-[13px] font-normal cursor-pointer px-3 py-1.5 rounded-lg"
                    style={{
                      border: `1px solid ${formatOthers ? 'var(--color-crimson)' : 'var(--glass-border)'}`,
                      background: formatOthers ? 'rgba(196,30,58,0.08)' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formatOthers}
                      onChange={(e) => setFormatOthers(e.target.checked)}
                      style={{ accentColor: 'var(--color-crimson)' }}
                    />
                    Others
                  </label>
                </div>
                {formatOthers ? (
                  <input name="formatOthers" className="fi mt-2.5" placeholder="Please specify format" />
                ) : null}
              </div>
            </div>
          </FormStep>

          <FormStep n={2} title="Upload Reference Files" lastStep>
            <div
              className="border border-dashed rounded-xl text-center p-7 cursor-pointer transition"
              style={{ borderColor: 'rgba(196,30,58,0.3)' }}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-text" aria-hidden />
              <div className="text-[13px] font-semibold text-text">
                Drop files here or <span className="text-crimson">browse</span>
              </div>
              <div className="text-[11.5px] text-text-muted mt-1">
                PDF, AI, PSD, PNG, SVG, JPG, DST, EMB — max 500 MB per file
              </div>
            </div>
            <div className="mt-2.5">
              <label className="fl">
                Or link to cloud storage (Google Drive, WeTransfer, Dropbox)
              </label>
              <input
                name="cloudLink"
                type="url"
                className="fi"
                placeholder="https://drive.google.com/…"
              />
              <div className="text-[11px] text-text-muted mt-1">
                Use this if your files are too large to upload directly or you prefer sharing from
                cloud storage.
              </div>
            </div>
          </FormStep>

          {error && phase === 2 ? <ErrorBlock>{error}</ErrorBlock> : null}

          <div
            className="flex gap-2.5 justify-between flex-wrap pt-2 mt-2"
            style={{ borderTop: '1px solid var(--glass-border)' }}
          >
            <button type="button" className="btn btn-outline" onClick={goToPhase1}>
              <ArrowLeft aria-hidden className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex gap-2.5">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => toast.success('Draft saved successfully')}
              >
                <Save aria-hidden className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
              <button type="submit" className="btn btn-crimson">
                <Send aria-hidden className="w-4 h-4" />
                <span>{isOrder ? 'Submit Order' : 'Submit Quote Request'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}

function StepBadge({
  n,
  label,
  state,
}: {
  n: number;
  label: string;
  state: 'active' | 'done' | 'pending';
}) {
  const isActive = state === 'active';
  const isDone = state === 'done';
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 transition"
        style={{
          background: isActive || isDone ? 'var(--color-crimson)' : 'transparent',
          border: `1.5px solid ${isActive || isDone ? 'var(--color-crimson)' : 'var(--glass-border)'}`,
          color: isActive || isDone ? '#fff' : 'var(--text-muted)',
        }}
      >
        {isDone ? <Check className="w-3.5 h-3.5" aria-hidden /> : n}
      </div>
      <span
        className="text-[12.5px] font-bold uppercase tracking-wider"
        style={{ color: state === 'pending' ? 'var(--text-muted)' : 'var(--text-main)' }}
      >
        {label}
      </span>
    </div>
  );
}

function ErrorBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[12px] mb-3 px-3 py-2 rounded-md"
      style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}
      role="alert"
    >
      {children}
    </div>
  );
}

function FormStep({
  n,
  title,
  children,
  lastStep = false,
}: {
  n: number;
  title: React.ReactNode;
  children: React.ReactNode;
  lastStep?: boolean;
}) {
  return (
    <div
      className="mb-7 pb-6"
      style={{ borderBottom: lastStep ? 'none' : '1px solid var(--glass-border)' }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
          style={{ background: 'var(--color-crimson)' }}
        >
          {n}
        </div>
        <div className="text-[13.5px] font-bold text-text uppercase tracking-wider">{title}</div>
      </div>
      {children}
    </div>
  );
}

function Field({
  name,
  label,
  ...rest
}: {
  name: string;
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="fl" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} className="fi" {...rest} />
    </div>
  );
}

function Select({
  name,
  label,
  options,
  placeholderOption,
  ...rest
}: {
  name: string;
  label: string;
  options: string[];
  placeholderOption?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="fl" htmlFor={name}>
        {label}
      </label>
      <select id={name} name={name} className="fi" {...rest}>
        {options.map((o) =>
          o === '' ? (
            <option key="__placeholder" value="">
              {placeholderOption ?? '— Select —'}
            </option>
          ) : (
            <option key={o} value={o}>
              {o}
            </option>
          ),
        )}
      </select>
    </div>
  );
}
