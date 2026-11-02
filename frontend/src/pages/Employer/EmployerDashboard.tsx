import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Briefcase, Users, FileText, LayoutDashboard, Plus, Search, LogOut,
  MapPin, Calendar, Edit3, Trash2, CheckCircle, BarChart3, TrendingUp, Users2
} from 'lucide-react';
import api from '../../services/api';
import ThemeToggle from '../../components/ThemeToggle';

interface Job {
  id: string;
  title: string;
  location: string;
  salaryRange: string;
  jobType: string;
  isActive: boolean;
  createdAt: string;
}

const EmployerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'candidates' | 'reports'>('dashboard');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState('HR Manager');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Jobs
      const jobsRes = await api.get('/job/employer');
      setJobs(jobsRes.data);

      // Fetch Applications
      const appsRes = await api.get('/application/employer');
      setApplications(appsRes.data);

      // Fetch Company Profile to get Name dynamically
      if (user?.userId) {
        try {
          const compRes = await api.get(`/company/user/${user.userId}`);
          if (compRes.data && compRes.data.companyName) {
            setCompanyName(compRes.data.companyName);
          }
        } catch (compErr) {
          console.error("Could not fetch company profile, using default name", compErr);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteJob = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/job/${id}`);
      setJobs(jobs.filter((j) => j.id !== id));
      // Clean up local applications state for deleted job
      setApplications(applications.filter((a) => a.jobPostId !== id));
    } catch (err) {
      console.error('Error deleting job', err);
      alert('Failed to delete job. Please try again.');
    }
  };

  const renderStageBadge = (status: string) => {
    switch (status) {
      case 'Accepted':
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/25 uppercase tracking-wide">
            Hired
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-455 border border-rose-500/25 uppercase tracking-wide">
            Rejected
          </span>
        );
      case 'Shortlisted':
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/25 uppercase tracking-wide">
            Interview
          </span>
        );
      case 'Reviewing':
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25 uppercase tracking-wide">
            Screening
          </span>
        );
      default:
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 uppercase tracking-wide">
            Applied
          </span>
        );
    }
  };

  // Pre-calculate application count summaries per job
  const appSummaries: Record<string, number> = {};
  applications.forEach((app) => {
    appSummaries[app.jobPostId] = (appSummaries[app.jobPostId] || 0) + 1;
  });

  // Filter candidates/applications by search term
  const filteredApps = applications.filter((app) => 
    (app.seekerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (app.jobTitle?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans w-full selection:bg-purple-650 selection:text-white">
      {/* 1. Sidebar Panel */}
      <aside className="w-64 bg-slate-900/40 backdrop-blur-md border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
        <div>
          {/* Logo Section */}
          <div className="p-6 border-b border-slate-800/60 flex items-center">
            <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-500 bg-clip-text text-transparent">
              BOI Job Bank
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-6 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 py-2.5 rounded-r-xl transition-all border-l-4 cursor-pointer text-left ${
                activeTab === 'dashboard'
                  ? 'bg-purple-500/10 text-purple-400 font-bold border-purple-500 pl-3'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border-transparent font-medium pl-4'
              }`}
            >
              <LayoutDashboard className="h-5 w-5 shrink-0" />
              <span className="text-sm">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('jobs')}
              className={`w-full flex items-center space-x-3 py-2.5 rounded-r-xl transition-all border-l-4 cursor-pointer text-left ${
                activeTab === 'jobs'
                  ? 'bg-purple-500/10 text-purple-400 font-bold border-purple-500 pl-3'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border-transparent font-medium pl-4'
              }`}
            >
              <Briefcase className="h-5 w-5 shrink-0" />
              <span className="text-sm">My Jobs</span>
            </button>

            <button
              onClick={() => setActiveTab('candidates')}
              className={`w-full flex items-center space-x-3 py-2.5 rounded-r-xl transition-all border-l-4 cursor-pointer text-left ${
                activeTab === 'candidates'
                  ? 'bg-purple-500/10 text-purple-400 font-bold border-purple-500 pl-3'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border-transparent font-medium pl-4'
              }`}
            >
              <Users className="h-5 w-5 shrink-0" />
              <span className="text-sm">Candidates</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center space-x-3 py-2.5 rounded-r-xl transition-all border-l-4 cursor-pointer text-left ${
                activeTab === 'reports'
                  ? 'bg-purple-500/10 text-purple-400 font-bold border-purple-500 pl-3'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border-transparent font-medium pl-4'
              }`}
            >
              <FileText className="h-5 w-5 shrink-0" />
              <span className="text-sm">Reports</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/60 flex flex-col space-y-3 bg-slate-950/20">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-extrabold flex items-center justify-center text-sm shrink-0">
              {companyName.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <h4 className="text-sm font-bold text-slate-200 truncate leading-tight">{companyName}</h4>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Employer Account</p>
            </div>
          </div>
          <ThemeToggle showLabel className="w-full mb-2 py-2 px-3 text-xs" />
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-slate-900/60 hover:bg-slate-900 text-rose-400 border border-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto px-8 md:px-12 py-10 flex flex-col justify-start">
        {loading ? (
          <div className="flex-grow flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {/* VIEW A: DASHBOARD VIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 w-full">
                {/* Top Header */}
                <div className="flex justify-between items-center w-full shrink-0">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 leading-tight">
                      Employer Dashboard
                    </h1>
                  </div>
                  <Link
                    to="/post-job"
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold flex items-center space-x-2 shadow-lg hover:shadow-purple-500/25 transition-all duration-200 cursor-pointer shrink-0"
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    <span>Post a New Job</span>
                  </Link>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-xl p-6 shadow-lg hover:border-purple-500/20 transition-all cursor-pointer" onClick={() => setActiveTab('jobs')}>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Active Jobs
                    </span>
                    <span className="text-3xl md:text-4xl font-extrabold text-slate-100">
                      {jobs.length}
                    </span>
                  </div>

                  <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-xl p-6 shadow-lg hover:border-purple-500/20 transition-all cursor-pointer" onClick={() => setActiveTab('candidates')}>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      New Applicants
                    </span>
                    <span className="text-3xl md:text-4xl font-extrabold text-slate-100">
                      {applications.length}
                    </span>
                  </div>

                  <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-xl p-6 shadow-lg hover:border-purple-500/20 transition-all cursor-pointer" onClick={() => setActiveTab('candidates')}>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Interviews Scheduled
                    </span>
                    <span className="text-3xl md:text-4xl font-extrabold text-slate-100">
                      {applications.filter((a) => a.status === 'Shortlisted' || a.status === 'Accepted').length}
                    </span>
                  </div>
                </div>

                {/* Recent Applications Card */}
                <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-lg overflow-hidden w-full">
                  <div className="p-6 border-b border-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-extrabold text-slate-100">
                      Recent Applications
                    </h3>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search candidates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-800 bg-slate-950/50 hover:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20 rounded-lg text-sm transition-all text-slate-200 placeholder-slate-500"
                      />
                    </div>
                  </div>

                  {filteredApps.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-sm">
                      No applicants found matching your query.
                    </div>
                  ) : (
                    <div className="overflow-x-auto w-full">
                      <table className="min-w-full divide-y divide-slate-800/60 text-left">
                        <thead>
                          <tr className="bg-slate-950/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-6 py-4">Applicant Name</th>
                            <th className="px-6 py-4">Job Applied</th>
                            <th className="px-6 py-4">Stage</th>
                            <th className="px-6 py-4">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-sm">
                          {filteredApps.map((app) => (
                            <tr key={app.id} className="hover:bg-slate-900/20 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Link
                                  to={`/manage-applicants/${app.jobPostId}`}
                                  className="font-bold text-purple-400 hover:text-purple-300 hover:underline"
                                >
                                  {app.seekerName}
                                </Link>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-300 font-medium">
                                {app.jobTitle}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {renderStageBadge(app.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Link
                                  to={`/manage-applicants/${app.jobPostId}`}
                                  className="text-slate-400 hover:text-purple-350 font-bold hover:underline"
                                >
                                  View Profile
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW B: MY JOBS VIEW */}
            {activeTab === 'jobs' && (
              <div className="space-y-8 w-full">
                {/* Top Header */}
                <div className="flex justify-between items-center w-full shrink-0">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 leading-tight">
                      My Job Listings
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Manage and edit your active job positions</p>
                  </div>
                  <Link
                    to="/post-job"
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold flex items-center space-x-2 shadow-lg hover:shadow-purple-500/25 transition-all duration-200 cursor-pointer shrink-0"
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    <span>Post a New Job</span>
                  </Link>
                </div>

                {jobs.length === 0 ? (
                  <div className="text-center py-20 bg-slate-900/30 backdrop-blur-md rounded-3xl border border-dashed border-slate-800">
                    <Briefcase className="h-16 w-16 mx-auto text-slate-700 mb-4 animate-pulse" />
                    <h3 className="text-xl font-bold text-slate-300">No active job listings</h3>
                    <p className="text-slate-500 mt-2">Get started by creating your first job posting today!</p>
                    <Link
                      to="/post-job"
                      className="mt-6 inline-flex justify-center items-center space-x-1 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-slate-50 border border-slate-700 rounded-xl text-sm font-bold text-slate-200 transition-all"
                    >
                      Create Job Post
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job) => {
                      const applicantCount = appSummaries[job.id] || 0;
                      return (
                        <div key={job.id} className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between h-[320px] relative hover:border-purple-500/35 transition-all">
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                                {job.jobType}
                              </span>
                              <span className="text-xs text-slate-500 flex items-center space-x-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                              </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-100 line-clamp-2 leading-tight mb-2">{job.title}</h3>
                            
                            <div className="space-y-1.5 text-xs text-slate-400 mt-4">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-emerald-400 font-semibold">{job.salaryRange}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Items */}
                          <div className="pt-4 border-t border-slate-800/60 mt-6 flex justify-between items-center">
                            <Link
                              to={`/manage-applicants/${job.id}`}
                              className="flex items-center space-x-1.5 text-purple-400 hover:text-purple-300 text-xs font-bold bg-purple-500/5 hover:bg-purple-500/15 border border-purple-500/15 px-3.5 py-2 rounded-xl transition-all"
                            >
                              <Users className="h-4 w-4" />
                              <span>Applicants ({applicantCount})</span>
                            </Link>

                            <div className="flex items-center space-x-2">
                              <Link
                                to={`/post-job?editId=${job.id}`}
                                className="p-2 text-slate-400 hover:text-purple-400 bg-slate-950/40 border border-slate-850 rounded-xl hover:border-purple-500/20 transition-all"
                                title="Edit Post"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="p-2 text-rose-500/80 hover:text-rose-450 bg-slate-950/40 border border-slate-850 rounded-xl hover:border-rose-500/20 transition-all cursor-pointer"
                                title="Delete Post"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW C: CANDIDATES VIEW */}
            {activeTab === 'candidates' && (
              <div className="space-y-8 w-full">
                {/* Top Header */}
                <div className="flex justify-between items-center w-full shrink-0">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 leading-tight">
                      Candidates
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Review all active profiles seeking your listed positions</p>
                  </div>
                </div>

                {/* Candidate Search table */}
                <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-lg overflow-hidden w-full">
                  <div className="p-6 border-b border-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-extrabold text-slate-100">
                      All Registered Candidates
                    </h3>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search candidates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-800 bg-slate-950/50 hover:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20 rounded-lg text-sm transition-all text-slate-200 placeholder-slate-500"
                      />
                    </div>
                  </div>

                  {filteredApps.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-sm">
                      No candidate profiles found matching your query.
                    </div>
                  ) : (
                    <div className="overflow-x-auto w-full">
                      <table className="min-w-full divide-y divide-slate-800/60 text-left">
                        <thead>
                          <tr className="bg-slate-950/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-6 py-4">Applicant Name</th>
                            <th className="px-6 py-4">Job Applied</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Date Applied</th>
                            <th className="px-6 py-4">Stage</th>
                            <th className="px-6 py-4">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-sm">
                          {filteredApps.map((app) => (
                            <tr key={app.id} className="hover:bg-slate-900/20 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Link
                                  to={`/manage-applicants/${app.jobPostId}`}
                                  className="font-bold text-purple-400 hover:text-purple-300 hover:underline"
                                >
                                  {app.seekerName}
                                </Link>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-300 font-medium">
                                {app.jobTitle}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                                {app.seekerEmail}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                {new Date(app.appliedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {renderStageBadge(app.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Link
                                  to={`/manage-applicants/${app.jobPostId}`}
                                  className="text-slate-400 hover:text-purple-350 font-bold hover:underline"
                                >
                                  View Profile
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW D: REPORTS VIEW */}
            {activeTab === 'reports' && (
              <div className="space-y-8 w-full">
                {/* Top Header */}
                <div className="flex justify-between items-center w-full shrink-0">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 leading-tight">
                      Recruiting Analytics & Reports
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Recruitment pipeline ratios and performance statistics</p>
                  </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-3 text-slate-400">
                      <span className="text-xs font-bold uppercase tracking-wide">Jobs Published</span>
                      <Briefcase className="h-5 w-5 text-purple-400" />
                    </div>
                    <span className="text-3xl font-extrabold text-slate-100">{jobs.length}</span>
                  </div>

                  <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-3 text-slate-400">
                      <span className="text-xs font-bold uppercase tracking-wide">Overall Candidates</span>
                      <Users2 className="h-5 w-5 text-indigo-400" />
                    </div>
                    <span className="text-3xl font-extrabold text-slate-100">{applications.length}</span>
                  </div>

                  <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-3 text-slate-400">
                      <span className="text-xs font-bold uppercase tracking-wide">Hired Rate</span>
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                    <span className="text-3xl font-extrabold text-slate-100">
                      {applications.length > 0
                        ? `${((applications.filter(a => a.status === 'Accepted').length / applications.length) * 100).toFixed(0)}%`
                        : '0%'
                      }
                    </span>
                  </div>

                  <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-3 text-slate-400">
                      <span className="text-xs font-bold uppercase tracking-wide">Shortlist Rate</span>
                      <TrendingUp className="h-5 w-5 text-purple-400" />
                    </div>
                    <span className="text-3xl font-extrabold text-slate-100">
                      {applications.length > 0
                        ? `${((applications.filter(a => a.status === 'Shortlisted').length / applications.length) * 100).toFixed(0)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                </div>

                {/* Progress bars of stages */}
                <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-8 shadow-lg space-y-6">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    <span>Recruitment Funnel Overview</span>
                  </h3>

                  <div className="space-y-4">
                    {/* Applied */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                        <span>Applied Stage</span>
                        <span>{applications.filter(a => a.status === 'Applied').length} Candidates</span>
                      </div>
                      <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${applications.length > 0 
                              ? (applications.filter(a => a.status === 'Applied').length / applications.length) * 100 
                              : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Screening */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                        <span>Screening / Reviewing</span>
                        <span>{applications.filter(a => a.status === 'Reviewing').length} Candidates</span>
                      </div>
                      <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${applications.length > 0 
                              ? (applications.filter(a => a.status === 'Reviewing').length / applications.length) * 100 
                              : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Shortlisted */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                        <span>Interview / Shortlisted</span>
                        <span>{applications.filter(a => a.status === 'Shortlisted').length} Candidates</span>
                      </div>
                      <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${applications.length > 0 
                              ? (applications.filter(a => a.status === 'Shortlisted').length / applications.length) * 100 
                              : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Accepted */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                        <span>Hired / Accepted</span>
                        <span>{applications.filter(a => a.status === 'Accepted').length} Candidates</span>
                      </div>
                      <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${applications.length > 0 
                              ? (applications.filter(a => a.status === 'Accepted').length / applications.length) * 100 
                              : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default EmployerDashboard;
