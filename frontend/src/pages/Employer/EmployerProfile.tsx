import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Globe, MapPin, AlignLeft, Link2, Save, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import CompanyPicker from '../../components/CompanyPicker';
import api from '../../services/api';

interface CompanyProfile {
  id: string;
  userId: string;
  companyName: string;
  description: string;
  website: string;
  location: string;
  logoUrl: string;
}

const EmployerProfile: React.FC = () => {
  const { user, updateProfileId } = useAuth();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await api.get(`/company/user/${user.userId}`);
        const data: CompanyProfile = res.data;
        setCompanyName(data.companyName || '');
        setDescription(data.description || '');
        setWebsite(data.website || '');
        setLocation(data.location || '');
        setLogoUrl(data.logoUrl || '');
        
        if (data.id && user.profileId !== data.id) {
          updateProfileId(data.id);
        }
      } catch (err: any) {
        console.error('Error fetching company profile', err);
        // If 404, we assume the profile hasn't been created (though database seeding usually initializes it)
        if (err.response?.status !== 404) {
          setMessage({ type: 'error', text: 'Failed to load company profile. Please try again.' });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate, updateProfileId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setMessage({ type: 'error', text: 'Please select your company from the official company list.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await api.put('/company', {
        companyName: companyName.trim(),
        description: description.trim(),
        website: website.trim(),
        location: location.trim(),
        logoUrl: logoUrl.trim()
      });

      setMessage({ type: 'success', text: 'Company profile updated successfully!' });
      
      const updatedProfile: CompanyProfile = res.data;
      if (updatedProfile.id) {
        updateProfileId(updatedProfile.id);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating profile', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update company profile. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-start">
      {/* Back button and title */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/employer-dashboard')}
          className="flex items-center space-x-2 text-sm text-slate-400 hover:text-purple-400 transition-colors mb-4 group cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>
        <h1 className="text-3xl font-extrabold text-slate-100 mb-2">Company Profile</h1>
        <p className="text-slate-400">Establish your organization's identity and attract high-quality seekers</p>
      </div>

      {loading ? (
        <div className="flex-grow flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form Side */}
          <div className="lg:col-span-2 glass p-8 rounded-3xl relative overflow-hidden">
            {/* Subtle light effect top left */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <h2 className="text-xl font-bold text-slate-200 border-b border-slate-800 pb-3 mb-6 flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-purple-400" />
                <span>Profile details</span>
              </h2>

              {message && (
                <div
                  className={`flex items-start space-x-2.5 p-4 rounded-xl border ${
                    message.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm font-medium leading-relaxed">{message.text}</span>
                </div>
              )}

              {/* Company Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center space-x-2">
                  <span>Company Name</span>
                  <span className="text-rose-500">*</span>
                </label>
                <CompanyPicker
                  value={companyName}
                  onChange={(c) => setCompanyName(c?.name ?? '')}
                  showSelectedHint={false}
                  required
                />
                <p className="mt-1 text-xs text-slate-500">To change it, search and select your company as registered with BOI.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. New York, NY or Remote"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="e.g. https://example.com"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Logo Image URL</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/... or company logo link"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all font-medium"
                  />
                </div>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                  Provide a direct link to an image file (PNG, JPG) to represent your company.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Company Description</label>
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your company culture, core products, and vision..."
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all font-medium h-36 resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md hover:shadow-purple-500/25 transition-all duration-200 cursor-pointer flex items-center space-x-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>Save Profile Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Preview Card Side */}
          <div className="glass p-6 rounded-3xl sticky top-24 relative overflow-hidden flex flex-col items-center">
            {/* Ambient light underneath */}
            <div className="absolute -bottom-10 right-0 w-32 h-32 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

            <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-6 self-start flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping"></span>
              <span>Live Card Preview</span>
            </h3>

            {/* Simulated Logo circle */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden mb-5 shadow-lg relative group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Company Logo Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Building2 className="h-10 w-10 text-slate-500" />
              )}
            </div>

            {/* Company title and tags */}
            <h4 className="text-xl font-extrabold text-slate-100 text-center tracking-tight truncate w-full px-2">
              {companyName || 'Your Company Name'}
            </h4>

            {location && (
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-2">
                <MapPin className="h-3.5 w-3.5 text-purple-400" />
                <span>{location}</span>
              </div>
            )}

            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 mt-3 font-semibold bg-purple-500/5 px-3 py-1.5 rounded-full border border-purple-500/10 hover:bg-purple-500/10 transition-colors"
              >
                <Globe className="h-3 w-3" />
                <span>Visit Website</span>
              </a>
            )}

            {/* Description */}
            <div className="w-full border-t border-slate-850 mt-6 pt-5 flex-grow">
              <p className="text-xs text-slate-400 leading-relaxed text-center italic line-clamp-6">
                {description || '"Your company description will show here. Tell potential hires about your goals, values, and outstanding benefits!"'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerProfile;
