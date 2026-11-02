import React, { useState, useEffect } from 'react';
import {
  FileText, Calendar, Building, Upload, Loader2, CheckCircle, AlertCircle,
  User, Phone, MapPin, GraduationCap, Wrench, Briefcase, Code, ChevronDown, ChevronUp,
  Link2, Award, Languages
} from 'lucide-react';
import api from '../../services/api';

/* ─── Interfaces ─── */
interface Application {
  id: string;
  jobPostId: string;
  jobTitle: string;
  companyName: string;
  coverLetter: string;
  resumeUrl: string;
  status: 'Applied' | 'Reviewing' | 'Shortlisted' | 'Accepted' | 'Rejected';
  rejectionRemark?: string;
  appliedAt: string;
}

interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  period: string;
  description: string[];
}

interface Education {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  year: string;
}

interface SkillCategory {
  categoryName: string;
  skills: string[];
}

interface SocialLink {
  platform: string;
  url: string;
}

interface ParsedCvData {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: SkillCategory[];
  languages: string[];
  links: SocialLink[];
  completenessScore: number;
  sectionOrder: string[];
}

/* ─── Component ─── */
const MyApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCvData | null>(null);
  const [rawJson, setRawJson] = useState<string>('');
  const [showJson, setShowJson] = useState(false);

  /* ─── CV Upload Handler ─── */
  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type) && !file.name.endsWith('.doc')) {
      setMessage({ type: 'error', text: 'Please upload a PDF or DOCX file only.' });
      return;
    }

    setUploading(true);
    setMessage(null);
    setParsedData(null);
    setRawJson('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // The backend runs the Python parser (parse_cv.py) and returns its result
      const parseRes = await api.post('/jobseeker/parse-cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (parseRes.data) {
        const parsed: ParsedCvData = parseRes.data;
        setParsedData(parsed);
        setRawJson(JSON.stringify(parsed, null, 2));

        setMessage({
          type: 'success',
          text: `CV parsed successfully! Completeness: ${parsed.completenessScore}%`,
        });
      }
    } catch (err: unknown) {
      console.error('Error uploading/parsing CV:', err);
      const error = err as { response?: { data?: { message?: string; details?: string } }; message?: string };
      setMessage({
        type: 'error',
        text: error.response?.data?.details || error.response?.data?.message || error.message || 'Failed to parse CV.',
      });
    } finally {
      setUploading(false);
    }
  };

  /* ─── Fetch Applications ─── */
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get('/application/seeker');
        setApplications(res.data);
      } catch (err) {
        console.error('Error fetching seeker applications', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const getStatusStyle = (status: Application['status']) => {
    switch (status) {
      case 'Applied': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'Reviewing': return 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse';
      case 'Shortlisted': return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      case 'Accepted': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'Rejected': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      default: return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
    }
  };

  const shortlisted = applications.filter((a) => a.status === 'Shortlisted');

  /* ─── Completeness Ring ─── */
  const renderScoreRing = (score: number) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
    return (
      <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
        <svg width="100" height="100" className="transform -rotate-90">
          <circle cx="50" cy="50" r={radius} strokeWidth="6" stroke="rgba(255,255,255,0.06)" fill="none" />
          <circle cx="50" cy="50" r={radius} strokeWidth="6" stroke={color} fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-2xl font-extrabold text-slate-100">{score}</span>
          <span className="text-[10px] block text-slate-500 font-bold">/ 100</span>
        </div>
      </div>
    );
  };

  /* ─── Render ─── */
  return (
    <div className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-start">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 mb-2">My Applications</h1>
          <p className="text-slate-400">Upload your CV to extract & display parsed details</p>
        </div>
        <div className="shrink-0">
          <input type="file" accept=".pdf,.docx,.doc" className="hidden" id="seeker-cv-upload"
            onChange={handleCvUpload} disabled={uploading}
          />
          <label htmlFor="seeker-cv-upload"
            className={`inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-purple-500/20 border border-purple-500/30 transition-all cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin text-white" /><span>Parsing CV…</span></>
            ) : (
              <><Upload className="h-4 w-4 text-purple-200" /><span>Upload CV</span></>
            )}
          </label>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 mb-6 rounded-xl text-sm flex items-center space-x-2.5 border transition-all duration-300 ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" /> : <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  Parsed CV Details                                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {parsedData && (
        <div className="mb-10 space-y-6 animate-fadeIn">

          {/* ── Header Card: Name + Score ── */}
          <div className="glass p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="shrink-0">{renderScoreRing(parsedData.completenessScore)}</div>
            <div className="flex-grow text-center sm:text-left space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-100">{parsedData.name}</h2>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-slate-400">
                {parsedData.email && (
                  <span className="inline-flex items-center space-x-1"><span>✉️</span><span className="text-slate-300">{parsedData.email}</span></span>
                )}
                {parsedData.phone && (
                  <span className="inline-flex items-center space-x-1"><Phone className="h-3.5 w-3.5 text-purple-400" /><span className="text-slate-300 font-mono">{parsedData.phone}</span></span>
                )}
                {parsedData.location && parsedData.location !== 'City, Country' && (
                  <span className="inline-flex items-center space-x-1"><MapPin className="h-3.5 w-3.5 text-rose-400" /><span className="text-slate-300">{parsedData.location}</span></span>
                )}
              </div>
              {parsedData.languages.length > 0 && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1">
                  <Languages className="h-3.5 w-3.5 text-amber-400 mt-0.5" />
                  {parsedData.languages.map((lang, i) => (
                    <span key={i} className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-xs font-semibold">{lang}</span>
                  ))}
                </div>
              )}
              {parsedData.links.length > 0 && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                  {parsedData.links.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                      <Link2 className="h-3 w-3" /><span>{link.platform}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Summary ── */}
          {parsedData.summary && parsedData.summary !== 'No summary extracted from CV.' && (
            <div className="glass p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center space-x-1.5 border-b border-slate-800 pb-3">
                <User className="h-4 w-4" /><span>Professional Summary</span>
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">{parsedData.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Work Experience ── */}
            <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4 lg:col-span-2">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center space-x-1.5 border-b border-slate-800 pb-3">
                <Briefcase className="h-4 w-4" /><span>Work Experience</span>
                <span className="ml-auto text-slate-600 text-[10px] font-mono">{parsedData.workExperience.length} entries</span>
              </h3>
              <div className="space-y-5">
                {parsedData.workExperience.map((exp) => (
                  <div key={exp.id} className="relative pl-5 border-l-2 border-purple-500/30 space-y-1">
                    <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-purple-500"></div>
                    <h4 className="text-sm font-bold text-slate-100">{exp.jobTitle}</h4>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                      {exp.company && <span className="font-semibold text-slate-300">{exp.company}</span>}
                      {exp.period && exp.period !== 'Dates' && (
                        <span className="inline-flex items-center space-x-1 text-slate-500">
                          <Calendar className="h-3 w-3" /><span>{exp.period}</span>
                        </span>
                      )}
                    </div>
                    {exp.description.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {exp.description.map((d, i) => (
                          <li key={i} className="text-xs text-slate-400 flex items-start space-x-1.5">
                            <span className="text-purple-500 mt-0.5">•</span><span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Education ── */}
            <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center space-x-1.5 border-b border-slate-800 pb-3">
                <GraduationCap className="h-4 w-4" /><span>Education</span>
              </h3>
              <div className="space-y-4">
                {parsedData.education.map((edu) => (
                  <div key={edu.id} className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-200">{edu.degree}</h4>
                    {edu.fieldOfStudy && <p className="text-xs text-slate-400">{edu.fieldOfStudy}</p>}
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      {edu.institution && edu.institution !== 'Not specified' && (
                        <span className="font-semibold text-slate-400">{edu.institution}</span>
                      )}
                      {edu.year && <span className="text-slate-600">({edu.year})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Skills ── */}
            <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center space-x-1.5 border-b border-slate-800 pb-3">
                <Wrench className="h-4 w-4" /><span>Skills</span>
              </h3>
              {parsedData.skills.length > 0 ? (
                <div className="space-y-4">
                  {parsedData.skills.map((cat, idx) => (
                    <div key={idx}>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">{cat.categoryName}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.skills.map((skill, si) => (
                          <span key={si}
                            className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-semibold">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm italic">No skills detected from CV.</p>
              )}
            </div>
          </div>

          {/* ── Raw JSON Toggle ── */}
          <div className="glass rounded-2xl border border-slate-800 overflow-hidden">
            <button onClick={() => setShowJson(!showJson)}
              className="w-full flex items-center justify-between px-6 py-4 text-sm font-bold text-slate-300 hover:text-purple-400 transition-colors cursor-pointer">
              <div className="flex items-center space-x-2">
                <Code className="h-4 w-4 text-purple-500" /><span>Raw JSON Output</span>
              </div>
              {showJson ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showJson && (
              <div className="px-6 pb-6">
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-emerald-400 font-mono overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                  {rawJson}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  Shortlisted Applications                                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {shortlisted.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-extrabold text-slate-100 flex items-center space-x-2 mb-4">
            <Award className="h-5 w-5 text-purple-400" /><span>Shortlisted</span>
            <span className="ml-2 px-2.5 py-0.5 bg-purple-500/15 text-purple-400 border border-purple-500/25 rounded-full text-xs font-bold">{shortlisted.length}</span>
          </h2>
          <div className="space-y-4">
            {shortlisted.map((app) => (
              <div key={app.id} className="glass p-5 rounded-2xl border border-purple-500/20 bg-purple-500/5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold border bg-purple-500/10 border-purple-500/20 text-purple-400">⭐ Shortlisted</span>
                    <span className="text-xs text-slate-500 flex items-center space-x-1"><Calendar className="h-3 w-3" /><span>{new Date(app.appliedAt).toLocaleDateString()}</span></span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{app.jobTitle}</h3>
                  <div className="flex items-center space-x-1.5 text-sm font-semibold text-purple-400">
                    <Building className="h-4 w-4 text-purple-500" /><span>{app.companyName}</span>
                  </div>
                </div>
                {app.resumeUrl && (
                  <a href={app.resumeUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-purple-600/10 border border-purple-500/20 hover:border-purple-500/40 rounded-xl text-xs font-bold text-purple-400 transition-all shrink-0">
                    <FileText className="h-4 w-4" /><span>View Résumé</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  All Applications                                             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-100 flex items-center space-x-2 mb-4">
          <FileText className="h-5 w-5 text-purple-400" /><span>All Applications</span>
          <span className="ml-2 px-2.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-bold">{applications.length}</span>
        </h2>

        {loading ? (
          <div className="flex-grow flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl border border-dashed border-slate-800">
            <FileText className="h-16 w-16 mx-auto text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-slate-300">No applications yet</h3>
            <p className="text-slate-500 mt-2">Go to the search dashboard and apply for active positions!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="glass p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="space-y-2 flex-grow">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(app.status)}`}>{app.status}</span>
                    <span className="text-xs text-slate-500 flex items-center space-x-1"><Calendar className="h-3 w-3" /><span>{new Date(app.appliedAt).toLocaleDateString()}</span></span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{app.jobTitle}</h3>
                  <div className="flex items-center space-x-1.5 text-sm font-semibold text-purple-400">
                    <Building className="h-4 w-4 text-purple-500" /><span>{app.companyName}</span>
                  </div>
                  {app.coverLetter && <p className="text-slate-400 text-xs italic line-clamp-1 mt-1">"{app.coverLetter}"</p>}
                  {app.status === 'Rejected' && app.rejectionRemark && (
                    <p className="text-xs text-rose-300 bg-rose-500/5 border border-rose-500/20 rounded-lg px-3 py-2 mt-2">
                      <span className="font-bold text-rose-400">Company remark: </span>{app.rejectionRemark}
                    </p>
                  )}
                </div>
                {app.resumeUrl && (
                  <a href={app.resumeUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold text-slate-200 transition-all shrink-0">
                    <FileText className="h-4 w-4 text-purple-400" /><span>View Résumé</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
