export type ApplicationStatus = 'Applied' | 'Reviewing' | 'Shortlisted' | 'Accepted' | 'Rejected';

export const statusBadgeClass: Record<ApplicationStatus, string> = {
  Applied: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  Reviewing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Shortlisted: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

// Text shown on the admin side. "Accepted" (employer selected the candidate) is shown as "Hired".
export const statusLabel: Record<ApplicationStatus, string> = {
  Applied: 'Applied',
  Reviewing: 'Reviewing',
  Shortlisted: 'Shortlisted',
  Accepted: 'Hired',
  Rejected: 'Rejected',
};
