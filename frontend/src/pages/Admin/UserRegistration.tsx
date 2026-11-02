/* src/pages/Admin/UserRegistration.tsx */
import React, { useEffect, useState } from 'react';
import {
  User, Building, IdCard, Mail, Lock, Phone, MapPin, Globe,
  GraduationCap, UserPlus, CheckCircle, AlertTriangle, Briefcase, DollarSign
} from 'lucide-react';
import api from '../../services/api';
import RegistrationSuccessModal from '../../components/RegistrationSuccessModal';
import {
  eduQualificationsList,
  vocationalTrainingList,
  experienceList,
  jobCategoriesList,
} from '../../constants/jobSeekerOptions';

type RegistrationRole = 'JobSeeker' | 'Employer';

interface Vacancy {
  id: string;
  title: string;
  location: string;
  salaryRange: string;
  jobType: string;
}

const jobTypeLabels: Record<string, string> = {
  FullTime: 'Full Time',
  Contract: 'Contract',
  Internship: 'Internship',
};

interface UserRegistrationProps {
  onRegistered?: () => void;
}

const initialSeeker = {
  nicNumber: '',
  fullName: '',
  dateOfBirth: '',
  gender: '',
  mobileNumber: '',
  landlineNumber: '',
  address: '',
  preferredZone: '',
  jobPostId: '',
  educationalQualifications: '',
  vocationalTraining: '',
  experience: '',
  skills: '',
  category: '',
  otherCategory: '',
};

const initialEmployer = {
  email: '',
  companyName: '',
  location: '',
  website: '',
  companyDescription: '',
};

const inputClass =
  'block w-full px-3 py-2.5 border border-slate-700 bg-slate-900/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200';
const iconInputClass = inputClass.replace('px-3', 'pl-10 pr-3');
const labelClass = 'text-xs font-semibold text-slate-400 block mb-1';

const Required = () => <span className="text-rose-500 font-bold">*</span>;

