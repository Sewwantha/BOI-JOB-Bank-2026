import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Calendar, FileText, CheckCircle, XCircle, 
  Clock, Award, ThumbsUp, ChevronRight, User, ExternalLink, Briefcase, MapPin, Tag
} from 'lucide-react';
import api from '../../services/api';

interface Application {
  id: string;
  jobPostId: string;
  jobTitle: string;
  companyName: string;
  jobSeekerProfileId: string;
  seekerName: string;
  seekerEmail: string;
  resumeUrl: string;
  coverLetter: string;
  status: 'Applied' | 'Reviewing' | 'Shortlisted' | 'Accepted' | 'Rejected';
  rejectionRemark?: string;
  appliedAt: string;
  seekerPhone?: string;
  seekerAddress?: string;
  seekerSkills?: string;
  seekerEducation?: string;
  seekerVocationalTraining?: string;
  seekerExperience?: string;
}

interface Job {
  id: string;
  title: string;
  jobType: string;
  location: string;
  salaryRange: string;
  isActive: boolean;
}

const ManageApplicants: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionRemark, setRejectionRemark] = useState('');

  const selectApp = (app: Application) => {
    setSelectedApp(app);
    setRejecting(false);
    setRejectionRemark('');
  };

  const fetchJobAndApplicants = async () => {
    if (!jobId) return;
    try {
      // Get Job info
      const jobRes = await api.get(`/job/${jobId}`);
      setJob(jobRes.data);

      // Get applications for the job
      const appsRes = await api.get(`/application/job/${jobId}`);
      const appsData: Application[] = appsRes.data;
      setApplications(appsData);
      
      // Auto-select the first applicant if any exist
      if (appsData.length > 0) {
        setSelectedApp(appsData[0]);
      }
    } catch (err) {
      console.error('Error fetching job or applicants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobAndApplicants();
  }, [jobId]);

  const handleUpdateStatus = async (appId: string, newStatus: Application['status'], remark = '') => {
    setUpdatingId(appId);
    try {
      await api.put(`/application/${appId}/status`, { status: newStatus, rejectionRemark: remark });
      const changes = { status: newStatus, rejectionRemark: newStatus === 'Rejected' ? remark : '' };
      
      // Update applications state
      const updatedApps = applications.map((app) => 
        app.id === appId ? { ...app, ...changes } : app
      );
      setApplications(updatedApps);
      
      // Update selected application state
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp({ ...selectedApp, ...changes });
      }
      setRejecting(false);
      setRejectionRemark('');
    } catch (err: unknown) {
      console.error('Error updating application status', err);
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: Application['status']) => {
    switch (status) {
      case 'Accepted':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="h-3 w-3" />
            <span>Accepted</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" />
            <span>Rejected</span>
          </span>
        );
      case 'Shortlisted':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Award className="h-3 w-3" />
            <span>Shortlisted</span>
          </span>
        );
      case 'Reviewing':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            <span>Reviewing</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Clock className="h-3 w-3" />
            <span>Applied</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-start">
      {/* Navigation Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/employer-dashboard')}
          className="flex items-center space-x-2 text-sm text-slate-400 hover:text-purple-400 transition-colors mb-4 group cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Listings</span>
        </button>

        {job && (
          <div className="glass p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                  {job.jobType}
                </span>
                <span className="text-slate-500 text-xs flex items-center space-x-1">
                  <Tag className="h-3 w-3" />
                  <span>Salary: <span className="text-emerald-400 font-medium">{job.salaryRange}</span></span>
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-100 flex items-center space-x-2">
                <Briefcase className="h-6 w-6 text-purple-500" />
                <span>Applicants for: <span className="text-purple-400">{job.title}</span></span>
              </h1>
              <p className="text-slate-400 text-sm mt-1.5 flex items-center space-x-1">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>{job.location}</span>
              </p>
            </div>
            <div className="bg-slate-900/60 px-4 py-3 rounded-xl border border-slate-800 text-center shrink-0">
              <span className="block text-2xl font-extrabold text-purple-400">{applications.length}</span>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Candidates</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-grow flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl border border-dashed border-slate-800">
          <User className="h-16 w-16 mx-auto text-slate-700 mb-4 animate-pulse" />
          <h3 className="text-xl font-bold text-slate-300">No applications received yet</h3>
          <p className="text-slate-500 mt-2">When seekers apply for this job posting, they will show up here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Candidates List Column */}
          <div className="lg:col-span-5 space-y-4 max-h-[680px] overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Candidates</h3>
            {applications.map((app) => (
              <button
                key={app.id}
                onClick={() => selectApp(app)}
                className={`w-full text-left p-4 rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer ${
                  selectedApp?.id === app.id
                    ? 'bg-purple-600/15 border border-purple-500/40 shadow-md shadow-purple-500/5'
                    : 'glass hover:bg-slate-800 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedApp?.id === app.id ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-sm font-bold text-slate-200 truncate">{app.seekerName}</h4>
                    <p className="text-slate-500 text-xs mt-1 truncate">{app.seekerEmail}</p>
                    <p className="text-slate-600 text-[10px] mt-1.5 flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(app.appliedAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0 ml-3">
                  {getStatusBadge(app.status)}
                  <ChevronRight className={`h-4 w-4 transition-transform ${
                    selectedApp?.id === app.id ? 'text-purple-400 translate-x-1' : 'text-slate-600'
                  }`} />
                </div>
              </button>
            ))}
          </div>

          {/* Details Pane Column */}
          <div className="lg:col-span-7">
            {selectedApp ? (
              <div className="glass p-8 rounded-3xl relative overflow-hidden flex flex-col h-full min-h-[500px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none"></div>

                {/* Profile Meta Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-5 mb-6 gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shadow-inner">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-100">{selectedApp.seekerName}</h3>
                      <a 
                        href={`mailto:${selectedApp.seekerEmail}`} 
                        className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center space-x-1 mt-1 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5 text-purple-500" />
                        <span>{selectedApp.seekerEmail}</span>
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Current Status</span>
                    {getStatusBadge(selectedApp.status)}
                  </div>
                </div>

                {/* Cover Letter Section */}
                <div className="flex-grow space-y-6">
                  {selectedApp.status === 'Rejected' && selectedApp.rejectionRemark && (
                    <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-2xl">
                      <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Rejection Remark</span>
                      </h4>
                      <p className="text-slate-300 text-sm whitespace-pre-wrap">{selectedApp.rejectionRemark}</p>
                    </div>
                  )}

                  {/* Candidate Profile Details Section */}
                  <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <User className="h-4 w-4" />
                      <span>Profile Details (CV Extraction)</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block font-semibold">Phone Number</span>
                        <span className="text-slate-200 font-medium">{selectedApp.seekerPhone || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-semibold">Address / District</span>
                        <span className="text-slate-200 font-medium">{selectedApp.seekerAddress || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-semibold">Education</span>
                        <span className="text-slate-200 font-medium">{selectedApp.seekerEducation || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-semibold">Work Experience</span>
                        <span className="text-slate-200 font-medium">{selectedApp.seekerExperience || 'Not specified'}</span>
                      </div>
                      {selectedApp.seekerVocationalTraining && selectedApp.seekerVocationalTraining !== 'None' && (
                        <div className="md:col-span-2">
                          <span className="text-slate-500 block font-semibold">Vocational Training</span>
                          <span className="text-slate-200 font-medium">{selectedApp.seekerVocationalTraining}</span>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <span className="text-slate-500 block font-semibold mb-1">Key Skills</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedApp.seekerSkills ? (
                            selectedApp.seekerSkills.split(',').map((skill, idx) => (
                              <span key={idx} className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md font-mono font-semibold tracking-wide">
                                {skill.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">No skills extracted</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1">
                      <FileText className="h-3.5 w-3.5 text-purple-500" />
                      <span>Cover Letter / Pitch</span>
                    </h4>
                    <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl max-h-[220px] overflow-y-auto custom-scrollbar">
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedApp.coverLetter || 'No cover letter provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Resume Section */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1">
                      <FileText className="h-3.5 w-3.5 text-purple-500" />
                      <span>Resume Materials</span>
                    </h4>
                    {selectedApp.resumeUrl ? (
                      <div className="flex items-center justify-between bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
                        <div className="flex items-center space-x-3 truncate">
                          <FileText className="h-6 w-6 text-purple-400 shrink-0" />
                          <div className="truncate">
                            <p className="text-sm font-semibold text-slate-300 truncate">Candidate_Resume.pdf</p>
                            <p className="text-slate-500 text-[10px] truncate max-w-[280px] sm:max-w-sm">{selectedApp.resumeUrl}</p>
                          </div>
                        </div>
                        <a
                          href={selectedApp.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 text-xs font-bold px-3.5 py-2.5 rounded-lg border border-purple-500/15 hover:border-purple-500/30 transition-all ml-4 shrink-0"
                        >
                          <span>Open Link</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm italic">No resume URL was supplied by the applicant.</p>
                    )}
                  </div>
                </div>

                {/* Status Toggles Pane */}
                <div className="border-t border-slate-800 pt-6 mt-8">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Set Status Decision</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => handleUpdateStatus(selectedApp.id, 'Reviewing')}
                      disabled={updatingId !== null || selectedApp.status === 'Reviewing'}
                      className="px-3 py-2.5 bg-slate-900 border border-slate-800 hover:border-amber-500/30 hover:bg-amber-500/5 text-slate-300 disabled:opacity-40 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span>Review</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedApp.id, 'Shortlisted')}
                      disabled={updatingId !== null || selectedApp.status === 'Shortlisted'}
                      className="px-3 py-2.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-slate-300 disabled:opacity-40 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Award className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Shortlist</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedApp.id, 'Accepted')}
                      disabled={updatingId !== null || selectedApp.status === 'Accepted'}
                      className="px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-400 disabled:opacity-40 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => setRejecting(true)}
                      disabled={updatingId !== null || selectedApp.status === 'Rejected' || rejecting}
                      className="px-3 py-2.5 bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/20 text-rose-400 disabled:opacity-40 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>

                  {rejecting && (
                    <div className="mt-4 bg-rose-500/5 border border-rose-500/20 p-4 rounded-2xl space-y-3">
                      <label className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                        Reason for Rejection <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        autoFocus
                        value={rejectionRemark}
                        onChange={(e) => setRejectionRemark(e.target.value)}
                        placeholder="Explain why this applicant is not selected"
                        className="block w-full px-3 py-2.5 border border-slate-700 bg-slate-900/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all"
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => { setRejecting(false); setRejectionRemark(''); }}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedApp.id, 'Rejected', rejectionRemark.trim())}
                          disabled={updatingId !== null || !rejectionRemark.trim()}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center space-x-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Confirm Reject</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass p-8 rounded-3xl h-full min-h-[500px] flex flex-col justify-center items-center text-slate-500">
                <p>Select a candidate from the left to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageApplicants;
