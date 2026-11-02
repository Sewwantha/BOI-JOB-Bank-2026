import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, Banknote, SlidersHorizontal, AlertCircle, CheckCircle, FileText, Upload, X } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Job {
  id: string;
  companyProfileId: string;
  companyName: string;
  companyLogoUrl: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salaryRange: string;
  jobType: string;
  createdAt: string;
}

const JobDashboard: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Application Modal/Form State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [profileResumeUrl, setProfileResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch seeker profile for the default resume (used when no document is attached)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/jobseeker/user/${user?.userId}`);
        const url: string = res.data?.resumeUrl || '';
        if (url && !url.includes('example.com')) {
          setProfileResumeUrl(url);
        }
      } catch (err) {
        console.error('Error fetching seeker profile resume', err);
      }
    };
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let url = '/job';
      const params: string[] = [];
      if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
      if (locationFilter) params.push(`location=${encodeURIComponent(locationFilter)}`);
      if (typeFilter) params.push(`type=${typeFilter}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await api.get(url);
      setJobs(res.data);
      if (res.data.length > 0) {
        setSelectedJob(res.data[0]);
      } else {
        setSelectedJob(null);
      }
    } catch (err) {
      console.error('Error fetching jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [typeFilter]); // Refetch on filter toggle

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const ALLOWED_RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx'];
  const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5 MB

  const selectResumeFile = (file: File | undefined) => {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_RESUME_EXTENSIONS.includes(ext)) {
      setMessage({ type: 'error', text: 'Please attach a PDF, DOC or DOCX file.' });
      return;
    }
    if (file.size > MAX_RESUME_SIZE) {
      setMessage({ type: 'error', text: 'File is too large. Maximum size is 5 MB.' });
      return;
    }
    setMessage(null);
    setResumeFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    selectResumeFile(e.dataTransfer.files?.[0]);
  };

  const closeApplyModal = () => {
    setShowApplyModal(false);
    setResumeFile(null);
    setMessage(null);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    if (!resumeFile && !profileResumeUrl) {
      setMessage({ type: 'error', text: 'Please attach your résumé / CV document.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      let resumeUrl = profileResumeUrl;
      if (resumeFile) {
        const formData = new FormData();
        formData.append('file', resumeFile);
        const uploadRes = await api.post('/upload/document', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        resumeUrl = uploadRes.data.url;
      }

      await api.post('/application', {
        jobPostId: selectedJob.id,
        resumeUrl,
        coverLetter,
      });

      setMessage({ type: 'success', text: 'Application submitted successfully!' });
      setCoverLetter('');
      setTimeout(closeApplyModal, 2000);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit application. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-start">
      {/* Header and Search Form */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-100 mb-2">Explore Opportunities</h1>
        <p className="text-slate-400 mb-6">Find your dream job from our curated bank of open postings</p>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 glass rounded-3xl">
          {/* Keyword Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title, skills, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-slate-700 bg-slate-900/50 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
          </div>

          {/* Location Search */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="City, state, or Remote"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-slate-700 bg-slate-900/50 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl shadow-md hover:shadow-purple-500/25 transition-all duration-200 cursor-pointer"
          >
            Find Jobs
          </button>
        </form>

        {/* Filter Quick Tags */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Quick Filters:</span>
          </span>
          {[
            { label: 'All Jobs', value: '' },
            { label: 'Full Time', value: '0' },
            { label: 'Contract', value: '2' },
            { label: 'Internship', value: '4' },
          ].map((type) => (
            <button
              key={type.label}
              onClick={() => setTypeFilter(type.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                typeFilter === type.value
                  ? 'bg-purple-600/10 border-purple-500 text-purple-400 shadow-md shadow-purple-500/5'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Interface */}
      {loading ? (
        <div className="flex-grow flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl border border-dashed border-slate-800">
          <Briefcase className="h-16 w-16 mx-auto text-slate-700 mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-slate-300">No jobs found</h3>
          <p className="text-slate-500 mt-2">Try adjusting your keywords or quick filter tags.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Jobs List (Left Col) */}
          <div className="lg:col-span-2 space-y-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  selectedJob?.id === job.id
                    ? 'bg-slate-800/80 border-purple-500 shadow-md shadow-purple-500/10'
                    : 'glass hover:bg-slate-850/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
                      {job.jobType}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 line-clamp-1">{job.title}</h3>
                  <p className="text-purple-400 text-xs font-semibold mt-0.5">{job.companyName}</p>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate max-w-[120px]">{job.location}</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">{job.salaryRange}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Job Details Card (Right Col) */}
          <div className="lg:col-span-3 glass p-8 rounded-3xl border border-slate-800 h-[650px] flex flex-col justify-between overflow-y-auto">
            {selectedJob ? (
              <div className="flex flex-col justify-between h-full">
                {/* Details Top */}
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                        {selectedJob.jobType}
                      </span>
                      <h2 className="text-2xl font-extrabold text-slate-100 mt-3">{selectedJob.title}</h2>
                      <p className="text-purple-400 font-bold text-md mt-1">{selectedJob.companyName}</p>
                    </div>

                    {selectedJob.companyLogoUrl && (
                      <img
                        src={selectedJob.companyLogoUrl}
                        alt={selectedJob.companyName}
                        className="h-16 w-16 rounded-2xl object-cover border border-slate-700 bg-slate-800 p-1 shrink-0"
                      />
                    )}
                  </div>

                  {/* Icon details pill block */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <div className="flex items-center space-x-2 text-sm text-slate-300">
                      <MapPin className="h-4 w-4 text-purple-400" />
                      <span>{selectedJob.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-300">
                      <Banknote className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">{selectedJob.salaryRange}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Job Description</h4>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Requirements</h4>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedJob.requirements}</p>
                  </div>
                </div>

                {/* Apply Trigger */}
                <div className="pt-6 border-t border-slate-800 mt-6">
                  <button
                    onClick={() => {
                      setMessage(null);
                      setCoverLetter('');
                      setShowApplyModal(true);
                    }}
                    className="w-full py-4.5 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg hover:shadow-purple-500/25 transition-all duration-200 cursor-pointer"
                  >
                    Apply for this Position
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-center items-center text-slate-500">
                <Briefcase className="h-12 w-12 mb-2" />
                <p>Select a job to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-lg w-full glass p-8 rounded-3xl shadow-2xl relative border border-slate-800">
            <h3 className="text-xl font-extrabold text-slate-100 mb-2">Apply for Position</h3>
            <p className="text-sm text-slate-400 mb-6">
              Applying to <span className="text-purple-400 font-bold">{selectedJob.title}</span> at <span className="text-indigo-300 font-semibold">{selectedJob.companyName}</span>
            </p>

            {message && (
              <div
                className={`p-4 mb-4 rounded-xl text-sm flex items-center space-x-2 border ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleApply} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Résumé / CV Document</label>
                {resumeFile ? (
                  <div className="flex items-center justify-between p-3 border border-purple-500/30 bg-purple-500/5 rounded-xl">
                    <div className="flex items-center space-x-3 min-w-0">
                      <FileText className="h-5 w-5 text-purple-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{resumeFile.name}</p>
                        <p className="text-[10px] text-slate-500">{(resumeFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      aria-label="Remove attached document"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="apply-resume-upload"
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      dragActive
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-700 bg-slate-900/50 hover:border-purple-500/50 hover:bg-slate-900'
                    }`}
                  >
                    <Upload className="h-7 w-7 text-slate-500 mb-2" />
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold text-purple-400">Click to attach</span> or drag and drop
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">PDF, DOC or DOCX (max 5 MB)</p>
                  </label>
                )}
                <input
                  id="apply-resume-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    selectResumeFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                {!resumeFile && profileResumeUrl && (
                  <p className="text-[10px] text-slate-500 mt-1">If no document is attached, the résumé from your profile will be used.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Cover Letter</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Introduce yourself and explain why you are a great fit for this role..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm leading-relaxed"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={closeApplyModal}
                  className="w-1/2 py-3 border border-slate-700 hover:bg-slate-800 rounded-xl text-sm font-bold text-slate-300 transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-3 font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 cursor-pointer flex justify-center items-center"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDashboard;
