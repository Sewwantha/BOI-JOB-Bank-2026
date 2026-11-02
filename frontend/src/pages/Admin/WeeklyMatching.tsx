/* src/pages/Admin/WeeklyMatching.tsx */
import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Briefcase, Phone, UserCheck, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

type Availability = 'Available' | 'Assigned' | 'CandidateAccepted' | 'VacancyClosed';

interface MatchResult {
  id: string;
  jobSeekerProfileId: string;
  candidateRefNo: string;
  candidateName: string;
  candidateMobile: string;
  jobPostId: string;
  jobTitle: string;
  companyName: string;
  score: number;
  reasons: string;
  availability: Availability;
}

interface MatchRun {
  id: string;
  runAt: string;
  isManual: boolean;
  candidateCount: number;
  vacancyCount: number;
  results: MatchResult[];
}

interface MatchingResponse {
  run: MatchRun | null;
  nextRunAt: string | null;
}

interface WeeklyMatchingProps {
  onAssigned: () => void;
}

const availabilityLabels: Record<Exclude<Availability, 'Available'>, string> = {
  Assigned: 'Assigned',
  CandidateAccepted: 'Accepted elsewhere',
  VacancyClosed: 'Vacancy closed',
};

const scoreClass = (score: number) =>
  score >= 70
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : score >= 40
      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

const WeeklyMatching: React.FC<WeeklyMatchingProps> = ({ onAssigned }) => {
  const [data, setData] = useState<MatchingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const load = () =>
    api.get<MatchingResponse>('/admin/matching')
      .then((res) => setData(res.data))
      .catch((err) => console.error('Error loading matching results', err))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const runNow = async () => {
    setRunning(true);
    try {
      await api.post('/admin/matching/run');
      await load();
    } catch {
      alert('Failed to run matching. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  const assign = async (match: MatchResult) => {
    setAssigningId(match.id);
    try {
      await api.post(`/admin/candidate-pool/${match.jobSeekerProfileId}/assign`, { jobPostId: match.jobPostId });
      await load();
      onAssigned();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to assign candidate.');
    } finally {
      setAssigningId(null);
    }
  };

  const run = data?.run;

  // Group matches by vacancy, keeping the best-scoring vacancies first
  const byVacancy = new Map<string, MatchResult[]>();
  run?.results.forEach((r) => byVacancy.set(r.jobPostId, [...(byVacancy.get(r.jobPostId) ?? []), r]));
  const groups = [...byVacancy.values()];
  const matchedCandidates = new Set(run?.results.map((r) => r.jobSeekerProfileId)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span>Weekly Matching</span>
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Candidate pool matched against open job vacancies by preferred category, skills, zone and district
          </p>
        </div>
        <button
          onClick={runNow}
          disabled={running}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
          <span>{running ? 'Analysing...' : 'Run Analysis Now'}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : !run ? (
        <div className="text-center py-16 glass rounded-3xl border border-dashed border-slate-800 text-slate-500">
          No analysis has run yet. The first weekly run starts shortly after the server starts, or run it now.
        </div>
      ) : (
        <>
          {/* Run summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass p-4 rounded-2xl">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                <Calendar className="h-3 w-3" /><span>Last Analysis</span>
              </span>
              <p className="text-sm font-bold text-slate-100 mt-2">{new Date(run.runAt).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                {run.isManual ? 'Manual run' : 'Weekly run'}
                {data?.nextRunAt && ` · next weekly: ${new Date(data.nextRunAt).toLocaleDateString()}`}
              </p>
            </div>
            <div className="glass p-4 rounded-2xl">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Candidate Pool</span>
              <p className="text-2xl font-extrabold text-slate-100 mt-1">{run.candidateCount}</p>
            </div>
            <div className="glass p-4 rounded-2xl">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Open Vacancies</span>
              <p className="text-2xl font-extrabold text-slate-100 mt-1">{run.vacancyCount}</p>
            </div>
            <div className="glass p-4 rounded-2xl">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Matches</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">{run.results.length}</p>
              <p className="text-[10px] text-slate-500 mt-1">{matchedCandidates} candidates · {groups.length} vacancies</p>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-16 glass rounded-3xl border border-dashed border-slate-800 text-slate-500">
              No matching candidates were found for the open vacancies in this analysis.
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((matches) => (
                <div key={matches[0].jobPostId} className="glass rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="px-5 py-4 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-purple-400" />
                      <span className="font-bold text-slate-100">{matches[0].jobTitle}</span>
                      <span className="text-sm text-slate-400">at {matches[0].companyName}</span>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center space-x-1">
                      <Users className="h-3.5 w-3.5" /><span>{matches.length} matched</span>
                    </span>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {matches.map((m) => (
                      <div key={m.id} className="px-5 py-3 flex flex-col md:flex-row md:items-center gap-3 text-sm">
                        <span className={`inline-flex justify-center w-14 shrink-0 px-2 py-1 rounded-lg text-xs font-extrabold border ${scoreClass(m.score)}`}>
                          {m.score}%
                        </span>
                        <div className="flex-grow min-w-0">
                          <div className="flex flex-wrap items-center gap-x-3">
                            <Link to={`/admin/jobseeker/${m.jobSeekerProfileId}`} className="font-semibold text-slate-200 hover:text-purple-300">
                              {m.candidateName || '—'}
                            </Link>
                            <span className="font-mono text-xs text-purple-400">{m.candidateRefNo}</span>
                            {m.candidateMobile && (
                              <span className="text-xs text-slate-400 inline-flex items-center space-x-1">
                                <Phone className="h-3 w-3" /><span>{m.candidateMobile}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{m.reasons}</p>
                        </div>
                        {m.availability === 'Available' ? (
                          <button
                            onClick={() => assign(m)}
                            disabled={assigningId !== null}
                            className="p-2 text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 rounded-lg transition-all cursor-pointer inline-flex items-center space-x-1 disabled:opacity-40 shrink-0"
                          >
                            <UserCheck className="h-4 w-4" />
                            <span className="text-xs font-bold px-1">{assigningId === m.id ? 'Assigning...' : 'Assign'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1 rounded border border-slate-800 shrink-0">
                            {availabilityLabels[m.availability]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WeeklyMatching;
