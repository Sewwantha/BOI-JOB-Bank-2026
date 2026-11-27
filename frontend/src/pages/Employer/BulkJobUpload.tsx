/* src/pages/Employer/BulkJobUpload.tsx */
// Lets an employer post many vacancies at once from a CSV file.
// Rows are parsed and validated in the browser, previewed, then sent to POST /job/bulk
// (all-or-nothing on the server).
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import api from '../../services/api';
import { jobCategoriesList } from '../../constants/jobSeekerOptions';
import { parseCsv, downloadCsv } from '../../utils/csv';

const MAX_ROWS = 200;

const COLUMNS = [
  { key: 'title', header: 'Job Title' },
  { key: 'jobCategory', header: 'Job Category' },
  { key: 'jobType', header: 'Job Type' },
  { key: 'salaryRange', header: 'Salary Range' },
  { key: 'location', header: 'Location' },
  { key: 'description', header: 'Job Description' },
  { key: 'requirements', header: 'Requirements' },
] as const;

type ColumnKey = typeof COLUMNS[number]['key'];

interface ParsedRow {
  line: number; // row number in the spreadsheet (header = 1)
  values: Record<ColumnKey, string>;
  payload: {
    title: string; description: string; requirements: string; jobCategory: string;
    location: string; salaryRange: string; jobType: number;
  } | null;
  errors: string[];
}

const JOB_TYPES: Record<string, number> = { fulltime: 0, contract: 2, internship: 4 };
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

// Known categories match case-insensitively; anything else is stored as "Other: <value>",
// the same format the single-post form uses.
const resolveCategory = (raw: string): string => {
  const v = raw.trim();
  const known = jobCategoriesList.find((c) => c !== 'Other' && c.toLowerCase() === v.toLowerCase());
  if (known) return known;
  const custom = v.replace(/^other\s*:?\s*/i, '').trim();
  return custom ? `Other: ${custom}` : '';
};

const parseRows = (rows: string[][]): { rows: ParsedRow[]; error?: string } => {
  if (rows.length < 2) return { rows: [], error: 'The file has no vacancy rows. Fill in the template below the header row.' };

  const header = rows[0].map((h) => normalize(h));
  const index = {} as Record<ColumnKey, number>;
  const missingCols: string[] = [];
  for (const col of COLUMNS) {
    const i = header.indexOf(normalize(col.header));
    if (i === -1) missingCols.push(col.header);
    index[col.key] = i;
  }
  if (missingCols.length) {
    return { rows: [], error: `Missing column(s): ${missingCols.join(', ')}. Please use the template.` };
  }
  if (rows.length - 1 > MAX_ROWS) {
    return { rows: [], error: `The file has ${rows.length - 1} vacancies; the maximum per upload is ${MAX_ROWS}.` };
  }

  return {
    rows: rows.slice(1).map((r, i) => {
      const values = {} as Record<ColumnKey, string>;
      for (const col of COLUMNS) values[col.key] = (r[index[col.key]] ?? '').trim();

      const errors: string[] = [];
      for (const col of COLUMNS) if (!values[col.key]) errors.push(`${col.header} is required`);

      const jobType = JOB_TYPES[normalize(values.jobType)];
      if (values.jobType && jobType === undefined) errors.push('Job Type must be Full Time, Contract or Internship');

      const jobCategory = values.jobCategory ? resolveCategory(values.jobCategory) : '';
      if (values.jobCategory && !jobCategory) errors.push('Specify the category after "Other"');

      return {
        line: i + 2,
        values,
        errors,
        payload: errors.length ? null : {
          title: values.title,
          description: values.description,
          requirements: values.requirements,
          jobCategory,
          location: values.location,
          salaryRange: values.salaryRange,
          jobType,
        },
      };
    }),
  };
};

const downloadTemplate = () => {
  downloadCsv('vacancy_upload_template.csv', [
    COLUMNS.map((c) => c.header),
    ['Machine Operator', 'Machine Operator', 'Full Time', '60,000 - 75,000 / month', 'Katunayake EPZ',
      'Operate and maintain production machinery on rotating shifts.', 'O/L qualified; 1 year experience preferred'],
    ['Store Keeper', 'Other: Store Keeper', 'Contract', '50,000 / month', 'Biyagama EPZ',
      'Manage stock records and issue materials to production.', 'Basic computer knowledge'],
  ]);
};

