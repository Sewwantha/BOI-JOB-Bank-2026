/* src/components/CompanyPicker.tsx */
import React, { useEffect, useRef, useState } from 'react';
import { Building2, Search, MapPin, Loader2, X } from 'lucide-react';
import api from '../services/api';

// A company as registered with BOI in the common database, with the zone(s) of its site
export interface OfficialCompany {
  name: string;
  zone: string;
}

interface CompanyPickerProps {
  value: string;                       // selected official company name ('' = none)
  onChange: (company: OfficialCompany | null) => void;
  required?: boolean;
  placeholder?: string;
  inputClassName?: string;
  showSelectedHint?: boolean;          // show "Official company selected" under the field
}

// Searchable list of official company names. Only a name picked from the list is accepted,
// so the company can be matched to its zone.
const CompanyPicker: React.FC<CompanyPickerProps> = ({
  value,
  onChange,
  required,
  placeholder = 'Type at least 2 letters of the company name...',
  showSelectedHint = true,
  inputClassName = 'w-full pl-10 pr-10 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm',
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<OfficialCompany[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Keep the text in sync when the selected value changes from outside (e.g. profile loaded)
  useEffect(() => { setQuery(value); }, [value]);

  // Search as the user types (debounced); skip while the text is the selected company
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2 || term === value) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      api.get<OfficialCompany[]>('/company/official', { params: { search: term } })
        .then((res) => { setResults(res.data); setError(null); })
        .catch((err) => {
          setResults([]);
          setError(err.response?.data?.message || 'Could not search companies. Please try again.');
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, value]);

  // Close the list when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (company: OfficialCompany) => {
    onChange(company);
    setQuery(company.name);
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery('');
    setResults([]);
  };

  const typedButNotSelected = query.trim().length > 0 && query.trim() !== value;

  return (
    <div className="relative" ref={boxRef}>
      <Building2 className="absolute left-3 top-3 h-5 w-5 text-slate-500 pointer-events-none" />
      <input
        type="text"
        value={query}
        required={required}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange(null); // editing the text clears the selection until a company is picked again
        }}
        onFocus={() => setOpen(true)}
        className={inputClassName}
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading ? (
        <Loader2 className="absolute right-3 top-3 h-5 w-5 text-slate-500 animate-spin" />
      ) : query ? (
        <button type="button" onClick={clear} className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer" title="Clear">
          <X className="h-5 w-5" />
        </button>
      ) : (
        <Search className="absolute right-3 top-3 h-5 w-5 text-slate-600 pointer-events-none" />
      )}

      {open && typedButNotSelected && query.trim().length >= 2 && !loading && (
        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 shadow-xl">
          {error ? (
            <p className="px-4 py-3 text-xs text-rose-400">{error}</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-500">No official company matches “{query.trim()}”.</p>
          ) : (
            results.map((c) => (
              <button
                type="button"
                key={c.name}
                onClick={() => select(c)}
                className="w-full text-left px-4 py-2.5 hover:bg-purple-500/10 border-b border-slate-800/60 last:border-b-0 cursor-pointer"
              >
                <span className="block text-sm text-slate-200 font-semibold">{c.name}</span>
                <span className="flex items-center space-x-1 text-[11px] text-slate-500 mt-0.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{c.zone || 'No zone recorded'}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {typedButNotSelected ? (
        <p className="mt-1 text-xs text-amber-400">Select the company from the list.</p>
      ) : value && showSelectedHint ? (
        <p className="mt-1 text-xs text-emerald-400">Official company selected.</p>
      ) : null}
    </div>
  );
};

export default CompanyPicker;
