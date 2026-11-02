import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard, PlusCircle, FileText, Shield } from 'lucide-react';
import JobBankLogo from './JobBankLogo';
import ThemeToggle from './ThemeToggle';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    const wasAdmin = user?.role === 'Admin';
    logout();
    navigate(wasAdmin ? '/admin/login' : '/');
  };

  const isLanding = location.pathname === '/';

  if (location.pathname === '/employer-dashboard') {
    return null;
  }

  return (
    <nav className={isLanding ? "bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 w-full shadow-sm" : "glass sticky top-0 z-50 w-full shadow-lg"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <JobBankLogo className="h-10 w-10" />
              <span className={`text-xl font-extrabold tracking-wider ${
                isLanding 
                  ? 'text-blue-900' 
                  : 'bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent'
              }`}>
                JOBBANK
              </span>
            </Link>
          </div>

          {/* Navigation Links based on Role */}
          <div className="flex items-center space-x-4">
            {!isLanding && <ThemeToggle />}
            {user ? (
              <>
                {/* Job Seeker Navigation */}
                {user.role === 'JobSeeker' && (
                  <>
                    <Link to="/seeker-dashboard" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isLanding 
                        ? 'text-slate-600 hover:text-blue-800 hover:bg-slate-100' 
                        : 'text-slate-300 hover:text-purple-400 hover:bg-slate-800'
                    }`}>
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Search Jobs</span>
                    </Link>
                    <Link to="/my-applications" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isLanding 
                        ? 'text-slate-600 hover:text-blue-800 hover:bg-slate-100' 
                        : 'text-slate-300 hover:text-purple-400 hover:bg-slate-800'
                    }`}>
                      <FileText className="h-4 w-4" />
                      <span>My Applications</span>
                    </Link>
                    <Link to="/seeker-profile" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isLanding 
                        ? 'text-slate-600 hover:text-blue-800 hover:bg-slate-100' 
                        : 'text-slate-300 hover:text-purple-400 hover:bg-slate-800'
                    }`}>
                      <User className="h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </>
                )}

                {/* Employer Navigation */}
                {user.role === 'Employer' && (
                  <>
                    <Link to="/employer-dashboard" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isLanding 
                        ? 'text-slate-600 hover:text-blue-800 hover:bg-slate-100' 
                        : 'text-slate-300 hover:text-purple-400 hover:bg-slate-800'
                    }`}>
                      <LayoutDashboard className="h-4 w-4" />
                      <span>My Listings</span>
                    </Link>
                    <Link to="/post-job" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isLanding 
                        ? 'text-slate-600 hover:text-blue-800 hover:bg-slate-100' 
                        : 'text-slate-300 hover:text-purple-400 hover:bg-slate-800'
                    }`}>
                      <PlusCircle className="h-4 w-4" />
                      <span>Post a Job</span>
                    </Link>
                    <Link to="/employer-profile" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isLanding 
                        ? 'text-slate-600 hover:text-blue-800 hover:bg-slate-100' 
                        : 'text-slate-300 hover:text-purple-400 hover:bg-slate-800'
                    }`}>
                      <User className="h-4 w-4" />
                      <span>Company Profile</span>
                    </Link>
                  </>
                )}

                {/* Admin Navigation */}
                {user.role === 'Admin' && (
                  <>
                    <Link to="/admin-dashboard" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isLanding 
                        ? 'text-slate-600 hover:text-blue-800 hover:bg-slate-100' 
                        : 'text-slate-300 hover:text-purple-400 hover:bg-slate-800'
                    }`}>
                      <Shield className="h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </>
                )}

                {/* Logout Button */}
                <div className={`border-l h-6 mx-2 ${isLanding ? 'border-slate-200' : 'border-slate-700'}`}></div>
                <div className="flex items-center space-x-3">
                  <span className={`hidden md:inline text-xs font-medium max-w-[120px] truncate ${isLanding ? 'text-slate-500' : 'text-slate-400'}`}>
                    {user.userName || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      isLanding
                        ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300'
                        : 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40'
                    }`}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    isLanding ? 'text-slate-600 hover:text-blue-800' : 'text-slate-300 hover:text-slate-50'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 ${
                    isLanding 
                      ? 'bg-blue-800 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/15' 
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md hover:shadow-purple-500/25'
                  }`}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
