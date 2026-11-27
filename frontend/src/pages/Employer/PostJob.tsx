import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle, Edit3, CheckCircle, AlertCircle, MapPin, Banknote, FileText, Upload, Users } from 'lucide-react';
import api from '../../services/api';
import { jobCategoriesList } from '../../constants/jobSeekerOptions';
import BulkJobUpload from './BulkJobUpload';

const PostJob: React.FC = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');

  const navigate = useNavigate();
  // 'single' = one-vacancy form, 'bulk' = CSV upload (not offered when editing)
  const [mode, setMode] = useState<'single' | 'bulk'>(searchParams.get('mode') === 'bulk' ? 'bulk' : 'single');
  const isBulk = !editId && mode === 'bulk';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [jobType, setJobType] = useState<number>(0); // Enums: FullTime=0, Contract=2, Internship=4
  // Number of openings for this position (kept as string so the field can be cleared while typing)
  const [positionsAvailable, setPositionsAvailable] = useState<string>('1');
  // Same list job seekers choose from, so the weekly matching can compare them directly
  const [category, setCategory] = useState('');
  const [otherCategory, setOtherCategory] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchJobForEdit = async () => {
      if (!editId) return;
      setLoading(true);
      try {
        const res = await api.get(`/job/${editId}`);
        if (res.data) {
          setTitle(res.data.title);
          setDescription(res.data.description);
          setRequirements(res.data.requirements);
          setLocation(res.data.location);
          setSalaryRange(res.data.salaryRange);
          setPositionsAvailable(String(res.data.positionsAvailable ?? 1));

          // Custom categories are stored as "Other: ..."
          const savedCategory: string = res.data.jobCategory || '';
          if (savedCategory.startsWith('Other:')) {
            setCategory('Other');
            setOtherCategory(savedCategory.substring('Other:'.length).trim());
          } else {
            setCategory(savedCategory);
          }
          
          // Map string or number enums
          const typeStr = res.data.jobType;
          const map: Record<string, number> = {
            'FullTime': 0, 'Contract': 2, 'Internship': 4
          };
          setJobType(map[typeStr] ?? 0);
        }
      } catch (err) {
        console.error('Error fetching job details for edit', err);
        setMessage({ type: 'error', text: 'Failed to load job posting details.' });
      } finally {
        setLoading(false);
      }
    };
    fetchJobForEdit();
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || (category === 'Other' && !otherCategory.trim())) {
      setMessage({ type: 'error', text: 'Please select a job category.' });
      return;
    }
    const positions = parseInt(positionsAvailable, 10);
    if (!Number.isInteger(positions) || positions < 1) {
      setMessage({ type: 'error', text: 'Available positions must be a whole number of at least 1.' });
      return;
    }
    setSaving(true);
    setMessage(null);

    const payload = {
      title,
      description,
      requirements,
      jobCategory: category === 'Other' ? `Other: ${otherCategory.trim()}` : category,
      location,
      salaryRange,
      jobType,
      positionsAvailable: positions,
    };

    try {
      if (editId) {
        await api.put(`/job/${editId}`, payload);
        setMessage({ type: 'success', text: 'Job posting updated successfully!' });
      } else {
        await api.post('/job', payload);
        setMessage({ type: 'success', text: 'Job posted successfully!' });
      }

      setTimeout(() => {
        navigate('/employer-dashboard');
      }, 1500);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save job details. Please check your inputs.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col justify-start">
      <div className="glass p-8 md:p-10 rounded-3xl border border-slate-800 relative">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-purple-500/15 rounded-2xl text-purple-400">
            {editId ? <Edit3 className="h-6 w-6" /> : <PlusCircle className="h-6 w-6" />}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100">
              {editId ? 'Edit Job Posting' : isBulk ? 'Upload Bulk Vacancies' : 'Post a New Job'}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {isBulk ? 'Post many vacancies at once from a CSV file' : 'Advertise open positions and attract top applicants'}
            </p>
          </div>
        </div>

        {!editId && (
          <div className="grid grid-cols-2 gap-2 p-1 mb-8 bg-slate-900/60 border border-slate-800 rounded-xl">
            {([
              { key: 'single', label: 'Single Vacancy', icon: <FileText className="h-4 w-4" /> },
              { key: 'bulk', label: 'Bulk Upload (CSV)', icon: <Upload className="h-4 w-4" /> },
            ] as const).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setMode(t.key); setMessage(null); }}
                className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
                  mode === t.key ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.icon}<span>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {isBulk ? <BulkJobUpload /> : (<>

        {message && (
          <div
            className={`p-4 mb-6 rounded-xl text-sm flex items-center space-x-2 border ${
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Title */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Job Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm"
              placeholder="e.g. Senior Full-Stack Engineer"
            />
          </div>

          {/* Job Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Job Category <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm cursor-pointer"
              >
                <option value="" disabled>Select Category</option>
                {jobCategoriesList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">Used to match candidates from the candidate pool</p>
            </div>
            {category === 'Other' && (
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Please Specify <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={otherCategory}
                  onChange={(e) => setOtherCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm"
                  placeholder="e.g. Security Guard"
                />
              </div>
            )}
          </div>

          {/* Job Type & Salary Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Job Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm cursor-pointer"
              >
                <option value={0}>Full Time</option>
                <option value={2}>Contract</option>
                <option value={4}>Internship</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Salary Range</label>
              <div className="relative">
                <Banknote className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm"
                  placeholder="e.g. 90,000 - 120,000 / year"
                />
              </div>
            </div>
          </div>

          {/* Location & Available Positions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Location <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm"
                  placeholder="e.g. Redmond, WA or Remote"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Available Positions <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={positionsAvailable}
                  onChange={(e) => setPositionsAvailable(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm"
                  placeholder="e.g. 5"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">How many people you want to hire for this position</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Job Description</label>
            <textarea
              rows={6}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm leading-relaxed"
              placeholder="Outline the responsibilities, project scopes, and team details for this open position..."
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Requirements</label>
            <textarea
              rows={4}
              required
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm leading-relaxed"
              placeholder="Provide a list of must-have skills, educational backgrounds, years of experience, and tools..."
            />
          </div>

          {/* Form CTA Row */}
          <div className="flex space-x-3 pt-6 border-t border-slate-850">
            <button
              type="button"
              onClick={() => navigate('/employer-dashboard')}
              className="w-1/2 py-3 border border-slate-700 hover:bg-slate-800 rounded-xl text-sm font-bold text-slate-300 transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-1/2 py-3 font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 cursor-pointer flex justify-center items-center"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : editId ? (
                'Save Changes'
              ) : (
                'Publish Listing'
              )}
            </button>
          </div>
        </form>
        </>)}
      </div>
    </div>
  );
};

export default PostJob;