const IconInput: React.FC<{ icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>> = ({ icon, ...props }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
      {icon}
    </div>
    <input {...props} className={iconInputClass} />
  </div>
);

const SelectInput: React.FC<{ value: string; onChange: (v: string) => void; options: string[]; placeholder: string }> = ({
  value, onChange, options, placeholder
}) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} cursor-pointer`}>
    <option value="" disabled className="bg-slate-950 text-slate-500">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt} value={opt} className="bg-slate-950">{opt}</option>
    ))}
  </select>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-2 mb-4">
    <span className="text-purple-400">{icon}</span>
    <span>{title}</span>
  </h4>
);

const UserRegistration: React.FC<UserRegistrationProps> = ({ onRegistered }) => {
  const [role, setRole] = useState<RegistrationRole>('JobSeeker');
  const [seeker, setSeeker] = useState(initialSeeker);
  const [employer, setEmployer] = useState(initialEmployer);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [registeredRefNo, setRegisteredRefNo] = useState<string | null>(null);
  const [zones, setZones] = useState<string[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);

  // Preferred zones depend on the logged-in admin's location
  useEffect(() => {
    api.get<string[]>('/admin/zones')
      .then((res) => setZones(res.data))
      .catch(() => setZones([]))
      .finally(() => setZonesLoading(false));
  }, []);

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(false);

  // Selecting a company as the preferred zone shows its open job vacancies
  const selectZone = (companyName: string) => {
    setSeeker((prev) => ({ ...prev, preferredZone: companyName, jobPostId: '' }));
    setVacancies([]);
    if (!companyName) return;

    setVacanciesLoading(true);
    api.get<Vacancy[]>('/admin/company-vacancies', { params: { companyName } })
      .then((res) => setVacancies(res.data))
      .catch(() => setVacancies([]))
      .finally(() => setVacanciesLoading(false));
  };

  const updateSeeker = (field: keyof typeof initialSeeker, value: string) =>
    setSeeker((prev) => ({ ...prev, [field]: value }));
  const updateEmployer = (field: keyof typeof initialEmployer, value: string) =>
    setEmployer((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setSeeker(initialSeeker);
    setEmployer(initialEmployer);
    setPassword('');
    setConfirmPassword('');
    setVacancies([]);
  };

  const switchRole = (next: RegistrationRole) => {
    setRole(next);
    setMessage(null);
  };

  const validate = (): string | null => {
    if (role === 'JobSeeker') {
      if (seeker.nicNumber.trim().length !== 10) return 'NIC number must be exactly 10 characters.';
      if (!seeker.fullName.trim()) return 'Full name is required.';
      if (!seeker.gender) return 'Gender is required.';
      if (!seeker.mobileNumber.trim()) return 'Mobile number is required.';
    } else {
      if (!employer.email.trim()) return 'Email is required.';
      if (!employer.companyName.trim()) return 'Company name is required.';
    }
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const buildPayload = () => {
    if (role === 'Employer') {
      return { role, password, ...employer };
    }

    const name = seeker.fullName.trim();
    const spaceIndex = name.indexOf(' ');
    const firstName = spaceIndex === -1 ? name : name.substring(0, spaceIndex);
    const lastName = spaceIndex === -1 ? '' : name.substring(spaceIndex + 1);
    const preferredJobCategories =
      seeker.category === 'Other' && seeker.otherCategory.trim()
        ? `Other: ${seeker.otherCategory.trim()}`
        : seeker.category;

    return {
      role,
      password,
      firstName,
      lastName,
      preferredJobCategories,
      nicNumber: seeker.nicNumber.trim(),
      dateOfBirth: seeker.dateOfBirth,
      gender: seeker.gender,
      mobileNumber: seeker.mobileNumber,
      landlineNumber: seeker.landlineNumber,
      address: seeker.address,
      preferredZone: seeker.preferredZone,
      jobPostId: seeker.jobPostId || null,
      educationalQualifications: seeker.educationalQualifications,
      vocationalTraining: seeker.vocationalTraining,
      experience: seeker.experience,
      skills: seeker.skills,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await api.post('/admin/users', buildPayload());
      const successText = res.data.message || 'User registered successfully.';
      setMessage({
        type: 'success',
        text: res.data.refNo ? `${successText} Reference No: ${res.data.refNo}` : successText,
      });
      if (res.data.refNo) setRegisteredRefNo(res.data.refNo);
      resetForm();
      onRegistered?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.message || 'Registration failed. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const roleButtonClass = (active: boolean) =>
    `flex items-center justify-center space-x-2 p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
      active
        ? 'bg-purple-600/10 border-purple-500 text-purple-400 shadow-md shadow-purple-500/10'
        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <UserPlus className="h-5 w-5 text-purple-400" />
          <span>User Registration</span>
        </h3>
        <p className="text-slate-400 text-sm mt-1">Register new job seekers or employers directly into the system</p>
      </div>

      {/* Registration type selector */}
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <button type="button" onClick={() => switchRole('JobSeeker')} className={roleButtonClass(role === 'JobSeeker')}>
          <User className="h-5 w-5" />
          <span className="text-sm font-bold">Job Seeker Registration</span>
        </button>
        <button type="button" onClick={() => switchRole('Employer')} className={roleButtonClass(role === 'Employer')}>
          <Building className="h-5 w-5" />
          <span className="text-sm font-bold">Employer Registration</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center space-x-2 border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass p-6 sm:p-8 rounded-3xl space-y-8">
        {role === 'JobSeeker' ? (
          <>
            {/* Personal information */}
            <div>
              <SectionTitle icon={<User className="h-4 w-4" />} title="Personal Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>NIC Number <Required /></label>
                  <IconInput
                    icon={<IdCard className="h-4 w-4" />}
                    type="text"
                    maxLength={10}
                    value={seeker.nicNumber}
                    onChange={(e) => updateSeeker('nicNumber', e.target.value.slice(0, 10))}
                    placeholder="Enter 10-character NIC"
                  />
                  <p className="mt-1 text-xs text-slate-500">{seeker.nicNumber.length}/10 characters · used as the login ID</p>
                </div>
                <div>
                  <label className={labelClass}>Full Name <Required /></label>
                  <input
                    type="text"
                    value={seeker.fullName}
                    onChange={(e) => updateSeeker('fullName', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Nimal Perera"
                  />
                </div>
                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <input
                    type="date"
                    value={seeker.dateOfBirth}
                    onChange={(e) => updateSeeker('dateOfBirth', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Gender <Required /></label>
                  <div className="flex items-center space-x-6 py-2.5">
                    {['Male', 'Female'].map((g) => (
                      <label key={g} className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="admin-seeker-gender"
                          value={g}
                          checked={seeker.gender === g}
                          onChange={(e) => updateSeeker('gender', e.target.value)}
                          className="accent-purple-500"
                        />
                        <span>{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact information */}
            <div>
              <SectionTitle icon={<MapPin className="h-4 w-4" />} title="Contact Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Mobile Number <Required /></label>
                  <IconInput
                    icon={<Phone className="h-4 w-4" />}
                    type="tel"
                    value={seeker.mobileNumber}
                    onChange={(e) => updateSeeker('mobileNumber', e.target.value)}
                    placeholder="07XXXXXXXX"
                  />
                </div>
                <div>
                  <label className={labelClass}>Landline Number</label>
                  <IconInput
                    icon={<Phone className="h-4 w-4" />}
                    type="tel"
                    value={seeker.landlineNumber}
                    onChange={(e) => updateSeeker('landlineNumber', e.target.value)}
                    placeholder="0XXXXXXXXX"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Address</label>
                  <textarea
                    rows={2}
                    value={seeker.address}
                    onChange={(e) => updateSeeker('address', e.target.value)}
                    className={inputClass}
                    placeholder="Permanent address"
                  />
                </div>
                <div>
                  <label className={labelClass}>Available Job Locations (Zone)</label>
                  <SelectInput value={seeker.preferredZone} onChange={selectZone} options={zones} placeholder={zonesLoading ? 'Loading zones...' : zones.length ? 'Select Zone' : 'No zones for your location'} />
                </div>
                {seeker.preferredZone && (
                  <div className="md:col-span-2">
                    <label className={labelClass}>Available Job Vacancies at {seeker.preferredZone}</label>
                    <p className="text-xs text-slate-500 mb-2">Select a vacancy to assign the candidate. Without a selection the candidate goes to the Candidate Pool.</p>
                    {vacanciesLoading ? (
                      <p className="text-sm text-slate-500 py-2">Loading vacancies...</p>
                    ) : vacancies.length === 0 ? (
                      <p className="text-sm text-slate-500 py-2">No open vacancies for this company.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {vacancies.map((job) => {
                          const selected = seeker.jobPostId === job.id;
                          return (
                          <button
                            type="button"
                            key={job.id}
                            onClick={() => updateSeeker('jobPostId', selected ? '' : job.id)}
                            className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                              selected
                                ? 'border-purple-500 bg-purple-600/10 shadow-md shadow-purple-500/10'
                                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                            }`}
                          >
                            <p className="font-semibold text-slate-100 flex items-center space-x-2">
                              <Briefcase className="h-4 w-4 text-purple-400 shrink-0" />
                              <span className="flex-grow">{job.title}</span>
                              {selected && <CheckCircle className="h-4 w-4 text-purple-400 shrink-0" />}
                            </p>
                            <div className="mt-2 space-y-1 text-xs text-slate-400">
                              {job.location && (
                                <p className="flex items-center space-x-1.5">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  <span>{job.location}</span>
                                </p>
                              )}
                              {job.salaryRange && (
                                <p className="flex items-center space-x-1.5">
                                  <DollarSign className="h-3.5 w-3.5 shrink-0" />
                                  <span>{job.salaryRange}</span>
                                </p>
                              )}
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                {jobTypeLabels[job.jobType] ?? job.jobType}
                              </span>
                            </div>
                          </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Education, experience & job preference */}
            <div>
              <SectionTitle icon={<GraduationCap className="h-4 w-4" />} title="Education, Experience & Preferences" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Educational Qualifications</label>
                  <SelectInput
                    value={seeker.educationalQualifications}
                    onChange={(v) => updateSeeker('educationalQualifications', v)}
                    options={eduQualificationsList}
                    placeholder="Select Qualification"
                  />
                </div>
                <div>
                  <label className={labelClass}>Vocational Training</label>
                  <SelectInput
                    value={seeker.vocationalTraining}
                    onChange={(v) => updateSeeker('vocationalTraining', v)}
                    options={vocationalTrainingList}
                    placeholder="Select Training"
                  />
                </div>
                <div>
                  <label className={labelClass}>Work Experience</label>
                  <SelectInput value={seeker.experience} onChange={(v) => updateSeeker('experience', v)} options={experienceList} placeholder="Select Experience" />
                </div>
                <div>
                  <label className={labelClass}>Preferred Job Category</label>
                  <SelectInput value={seeker.category} onChange={(v) => updateSeeker('category', v)} options={jobCategoriesList} placeholder="Select Category" />
                </div>
                {seeker.category === 'Other' && (
                  <div className="md:col-span-2">
                    <label className={labelClass}>Please Specify</label>
                    <input
                      type="text"
                      value={seeker.otherCategory}
                      onChange={(e) => updateSeeker('otherCategory', e.target.value)}
                      className={inputClass}
                      placeholder="Specify preferred job category"
                    />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className={labelClass}>Skills</label>
                  <input
                    type="text"
                    value={seeker.skills}
                    onChange={(e) => updateSeeker('skills', e.target.value)}
                    className={inputClass}
                    placeholder="Comma separated, e.g. Welding, Forklift, MS Office"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div>
            <SectionTitle icon={<Building className="h-4 w-4" />} title="Company Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email Address <Required /></label>
                <IconInput
                  icon={<Mail className="h-4 w-4" />}
                  type="email"
                  value={employer.email}
                  onChange={(e) => updateEmployer('email', e.target.value)}
                  placeholder="hr@company.com"
                />
                <p className="mt-1 text-xs text-slate-500">Used as the login ID</p>
              </div>
              <div>
                <label className={labelClass}>Company Name <Required /></label>
                <input
                  type="text"
                  value={employer.companyName}
                  onChange={(e) => updateEmployer('companyName', e.target.value)}
                  className={inputClass}
                  placeholder="Company (Pvt) Ltd"
                />
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <IconInput
                  icon={<MapPin className="h-4 w-4" />}
                  type="text"
                  value={employer.location}
                  onChange={(e) => updateEmployer('location', e.target.value)}
                  placeholder="City / Zone"
                />
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <IconInput
                  icon={<Globe className="h-4 w-4" />}
                  type="url"
                  value={employer.website}
                  onChange={(e) => updateEmployer('website', e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Company Description</label>
                <textarea
                  rows={3}
                  value={employer.companyDescription}
                  onChange={(e) => updateEmployer('companyDescription', e.target.value)}
                  className={inputClass}
                  placeholder="Short description of the company"
                />
              </div>
            </div>
          </div>
        )}

        {/* Account credentials */}
        <div>
          <SectionTitle icon={<Lock className="h-4 w-4" />} title="Account Credentials" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Password <Required /></label>
              <IconInput
                icon={<Lock className="h-4 w-4" />}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <label className={labelClass}>Confirm Password <Required /></label>
              <IconInput
                icon={<Lock className="h-4 w-4" />}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => { resetForm(); setMessage(null); }}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-300 bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>{role === 'JobSeeker' ? 'Register Job Seeker' : 'Register Employer'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {registeredRefNo && (
        <RegistrationSuccessModal
          refNo={registeredRefNo}
          message="Job seeker registered successfully!"
          buttonLabel="Close"
          onClose={() => setRegisteredRefNo(null)}
        />
      )}
    </div>
  );
};

export default UserRegistration;
