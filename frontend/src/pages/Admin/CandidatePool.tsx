/* src/pages/Admin/CandidatePool.tsx */
import React, { useState } from 'react';
import { Search, Phone, Calendar, Pencil, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { type ApplicationStatus, statusBadgeClass, statusLabel } from '../../constants/applicationStatus';

export interface PoolCandidate {
  id: string;
  refNo: string;
  firstName: string;
  lastName: string;
  nicNumber: string;
  mobileNumber: string;
  district: string;
  preferredZone: string;
  preferredJobCategories: string;
  registeredAt: string;
  latestApplication: {
    jobTitle: string;
    companyName: string;
    status: ApplicationStatus;
    rejectionRemark: string;
  } | null;
}

export interface PoolVacancy {
  id: string;
  title: string;
  companyName: string;
}

interface CandidatePoolProps {
  candidates: PoolCandidate[];
  vacancies: PoolVacancy[];
  onAssigned: () => void;
}

const CandidatePool: React.FC<CandidatePoolProps> = ({ candidates, vacancies, onAssigned }) => {
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const query = search.trim().toLowerCase();
  const filtered = candidates.filter((c) =>
    [`${c.firstName} ${c.lastName}`, c.refNo, c.nicNumber, c.mobileNumber, c.district, c.preferredZone]
      .some((field) => (field || '').toLowerCase().includes(query))
  );

  const handleAssign = async (candidate: PoolCandidate) => {
    const jobPostId = selectedJob[candidate.id];
    if (!jobPostId) return;

    setAssigningId(candidate.id);
    try {
      await api.post(`/admin/candidate-pool/${candidate.id}/assign`, { jobPostId });
      onAssigned();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to assign candidate.');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-slate-100">Candidate Pool</h3>
        <p className="text-slate-400 text-sm mt-1">
          Candidates not yet hired by a company: registered without a vacancy, still under company review, or rejected
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ref no, NIC, mobile, district, or zone..."
          className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all text-sm font-medium"
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-bold text-xs uppercase tracking-wider">
                <th className="p-4">Ref No</th>
                <th className="p-4">Name / NIC</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Preferred Category</th>
                <th className="p-4">Application Status</th>
                <th className="p-4">Registered</th>
                <th className="p-4">Assign to Vacancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    {candidates.length === 0 ? 'The candidate pool is empty.' : 'No candidates match the search terms.'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-purple-400">{c.refNo || '—'}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <Link to={`/admin/jobseeker/${c.id}`} className="font-semibold text-slate-200 hover:text-purple-300 inline-flex items-center space-x-1">
                          <span>{`${c.firstName} ${c.lastName}`.trim() || '—'}</span>
                          <Pencil className="h-3 w-3 text-slate-500" />
                        </Link>
                        <span className="text-xs text-slate-500">{c.nicNumber || 'No NIC'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center space-x-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>{c.mobileNumber || '—'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 truncate max-w-[160px]">{c.preferredJobCategories || '—'}</td>
                    <td className="p-4">
                      {c.latestApplication ? (
                        <div className="flex flex-col items-start space-y-1 max-w-[220px]">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusBadgeClass[c.latestApplication.status]}`}>
                            {statusLabel[c.latestApplication.status] ?? c.latestApplication.status}
                          </span>
                          <span className="text-xs text-slate-400">{c.latestApplication.jobTitle} at {c.latestApplication.companyName}</span>
                          {c.latestApplication.status === 'Rejected' && c.latestApplication.rejectionRemark && (
                            <span className="text-xs text-rose-300 italic">Remark: {c.latestApplication.rejectionRemark}</span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          No vacancy assigned
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-4 w-4 text-slate-650" />
                        <span>{new Date(c.registeredAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <select
                          value={selectedJob[c.id] || ''}
                          onChange={(e) => setSelectedJob((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          className="bg-slate-900/50 border border-slate-700 rounded-lg py-1.5 px-2 text-xs text-slate-200 max-w-[200px] cursor-pointer focus:outline-none focus:border-purple-500"
                        >
                          <option value="" disabled className="bg-slate-950 text-slate-500">
                            {vacancies.length ? 'Select vacancy' : 'No open vacancies'}
                          </option>
                          {vacancies.map((v) => (
                            <option key={v.id} value={v.id} className="bg-slate-950">
                              {v.title} — {v.companyName}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssign(c)}
                          disabled={!selectedJob[c.id] || assigningId === c.id}
                          className="p-2 text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 rounded-lg transition-all cursor-pointer inline-flex items-center space-x-1 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Assign to Vacancy"
                        >
                          <UserCheck className="h-4 w-4" />
                          <span className="text-xs font-bold px-1">{assigningId === c.id ? 'Assigning...' : 'Assign'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CandidatePool;
