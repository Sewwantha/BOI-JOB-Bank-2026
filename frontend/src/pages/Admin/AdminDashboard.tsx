import React, { useState, useEffect } from 'react';
import { 
  Users, Briefcase, Trash2, Shield, Search,
  UserCheck,
  FileCheck,
  Mail,
  Calendar,
  MapPin,
  Banknote,
  UserPlus,
  Pencil,
  Phone,
  FileText,
  Sparkles,
  Building2,
  UsersRound,
  ClipboardList,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import UserRegistration from './UserRegistration';
import CandidatePool, { type PoolCandidate } from './CandidatePool';
import WeeklyMatching from './WeeklyMatching';
import { type ApplicationStatus, statusBadgeClass } from '../../constants/applicationStatus';

interface Stats {
  totalUsers: number;
  totalEmployers: number;
  totalJobSeekers: number;
  totalJobPosts: number;
  activeJobPosts: number;
  totalApplications: number;
  acceptedCandidates: number;
  rejectedCandidates: number;
}

interface SystemUser {
  id: string;
  email: string;
  role: 'Admin' | 'Employer' | 'JobSeeker';
  createdAt: string;
  profileName: string;
  profileId: string | null;
}

interface SystemJob {
  id: string;
  title: string;
  location: string;
  jobType: string;
  jobCategory: string;
  salaryRange: string;
  positionsAvailable: number;
  filledPositions?: number;
  remainingPositions?: number;
  isActive: boolean;
  createdAt: string;
  companyName: string;
  companyId: string;
}

interface SystemJobSeeker {
  id: string;
  userId: string;
  refNo: string;
  firstName: string;
  lastName: string;
  nicNumber: string;
  mobileNumber: string;
  district: string;
  preferredJobCategories: string;
  resumeUrl: string;
  registeredAt: string;
  applicationStatus: ApplicationStatus | null;
}

type AdminTab = 'stats' | 'users' | 'seekers' | 'pool' | 'matching' | 'jobs' | 'vacancies' | 'register';
const ADMIN_TABS: AdminTab[] = ['stats', 'users', 'seekers', 'pool', 'matching', 'jobs', 'vacancies', 'register'];

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [jobs, setJobs] = useState<SystemJob[]>([]);
  const [seekers, setSeekers] = useState<SystemJobSeeker[]>([]);
  const [pool, setPool] = useState<PoolCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Active tab lives in the URL (?tab=seekers) so "Back" from the profile editor returns here
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as AdminTab | null;
  const activeTab: AdminTab = tabParam && ADMIN_TABS.includes(tabParam) ? tabParam : 'stats';
  const setActiveTab = (tab: AdminTab) => setSearchParams(tab === 'stats' ? {} : { tab }, { replace: true });

  // Search filters
  const [userSearch, setUserSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [seekerSearch, setSeekerSearch] = useState('');
  const [vacancySearch, setVacancySearch] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, jobsRes, seekersRes, poolRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/jobs'),
        api.get('/admin/jobseekers'),
        api.get('/admin/candidate-pool')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setJobs(jobsRes.data);
      setSeekers(seekersRes.data);
      setPool(poolRes.data);
    } catch (err) {
      console.error('Error fetching admin controls dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Refresh without the full-page spinner so the registration form stays mounted
  const refreshUsersAndStats = async () => {
    try {
      const [statsRes, usersRes, seekersRes, poolRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/jobseekers'),
        api.get('/admin/candidate-pool')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setSeekers(seekersRes.data);
      setPool(poolRes.data);
    } catch (err) {
      console.error('Error refreshing users after registration', err);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (email === 'admin@jobbank.com') {
      alert('Cannot delete the root administrator.');
      return;
    }
    if (!window.confirm(`CRITICAL: Are you sure you want to terminate the user account: "${email}"? This will delete all associated profiles, postings, and application documents. This process is irreversible.`)) {
      return;
    }

    try {
      await api.delete(`/admin/user/${userId}`);
      // Refresh local list
      setUsers(users.filter((u) => u.id !== userId));
      setSeekers(seekers.filter((s) => s.userId !== userId));
      const removedProfileId = users.find((u) => u.id === userId)?.profileId;
      setPool(pool.filter((c) => c.id !== removedProfileId));
      // Re-trigger stats count update
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error deleting user', err);
      alert('Failed to terminate user.');
    }
  };

  const handleDeleteJob = async (jobId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to moderate and remove the job listing: "${title}"?`)) {
      return;
    }

    try {
      await api.delete(`/admin/job/${jobId}`);
      // Refresh local list
      setJobs(jobs.filter((j) => j.id !== jobId));
      // Re-trigger stats count update
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error deleting job listing', err);
      alert('Failed to delete job post.');
    }
  };

  const filteredUsers = users.filter((u) => 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.profileName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const seekerQuery = seekerSearch.trim().toLowerCase();
  const filteredSeekers = seekers.filter((s) =>
    [`${s.firstName} ${s.lastName}`, s.refNo, s.nicNumber, s.mobileNumber, s.district]
      .some((field) => (field || '').toLowerCase().includes(seekerQuery))
  );

  const filteredJobs = jobs.filter((j) =>
    j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.companyName.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.location.toLowerCase().includes(jobSearch.toLowerCase())
  );

  // Active vacancies filtered for the Vacancies tab
  const activeVacancies = jobs.filter((j) => j.isActive);
  const filteredVacancies = activeVacancies.filter((j) =>
    j.title.toLowerCase().includes(vacancySearch.toLowerCase()) ||
    j.companyName.toLowerCase().includes(vacancySearch.toLowerCase()) ||
    j.location.toLowerCase().includes(vacancySearch.toLowerCase()) ||
    j.jobCategory.toLowerCase().includes(vacancySearch.toLowerCase())
  );

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-start">
      {/* Dashboard title */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 flex items-center space-x-2">
            <Shield className="h-8 w-8 text-purple-500" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-slate-400 mt-1">Oversee users, moderate job postings, and analyze system-wide activities</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-grow flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main Navigation Tabs */}
          <div className="flex space-x-2 border-b border-slate-800 p-1 bg-slate-900/60 rounded-xl max-w-6xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'stats' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              System Statistics
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'users' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Users Directory ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('seekers')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'seekers'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Job Seekers ({seekers.length})
            </button>
            <button
              onClick={() => setActiveTab('pool')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pool'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Candidate Pool ({pool.length})
            </button>
            <button
              onClick={() => setActiveTab('matching')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center space-x-1 ${
                activeTab === 'matching'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Weekly Matching</span>
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'jobs' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Job Listings ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab('vacancies')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center space-x-1 ${
                activeTab === 'vacancies'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Job Vacancies ({activeVacancies.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center space-x-1 ${
                activeTab === 'register' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>User Registration</span>
            </button>
          </div>

          {/* TAB 1: STATISTICS VIEW */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-8">
              {/* Quick Counter Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Cards */}
                <div className="glass p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Users</span>
                    <h3 className="text-3xl font-extrabold text-slate-100 mt-2">{stats.totalUsers}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                </div>

                <div className="glass p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Job Posts</span>
                    <h3 className="text-3xl font-extrabold text-slate-100 mt-2">{stats.activeJobPosts}</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Total: {stats.totalJobPosts}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Briefcase className="h-6 w-6" />
                  </div>
                </div>

                <div className="glass p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Applications</span>
                    <h3 className="text-3xl font-extrabold text-slate-100 mt-2">{stats.totalApplications}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <FileCheck className="h-6 w-6" />
                  </div>
                </div>

                <div className="glass p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Employers / Seekers</span>
                    <h3 className="text-2xl font-extrabold text-slate-100 mt-2">{stats.totalEmployers} / {stats.totalJobSeekers}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <UserCheck className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Candidate Outcome Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Accepted Candidates */}
                <div className="glass p-6 rounded-2xl flex items-center justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />
                  <div className="relative z-10">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Hired Candidates</span>
                    <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">{stats.acceptedCandidates}</h3>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {stats.totalJobSeekers > 0
                        ? `${((stats.acceptedCandidates / stats.totalJobSeekers) * 100).toFixed(1)}% of total seekers`
                        : 'No seekers yet'}
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 relative z-10">
                    <UserCheck className="h-7 w-7" />
                  </div>
                </div>

                {/* Rejected Candidates */}
                <div className="glass p-6 rounded-2xl flex items-center justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/5 rounded-full filter blur-3xl pointer-events-none" />
                  <div className="relative z-10">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Rejected Candidates</span>
                    <h3 className="text-3xl font-extrabold text-rose-400 mt-2">{stats.rejectedCandidates}</h3>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {stats.totalJobSeekers > 0
                        ? `${((stats.rejectedCandidates / stats.totalJobSeekers) * 100).toFixed(1)}% of total seekers`
                        : 'No seekers yet'}
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 relative z-10">
                    <Trash2 className="h-7 w-7" />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SYSTEM USERS VIEW */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by email, name, or role..."
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all text-sm font-medium"
                />
              </div>

              {/* Users Table */}
              <div className="glass rounded-2xl overflow-hidden border border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-bold text-xs uppercase tracking-wider">
                        <th className="p-4">User Info / Email</th>
                        <th className="p-4">Profile Display Name</th>
                        <th className="p-4">System Role</th>
                        <th className="p-4">Registration Date</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-slate-500">
                            No users match the search terms.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-900/30 transition-colors">
                            <td className="p-4 font-medium text-slate-200">
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-slate-500" />
                                <span>{user.email}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-300 font-semibold">{user.profileName}</td>
                            <td className="p-4">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                user.role === 'Admin' 
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                  : user.role === 'Employer'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              } uppercase tracking-wider`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400 flex items-center space-x-1.5 mt-2 md:mt-0">
                              <Calendar className="h-4 w-4 text-slate-650" />
                              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                            </td>
                            <td className="p-4 text-center">
                              {user.email === 'admin@jobbank.com' ? (
                                <span className="text-[10px] text-slate-650 font-bold uppercase tracking-wider">PROTECTED</span>
                              ) : (
                                <div className="inline-flex items-center space-x-2">
                                {user.role === 'JobSeeker' && user.profileId && (
                                  <Link
                                    to={`/admin/jobseeker/${user.profileId}`}
                                    className="p-2 text-purple-400 hover:text-purple-300 bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 rounded-lg transition-all inline-flex items-center space-x-1"
                                    title="View / Edit Profile"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span className="text-xs font-bold px-1">Edit</span>
                                  </Link>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.email)}
                                  className="p-2 text-rose-500 hover:text-rose-400 bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/30 rounded-lg transition-all cursor-pointer inline-flex items-center space-x-1"
                                  title="Terminate Account"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="text-xs font-bold px-1">Delete</span>
                                </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: JOB SEEKER PROFILES VIEW */}
          {activeTab === 'seekers' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  value={seekerSearch}
                  onChange={(e) => setSeekerSearch(e.target.value)}
                  placeholder="Search by name, ref no, NIC, mobile, or district..."
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all text-sm font-medium"
                />
              </div>

              {/* Job Seekers Table */}
              <div className="glass rounded-2xl overflow-hidden border border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-bold text-xs uppercase tracking-wider">
                        <th className="p-4">Ref No</th>
                        <th className="p-4">Name / NIC</th>
                        <th className="p-4">Mobile</th>
                        <th className="p-4">District</th>
                        <th className="p-4">Preferred Category</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Registered</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {filteredSeekers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-slate-500">
                            No job seekers match the search terms.
                          </td>
                        </tr>
                      ) : (
                        filteredSeekers.map((seeker) => (
                          <tr key={seeker.id} className="hover:bg-slate-900/30 transition-colors">
                            <td className="p-4 font-mono text-xs text-purple-400">{seeker.refNo || '—'}</td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-200">
                                  {`${seeker.firstName} ${seeker.lastName}`.trim() || '—'}
                                </span>
                                <span className="text-xs text-slate-500">{seeker.nicNumber || 'No NIC'}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-300">
                              <div className="flex items-center space-x-1.5">
                                <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                <span>{seeker.mobileNumber || '—'}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-400">{seeker.district || '—'}</td>
                            <td className="p-4 text-slate-400 truncate max-w-[180px]">{seeker.preferredJobCategories || '—'}</td>
                            <td className="p-4">
                              {seeker.applicationStatus ? (
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusBadgeClass[seeker.applicationStatus]}`}>
                                  {seeker.applicationStatus}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">Not assigned</span>
                              )}
                            </td>
                            <td className="p-4 text-slate-400">
                              <div className="flex items-center space-x-1.5">
                                <Calendar className="h-4 w-4 text-slate-650" />
                                <span>{new Date(seeker.registeredAt).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center space-x-2">
                                {seeker.resumeUrl && !seeker.resumeUrl.includes('example.com') && (
                                  <a
                                    href={seeker.resumeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/30 rounded-lg transition-all"
                                    title="View Résumé"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </a>
                                )}
                                <Link
                                  to={`/admin/jobseeker/${seeker.id}`}
                                  className="p-2 text-purple-400 hover:text-purple-300 bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 rounded-lg transition-all inline-flex items-center space-x-1"
                                  title="View / Edit Profile"
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="text-xs font-bold px-1">View / Edit</span>
                                </Link>
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
          )}

          {/* TAB: CANDIDATE POOL VIEW */}
          {activeTab === 'pool' && (
            <CandidatePool
              candidates={pool}
              vacancies={jobs.filter((j) => j.isActive && (j.remainingPositions ?? 1) > 0)}
              onAssigned={refreshUsersAndStats}
            />
          )}

          {/* TAB: WEEKLY MATCHING VIEW */}
          {activeTab === 'matching' && (
            <WeeklyMatching onAssigned={refreshUsersAndStats} />
          )}

          {/* TAB 3: JOB LISTINGS VIEW */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  placeholder="Search by job title, company, or location..."
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all text-sm font-medium"
                />
              </div>

              {/* Jobs Table */}
              <div className="glass rounded-2xl overflow-hidden border border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-bold text-xs uppercase tracking-wider">
                        <th className="p-4">Listing Title</th>
                        <th className="p-4">Organization</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Salary Scope</th>
                        <th className="p-4">Created Date</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {filteredJobs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-500">
                            No job listings match the search terms.
                          </td>
                        </tr>
                      ) : (
                        filteredJobs.map((job) => (
                          <tr key={job.id} className="hover:bg-slate-900/30 transition-colors">
                            <td className="p-4 font-bold text-slate-200">
                              <div className="flex flex-col">
                                <span>{job.title}</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <span className="inline-flex text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 max-w-max">
                                    {job.jobType}
                                  </span>
                                  <span className={`inline-flex text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded border max-w-max ${
                                    job.jobCategory
                                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  }`}>
                                    {job.jobCategory || 'No category'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-slate-300 font-semibold">{job.companyName}</td>
                            <td className="p-4 text-slate-400">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3.5 w-3.5 text-slate-650 shrink-0" />
                                <span className="truncate max-w-[150px]">{job.location}</span>
                              </div>
                            </td>
                            <td className="p-4 font-semibold text-emerald-400">
                              <div className="flex items-center space-x-0.5">
                                <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                                <span>{job.salaryRange}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-400">
                              <div className="flex items-center space-x-1.5">
                                <Calendar className="h-4 w-4 text-slate-650" />
                                <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDeleteJob(job.id, job.title)}
                                className="p-2 text-rose-500 hover:text-rose-400 bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/30 rounded-lg transition-all cursor-pointer inline-flex items-center space-x-1"
                                title="Moderate / Delete Posting"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="text-xs font-bold px-1">Take Down</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: JOB VACANCIES CARD VIEW */}
          {activeTab === 'vacancies' && (
            <div className="space-y-5">
              {/* Header row: search + summary */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                  <input
                    type="text"
                    value={vacancySearch}
                    onChange={(e) => setVacancySearch(e.target.value)}
                    placeholder="Search by title, company, location, or category..."
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                  />
                </div>
                <span className="text-xs text-slate-500 font-semibold shrink-0">
                  {filteredVacancies.length} active {filteredVacancies.length === 1 ? 'vacancy' : 'vacancies'}
                </span>
              </div>

              {/* Vacancy Cards Grid */}
              {filteredVacancies.length === 0 ? (
                <div className="glass rounded-2xl p-16 text-center text-slate-500">
                  No active vacancies match the search terms.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredVacancies.map((job) => (
                    <div
                      key={job.id}
                      className="glass rounded-2xl p-5 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col gap-4 relative overflow-hidden"
                    >
                      {/* Decorative accent */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none" />

                      {/* Title + company */}
                      <div className="flex items-start justify-between gap-2 relative z-10">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-100 leading-snug">{job.title}</h3>
                          <div className="flex items-center space-x-1 mt-0.5">
                            <Building2 className="h-3 w-3 text-slate-500 shrink-0" />
                            <span className="text-xs text-slate-400 font-semibold truncate">{job.companyName}</span>
                          </div>
                        </div>
                        <span className="inline-flex px-2 py-0.5 rounded text-[9px] uppercase font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                          {job.jobType}
                        </span>
                      </div>

                      {/* Category badge */}
                      <div className="relative z-10">
                        <span className="inline-flex px-2 py-0.5 rounded text-[9px] uppercase font-extrabold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {job.jobCategory || 'Uncategorised'}
                        </span>
                      </div>

                      {/* Key Details */}
                      <div className="relative z-10 space-y-2">
                        {/* Location */}
                        <div className="flex items-center space-x-2 bg-slate-950/40 rounded-lg px-3 py-2 border border-slate-800">
                          <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Location</p>
                            <p className="text-xs text-slate-200 font-semibold mt-0.5">{job.location || '—'}</p>
                          </div>
                        </div>

                        {/* Positions Available */}
                        <div className="flex items-center space-x-2 bg-slate-950/40 rounded-lg px-3 py-2 border border-slate-800">
                          <UsersRound className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Positions Available</p>
                            {(job.remainingPositions ?? job.positionsAvailable ?? 1) > 0 ? (
                              <p className="text-xs font-extrabold mt-0.5">
                                <span className="text-sky-300 text-sm">{job.remainingPositions ?? job.positionsAvailable ?? 1}</span>
                                <span className="text-slate-400 ml-1">of {job.positionsAvailable ?? 1} {(job.positionsAvailable ?? 1) === 1 ? 'position' : 'positions'}</span>
                              </p>
                            ) : (
                              <p className="text-xs font-extrabold mt-0.5 text-rose-400">All {job.positionsAvailable} filled</p>
                            )}
                            {(job.filledPositions ?? 0) > 0 && (
                              <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">{job.filledPositions} selected by employer</p>
                            )}
                          </div>
                        </div>

                        {/* Salary */}
                        <div className="flex items-center space-x-2 bg-slate-950/40 rounded-lg px-3 py-2 border border-slate-800">
                          <Banknote className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Salary Range</p>
                            <p className="text-xs text-emerald-300 font-extrabold mt-0.5">{job.salaryRange || '—'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Footer: posted date */}
                      <div className="relative z-10 flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <div className="flex items-center space-x-1 text-slate-500">
                          <Calendar className="h-3 w-3" />
                          <span className="text-[10px]">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: USER REGISTRATION VIEW */}
          {activeTab === 'register' && (
            <UserRegistration onRegistered={refreshUsersAndStats} />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
