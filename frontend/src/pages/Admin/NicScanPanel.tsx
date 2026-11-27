/* src/pages/Admin/NicScanPanel.tsx */
// "Fill from NIC scan": the admin uploads the scanned NIC (front, optionally back),
// the API reads it with OCR and the fields found are passed to the registration form.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScanLine, Upload, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import api from '../../services/api';

export interface NicScanResult {
  nicNumber: string;
  fullName: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  lines: string[];
  warnings: string[];
}

interface NicScanPanelProps {
  /** Applies the scan to the form; returns a summary of what was filled (shown to the admin). */
  onScanned: (result: NicScanResult) => { filled: string[]; notes: string[] };
}

const ACCEPT = '.jpg,.jpeg,.png,.bmp,.tif,.tiff,.webp,.pdf,image/*,application/pdf';

const FilePicker: React.FC<{ label: string; file: File | null; onChange: (f: File | null) => void; optional?: boolean }> = ({
  label, file, onChange, optional,
}) => {
  const input = useRef<HTMLInputElement>(null);
  // Thumbnail of the chosen image (PDFs show the file name instead); revoked when the file changes
  const preview = useMemo(() => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-slate-400 mb-1">
        {label} {optional && <span className="text-slate-500 font-normal">(optional)</span>}
      </p>
      <label className="relative flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-700 hover:border-purple-500/50 rounded-xl cursor-pointer bg-slate-900/30 overflow-hidden transition-all duration-200">
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-contain" />
        ) : (
          <>
            <Upload className="h-6 w-6 text-slate-500 mb-1" />
            <span className="text-xs text-slate-300 px-2 text-center truncate max-w-full">{file ? file.name : 'Choose scanned file'}</span>
            <span className="text-[11px] text-slate-500">JPG, PNG, TIFF or PDF · max 10 MB</span>
          </>
        )}
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        {file && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onChange(null); if (input.current) input.current.value = ''; }}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 text-slate-400 hover:text-slate-200 cursor-pointer"
            title="Remove file"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </label>
    </div>
  );
};

const NicScanPanel: React.FC<NicScanPanelProps> = ({ onScanned }) => {
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ filled: string[]; notes: string[] } | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [showText, setShowText] = useState(false);

  const readScan = async () => {
    if (!front) return;
    setReading(true);
    setError(null);
    setSummary(null);
    setLines([]);

    const data = new FormData();
    data.append('front', front);
    if (back) data.append('back', back);

    try {
      const res = await api.post<NicScanResult>('/admin/scan-nic', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      setLines(res.data.lines || []);
      setSummary(onScanned(res.data));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Could not read the NIC scan. Please try again or fill the form manually.');
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-4">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-purple-500/15 rounded-xl text-purple-400 shrink-0">
          <ScanLine className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-100">Fill from NIC scan</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Scan the NIC with the card scanner and choose the saved file. The NIC number, date of birth and gender are
            filled automatically; name and address are filled when printed in English. Always check the details before registering.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <FilePicker label="NIC front" file={front} onChange={(f) => { setFront(f); setSummary(null); setError(null); }} />
        <FilePicker label="NIC back" file={back} onChange={(f) => { setBack(f); setSummary(null); setError(null); }} optional />
      </div>

      <button
        type="button"
        onClick={readScan}
        disabled={!front || reading}
        className="inline-flex items-center space-x-2 px-5 py-2.5 font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 cursor-pointer"
      >
        {reading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Reading NIC…</span>
          </>
        ) : (
          <>
            <ScanLine className="h-4 w-4" />
            <span>Read NIC &amp; Fill Form</span>
          </>
        )}
      </button>

      {error && (
        <div className="p-3 rounded-xl text-xs flex items-center space-x-2 border bg-rose-500/10 border-rose-500/20 text-rose-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {summary && (
        <div
          className={`p-3 rounded-xl text-xs border space-y-1 ${
            summary.filled.length
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            {summary.filled.length ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            <span>
              {summary.filled.length
                ? `Filled from scan: ${summary.filled.join(', ')}. Please check them below.`
                : 'No details could be read from this scan. Try a clearer scan or fill the form manually.'}
            </span>
          </div>
          {summary.notes.length > 0 && (
            <ul className="ml-6 list-disc text-amber-400 space-y-0.5">
              {summary.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          )}
        </div>
      )}

      {lines.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowText((s) => !s)}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            {showText ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>Text read from the scan</span>
          </button>
          {showText && (
            <pre className="mt-2 p-3 max-h-48 overflow-auto rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 whitespace-pre-wrap">
              {lines.join('\n')}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default NicScanPanel;
