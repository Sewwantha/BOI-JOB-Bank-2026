import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, AlertTriangle, ArrowRight, Shield } from 'lucide-react';
import api from '../../services/api';

const AdminLogin: React.FC = () => {
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Already signed in as admin: go straight to the dashboard
  if (user?.role === 'Admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCode || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/admin-login', { userCode: userCode.trim(), password });
      login({
        token: res.data.token,
        email: res.data.email,
        role: res.data.role,
        userId: res.data.userId,
        profileId: res.data.profileId,
        userName: res.data.userName,
        locationName: res.data.locationName,
      });
      navigate('/admin-dashboard');
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 glass p-8 rounded-3xl relative z-10">
        <div className="flex flex-col items-center">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-slate-100">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Restricted access. Authorized administrators only.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="admin-usercode" className="text-xs font-semibold text-slate-400 block mb-1">
                User Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="admin-usercode"
                  name="userCode"
                  type="text"
                  autoComplete="off"
                  required
                  maxLength={10}
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-200"
                  placeholder="Enter your user code"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="text-xs font-semibold text-slate-400 block mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 shadow-lg hover:shadow-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-950"></div>
              ) : (
                <>
                  <span>Sign In as Admin</span>
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

export default AdminLogin;