const BulkJobUpload: React.FC = () => {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; details?: string[] } | null>(null);

  const invalidCount = rows.filter((r) => r.errors.length).length;

  const reset = () => {
    setRows([]);
    setFileName('');
    if (fileInput.current) fileInput.current.value = '';
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setMessage(null);
    setRows([]);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setMessage({ type: 'error', text: 'Please upload a .csv file. In Excel use File → Save As → "CSV UTF-8".' });
      reset();
      return;
    }
    setFileName(file.name);
    const result = parseRows(parseCsv(await file.text()));
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
      return;
    }
    setRows(result.rows);
  };

  const handleUpload = async () => {
    if (!rows.length || invalidCount) return;
    setUploading(true);
    setMessage(null);
    try {
      const res = await api.post('/job/bulk', rows.map((r) => r.payload));
      setMessage({ type: 'success', text: res.data?.message || `${rows.length} vacancies posted successfully!` });
      reset();
      setTimeout(() => navigate('/employer-dashboard'), 1500);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to upload vacancies. Please try again.',
        details: err.response?.data?.errors,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl text-sm border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
          {message.details?.length ? (
            <ul className="mt-2 ml-7 list-disc text-xs space-y-0.5">
              {message.details.map((d) => <li key={d}>{d}</li>)}
            </ul>
          ) : null}
        </div>
      )}

      {/* Instructions */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 text-sm text-slate-400 space-y-2">
        <p className="font-semibold text-slate-200">How to upload bulk vacancies</p>
        <ol className="list-decimal ml-5 space-y-1 text-xs">
          <li>Download the template and fill in one vacancy per row (up to {MAX_ROWS}).</li>
          <li>
            <span className="text-slate-300">Job Category</span>: {jobCategoriesList.filter((c) => c !== 'Other').join(', ')}.
            For anything else write <span className="text-slate-300">Other: &lt;category&gt;</span>.
          </li>
          <li><span className="text-slate-300">Job Type</span>: Full Time, Contract or Internship.</li>
          <li>Save as <span className="text-slate-300">CSV UTF-8 (.csv)</span> and upload it below. Review the preview, then publish.</li>
        </ol>
        <button
          type="button"
          onClick={downloadTemplate}
          className="mt-2 inline-flex items-center space-x-2 px-4 py-2 border border-purple-500/40 text-purple-300 hover:bg-purple-500/10 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Download Template</span>
        </button>
      </div>

      {/* File picker */}
      <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-slate-700 hover:border-purple-500/50 rounded-2xl cursor-pointer transition-all duration-200 bg-slate-900/30">
        <Upload className="h-8 w-8 text-slate-500 mb-2" />
        <span className="text-sm text-slate-300 font-semibold">{fileName || 'Click to choose a CSV file'}</span>
        <span className="text-xs text-slate-500 mt-1">.csv only</span>
        <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
      </label>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-slate-300">
              <FileSpreadsheet className="h-4 w-4 text-purple-400" />
              <span>
                {rows.length} vacanc{rows.length === 1 ? 'y' : 'ies'} found
                {invalidCount > 0 && <span className="text-rose-400"> · {invalidCount} with errors</span>}
              </span>
            </div>
            <button type="button" onClick={reset} className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-300 cursor-pointer">
              <X className="h-3.5 w-3.5" /><span>Clear</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-slate-400 sticky top-0">
                <tr>
                  <th className="p-3">Row</th>
                  <th className="p-3">Job Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Salary</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map((r) => (
                  <tr key={r.line} className={r.errors.length ? 'bg-rose-500/5' : ''}>
                    <td className="p-3 text-slate-500">{r.line}</td>
                    <td className="p-3 text-slate-200">{r.values.title || '—'}</td>
                    <td className="p-3 text-slate-300">{r.payload?.jobCategory || r.values.jobCategory || '—'}</td>
                    <td className="p-3 text-slate-300">{r.values.jobType || '—'}</td>
                    <td className="p-3 text-slate-300">{r.values.salaryRange || '—'}</td>
                    <td className="p-3 text-slate-300">{r.values.location || '—'}</td>
                    <td className="p-3">
                      {r.errors.length ? (
                        <span className="text-rose-400">{r.errors.join('; ')}</span>
                      ) : (
                        <span className="text-emerald-400">Ready</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invalidCount > 0 && (
            <p className="text-xs text-rose-400">Fix the rows with errors in your file and upload it again. Nothing is posted until all rows are valid.</p>
          )}
        </div>
      )}

      <div className="flex space-x-3 pt-6 border-t border-slate-850">
        <button
          type="button"
          onClick={() => navigate('/employer-dashboard')}
          className="w-1/2 py-3 border border-slate-700 hover:bg-slate-800 rounded-xl text-sm font-bold text-slate-300 transition-all duration-200 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !rows.length || invalidCount > 0}
          className="w-1/2 py-3 font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 cursor-pointer flex justify-center items-center"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            `Publish ${rows.length ? rows.length + ' ' : ''}Vacanc${rows.length === 1 ? 'y' : 'ies'}`
          )}
        </button>
      </div>
    </div>
  );
};

export default BulkJobUpload;
