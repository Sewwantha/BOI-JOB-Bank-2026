/* src/pages/JobSeeker/SeekerProfile.tsx */
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, AlertCircle, ArrowLeft, FileText } from 'lucide-react';
import api from '../../services/api';
import {
  districtsList,
  zonesList,
  eduQualificationsList,
  vocationalTrainingList,
  experienceList,
  jobCategoriesList,
} from '../../constants/jobSeekerOptions';

interface JobSeekerProfile {
  id?: string;
  registeredAt?: string;
  refNo?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nicNumber?: string;
  mobileNumber?: string;
  landlineNumber?: string;
  gender?: string;
  address?: string;
  district?: string;
  preferredZone?: string;
  educationalQualifications?: string;
  vocationalTraining?: string;
  experience?: string;
  preferredJobCategories?: string;
  bio?: string;
  resumeUrl?: string;
  skills?: string;
}

const SeekerProfile: React.FC = () => {
  const { user, updateProfileId } = useAuth();

  // When opened from the Admin Control Panel, the route carries the seeker's profile id
  const { profileId: adminProfileId } = useParams<{ profileId: string }>();
  const isAdminMode = Boolean(adminProfileId);

  // Reference & Cache
  const [profileId, setProfileId] = useState<string>('');
  const [refNo, setRefNo] = useState<string>('');
  const [cachedProfile, setCachedProfile] = useState<JobSeekerProfile | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [landlineNumber, setLandlineNumber] = useState('');
  const [gender, setGender] = useState('');

  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [preferredZone, setPreferredZone] = useState('');

  const [educationalQualifications, setEducationalQualifications] = useState('');
  const [vocationalTraining, setVocationalTraining] = useState('');
  const [experience, setExperience] = useState('');

  // Preferred job category tracking
  const [category, setCategory] = useState('');
  const [otherSpecify, setOtherSpecify] = useState('');

  // Legacy/hidden fields (retained to ensure backend payload compatibility)
  const [bio, setBio] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [skills, setSkills] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /* ------------------------------------------------------------------ */
  /* Helpers for parsing / serializing complex fields                   */
  /* ------------------------------------------------------------------ */
  const parseFullName = (firstName?: string, lastName?: string) => {
    return `${firstName || ''} ${lastName || ''}`.trim();
  };

  const splitFullName = (name: string) => {
    const trimmed = name.trim();
    const spaceIndex = trimmed.indexOf(' ');
    if (spaceIndex === -1) {
      return { firstName: trimmed, lastName: '' };
    }
    return {
      firstName: trimmed.substring(0, spaceIndex),
      lastName: trimmed.substring(spaceIndex + 1),
    };
  };

  const parseCategory = (categoriesStr: string) => {
    if (!categoriesStr) return { category: '', otherVal: '' };
    const trimmed = categoriesStr.trim();
    if (trimmed.startsWith('Other:')) {
      return { category: 'Other', otherVal: trimmed.replace('Other:', '').trim() };
    }
    // Legacy data may contain a comma-separated list; use the first entry.
    const first = trimmed.split(',')[0].trim();
    return { category: first, otherVal: '' };
  };

  const serializeCategory = (cat: string, otherVal: string) => {
    if (!cat) return '';
    if (cat === 'Other') {
      return otherVal.trim() ? `Other: ${otherVal.trim()}` : 'Other';
    }
    return cat;
  };

  /* ------------------------------------------------------------------ */
  /* Fetch Profile Data                                                 */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = isAdminMode
          ? await api.get(`/jobseeker/${adminProfileId}`)
          : await api.get(`/jobseeker/user/${user?.userId}`);
        if (res.data) {
          const profile = res.data;
          setCachedProfile(profile);

          setProfileId(profile.id || '');
          setRefNo(profile.refNo || '');
          setFullName(parseFullName(profile.firstName, profile.lastName));

          // Format Date of Birth if it is ISO date
          if (profile.dateOfBirth && profile.dateOfBirth.includes('T')) {
            setDateOfBirth(profile.dateOfBirth.split('T')[0]);
          } else {
            setDateOfBirth(profile.dateOfBirth || '');
          }

          setNicNumber(profile.nicNumber || '');
          setMobileNumber(profile.mobileNumber || '');
          setLandlineNumber(profile.landlineNumber || '');
          setGender(profile.gender || '');
          setAddress(profile.address || '');
          setDistrict(profile.district || '');
          setPreferredZone(profile.preferredZone || '');
          setEducationalQualifications(profile.educationalQualifications || '');
          setVocationalTraining(profile.vocationalTraining || '');
          setExperience(profile.experience || '');

          const { category: parsedCategory, otherVal } = parseCategory(profile.preferredJobCategories || '');
          setCategory(parsedCategory);
          setOtherSpecify(otherVal);

          // Legacy fields compatibility
          setBio(profile.bio || '');
          setResumeUrl(profile.resumeUrl || '');
          setSkills(profile.skills || '');

          if (profile.id && !isAdminMode) updateProfileId(profile.id);
        }
      } catch (err) {
        console.error('Error fetching job seeker profile', err);
        if (isAdminMode) {
          setMessage({ type: 'error', text: 'Job seeker profile could not be loaded.' });
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAdminMode || user?.userId) fetchProfile();
  }, [user?.userId, adminProfileId]);

  /* ------------------------------------------------------------------ */
  /* Handlers                                                           */
  /* ------------------------------------------------------------------ */
  const handleCategoryChange = (val: string) => {
    setCategory(val);
    if (val !== 'Other') setOtherSpecify('');
  };

  const handleReset = () => {
    if (!cachedProfile) return;

    setFullName(parseFullName(cachedProfile.firstName, cachedProfile.lastName));

    if (cachedProfile.dateOfBirth && cachedProfile.dateOfBirth.includes('T')) {
      setDateOfBirth(cachedProfile.dateOfBirth.split('T')[0]);
    } else {
      setDateOfBirth(cachedProfile.dateOfBirth || '');
    }

    setNicNumber(cachedProfile.nicNumber || '');
    setMobileNumber(cachedProfile.mobileNumber || '');
    setLandlineNumber(cachedProfile.landlineNumber || '');
    setGender(cachedProfile.gender || '');
    setAddress(cachedProfile.address || '');
    setDistrict(cachedProfile.district || '');
    setPreferredZone(cachedProfile.preferredZone || '');
    setEducationalQualifications(cachedProfile.educationalQualifications || '');
    setVocationalTraining(cachedProfile.vocationalTraining || '');
    setExperience(cachedProfile.experience || '');

    const { category: parsedCategory, otherVal } = parseCategory(cachedProfile.preferredJobCategories || '');
    setCategory(parsedCategory);
    setOtherSpecify(otherVal);

    setMessage({ type: 'success', text: 'Form has been reset to latest saved values.' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Basic Validations
    if (!fullName.trim()) {
      setMessage({ type: 'error', text: 'Full Name is required.' });
      setSaving(false);
      return;
    }
    if (!dateOfBirth) {
      setMessage({ type: 'error', text: 'Date of Birth is required.' });
      setSaving(false);
      return;
    }
    if (!mobileNumber.trim()) {
      setMessage({ type: 'error', text: 'Mobile Number is required.' });
      setSaving(false);
      return;
    }
    if (!gender) {
      setMessage({ type: 'error', text: 'Gender is required.' });
      setSaving(false);
      return;
    }
    if (!address.trim()) {
      setMessage({ type: 'error', text: 'Address is required.' });
      setSaving(false);
      return;
    }
    if (!district) {
      setMessage({ type: 'error', text: 'District is required.' });
      setSaving(false);
      return;
    }
    if (!preferredZone) {
      setMessage({ type: 'error', text: 'Available Job Locations (Zone) is required.' });
      setSaving(false);
      return;
    }
    if (!educationalQualifications) {
      setMessage({ type: 'error', text: 'Educational Qualifications is required.' });
      setSaving(false);
      return;
    }
    if (!vocationalTraining) {
      setMessage({ type: 'error', text: 'Vocational Training selection is required.' });
      setSaving(false);
      return;
    }
    if (!experience) {
      setMessage({ type: 'error', text: 'Work Experience selection is required.' });
      setSaving(false);
      return;
    }

    const { firstName, lastName } = splitFullName(fullName);
    const serializedCats = serializeCategory(category, otherSpecify);

    try {
      const res = await api.put(isAdminMode ? `/admin/jobseeker/${adminProfileId}` : '/jobseeker', {
        firstName,
        lastName,
        dateOfBirth,
        nicNumber,
        mobileNumber,
        landlineNumber,
        gender,
        address,
        district,
        preferredZone,
        educationalQualifications,
        vocationalTraining,
        experience,
        preferredJobCategories: serializedCats,
        // Retain legacy fields
        bio: bio || 'Form complete',
        resumeUrl: resumeUrl || 'https://example.com/placeholder-resume.pdf',
        skills: skills || 'General'
      });

      // Update local cache and success message
      setCachedProfile(res.data);
      setMessage({
        type: 'success',
        text: isAdminMode
          ? 'Job seeker profile has been updated successfully!'
          : 'Your job application profile has been updated successfully!',
      });

      if (res.data?.id && !isAdminMode) {
        setProfileId(res.data.id);
        updateProfileId(res.data.id);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update form. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Rendering                                                          */
  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="flex-grow flex justify-center items-center py-24 bg-slate-950">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col justify-start bg-slate-950">
      {isAdminMode && (
        <Link
          to="/admin-dashboard?tab=seekers"
          className="inline-flex items-center space-x-1.5 mb-4 text-sm font-semibold text-slate-400 hover:text-purple-400 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Job Seekers</span>
        </Link>
      )}
      <div className="glass p-6 md:p-10 rounded-3xl relative overflow-hidden border border-slate-800 shadow-2xl">

        {/* Visual BG Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/5 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-650/5 rounded-full filter blur-3xl pointer-events-none"></div>

        {/* Form Title Header */}
        <div className="text-center pb-6 border-b border-slate-800 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-500 bg-clip-text text-transparent">
            {isAdminMode ? 'Edit Job Seeker Profile' : 'Job Application Entry Form'}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {isAdminMode
              ? 'You are editing this job seeker’s profile as an administrator.'
              : 'Please fill in all required fields. A reference number will be generated automatically.'}
          </p>
          {profileId && refNo && (
            <div className="inline-block mt-4 px-4 py-1.5 bg-purple-950/40 border border-purple-500/25 text-purple-400 text-sm font-mono rounded-full tracking-wider shadow-inner">
              REF NO: {refNo}
            </div>
          )}
          {isAdminMode && resumeUrl && !resumeUrl.includes('example.com') && (
            <div className="mt-4">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
              >
                <FileText className="h-4 w-4" />
                <span>View Résumé</span>
              </a>
            </div>
          )}
        </div>

        {/* Message Alert Panel */}
        {message && (
          <div
            className={`p-4 mb-8 rounded-xl text-sm flex items-center space-x-2.5 border transition-all duration-300 ${message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Section 1: Personal Information */}
          <div>
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest border-b border-slate-800 pb-2.5 mb-6">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Full Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm transition-all duration-200"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Date of Birth <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm transition-all duration-200"
                />
              </div>

              {/* NIC Number */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  NIC Number
                </label>
                <input
                  type="text"
                  value={nicNumber}
                  onChange={(e) => setNicNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm transition-all duration-200"
                  placeholder="Enter NIC number (e.g. 199912345678)"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Mobile Number <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm transition-all duration-200"
                  placeholder="e.g. 0771234567"
                />
              </div>

              {/* Landline Number */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Landline Number
                </label>
                <input
                  type="tel"
                  value={landlineNumber}
                  onChange={(e) => setLandlineNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm transition-all duration-200"
                  placeholder="e.g. 0112345678"
                />
              </div>

              {/* Gender Radio Selectors */}
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-400 block mb-2.5">
                  Gender <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="flex space-x-8 items-center bg-slate-900/30 border border-slate-800/80 p-3.5 rounded-xl w-fit">
                  <label className="flex items-center space-x-2.5 text-sm text-slate-300 cursor-pointer group">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={gender === 'Male'}
                      onChange={(e) => setGender(e.target.value)}
                      required
                      className="h-4 w-4 border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500/35 cursor-pointer"
                    />
                    <span className="group-hover:text-slate-50 transition-colors">Male</span>
                  </label>
                  <label className="flex items-center space-x-2.5 text-sm text-slate-300 cursor-pointer group">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={gender === 'Female'}
                      onChange={(e) => setGender(e.target.value)}
                      required
                      className="h-4 w-4 border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500/35 cursor-pointer"
                    />
                    <span className="group-hover:text-slate-50 transition-colors">Female</span>
                  </label>
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div>
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest border-b border-slate-800 pb-2.5 mb-6">
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Address */}
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Address <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm transition-all duration-200"
                  placeholder="Enter your postal address"
                />
              </div>

              {/* District Dropdown */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  District <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm transition-all duration-250 cursor-pointer"
                  >
                    <option value="" disabled className="bg-slate-950 text-slate-500">Select District</option>
                    {districtsList.map((dist) => (
                      <option key={dist} value={dist} className="bg-slate-950 text-slate-350">{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preferred Zone Dropdown */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Available Job Locations (Zone) <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={preferredZone}
                    onChange={(e) => setPreferredZone(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm transition-all duration-250 cursor-pointer"
                  >
                    <option value="" disabled className="bg-slate-950 text-slate-500">Select Zone</option>
                    {zonesList.map((zn) => (
                      <option key={zn} value={zn} className="bg-slate-950 text-slate-350">{zn}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Education & Training */}
          <div>
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest border-b border-slate-800 pb-2.5 mb-6">
              Education & Training
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Qualifications */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Educational Qualifications <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={educationalQualifications}
                    onChange={(e) => setEducationalQualifications(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm transition-all duration-250 cursor-pointer"
                  >
                    <option value="" disabled className="bg-slate-950 text-slate-500">Select Qualification</option>
                    {eduQualificationsList.map((edu) => (
                      <option key={edu} value={edu} className="bg-slate-950 text-slate-350">{edu}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vocational Training */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Vocational Training <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={vocationalTraining}
                    onChange={(e) => setVocationalTraining(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm transition-all duration-250 cursor-pointer"
                  >
                    <option value="" disabled className="bg-slate-950 text-slate-500">Select Training</option>
                    {vocationalTrainingList.map((tr) => (
                      <option key={tr} value={tr} className="bg-slate-950 text-slate-350">{tr}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Work Experience */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Work Experience <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm transition-all duration-250 cursor-pointer"
                  >
                    <option value="" disabled className="bg-slate-950 text-slate-500">Select Experience</option>
                    {experienceList.map((exp) => (
                      <option key={exp} value={exp} className="bg-slate-950 text-slate-350">{exp}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Section 4: Preferred Job Categories */}
          <div>
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest border-b border-slate-800 pb-2.5 mb-6">
              Preferred Job Categories
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Preferred Job Category <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm transition-all duration-250 cursor-pointer"
                  >
                    <option value="" disabled className="bg-slate-950 text-slate-500">Select Category</option>
                    {jobCategoriesList.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-950 text-slate-350">{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {category === 'Other' && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                    Specify Category
                  </label>
                  <input
                    type="text"
                    placeholder="Specify details..."
                    value={otherSpecify}
                    onChange={(e) => setOtherSpecify(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm transition-all duration-250"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Form Actions Footer Buttons */}
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4">

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-12 py-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg hover:shadow-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all duration-200 disabled:opacity-50 cursor-pointer flex justify-center items-center"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                isAdminMode ? 'Save Changes' : 'Submit'
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-12 py-4 rounded-xl font-bold text-sm text-slate-300 bg-slate-900/60 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-all duration-200 cursor-pointer text-center"
            >
              Reset Form
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default SeekerProfile;