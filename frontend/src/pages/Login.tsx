import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertTriangle, ArrowRight, User, Building, IdCard } from 'lucide-react';
import api from '../services/api';
import { NIC_MAX_LENGTH } from '../utils/nicValidation';

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState<'JobSeeker' | 'Employer'>('JobSeeker');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in all fields.');
      return;
    }

    // Loose check on purpose: accounts created before the NIC format rule may not match it exactly
    if (loginMode === 'JobSeeker' && identifier.length !== 10 && identifier.length !== 12) {
      setError('Please enter your 10-character (old) or 12-digit (new) NIC number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', {
        email: loginMode === 'Employer' ? identifier : '',
        nicNumber: loginMode === 'JobSeeker' ? identifier : '',
        password,
      });
      login({
        token: res.data.token,
        email: res.data.email,
        role: res.data.role,
        userId: res.data.userId,
        profileId: res.data.profileId,
      });

      // Role-based routing
      if (res.data.role === 'Admin') {
        navigate('/admin-dashboard');
      } else if (res.data.role === 'Employer') {
        navigate('/employer-dashboard');
      } else {
        navigate('/seeker-dashboard');
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 relative bg-slate-950">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 glass p-8 rounded-3xl relative z-10">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-slate-100">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Or{' '}
            <Link to="/register" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
              create your account
            </Link>
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Login Mode Toggle */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-3 text-center">
              I am logging in as a:
            </span>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { setLoginMode('JobSeeker'); setIdentifier(''); }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${loginMode === 'JobSeeker'
                    ? 'bg-purple-600/10 border-purple-500 text-purple-400 shadow-md shadow-purple-500/10'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
              >
                <User className="h-6 w-6 mb-2" />
                <span className="text-sm font-bold">Job Seeker</span>
              </button>

              <button
                type="button"
                onClick={() => { setLoginMode('Employer'); setIdentifier(''); }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${loginMode === 'Employer'
                    ? 'bg-purple-600/10 border-purple-500 text-purple-400 shadow-md shadow-purple-500/10'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
              >
                <Building className="h-6 w-6 mb-2" />
                <span className="text-sm font-bold">Employer</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {loginMode === 'JobSeeker' ? (
              <div>
                <label htmlFor="nic-number" className="text-xs font-semibold text-slate-400 block mb-1">
                  NIC Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <IdCard className="h-5 w-5" />
                  </div>
                  <input
                    id="nic-number"
                    name="nic"
                    type="text"
                    required
                    maxLength={NIC_MAX_LENGTH}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.trim().toUpperCase().slice(0, NIC_MAX_LENGTH))}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200"
                    placeholder="e.g. 951480234V or 199514802345"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Old (9 digits + V/X) or new (12 digits) NIC
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="email-address" className="text-xs font-semibold text-slate-400 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="text-xs font-semibold text-slate-400 block mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg hover:shadow-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
