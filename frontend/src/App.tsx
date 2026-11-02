import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Navbar from './components/Navbar';

// Public Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';

// Job Seeker Pages
import JobDashboard from './pages/JobSeeker/JobDashboard';
import SeekerProfile from './pages/JobSeeker/SeekerProfile';
import MyApplications from './pages/JobSeeker/MyApplications';

// Employer Pages
import EmployerDashboard from './pages/Employer/EmployerDashboard';
import EmployerProfile from './pages/Employer/EmployerProfile';
import PostJob from './pages/Employer/PostJob';
import ManageApplicants from './pages/Employer/ManageApplicants';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminLogin from './pages/Admin/AdminLogin';

// Protected Route Wrapper Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: ('Admin' | 'Employer' | 'JobSeeker')[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    const adminOnly = allowedRoles?.length === 1 && allowedRoles[0] === 'Admin';
    return <Navigate to={adminOnly ? '/admin/login' : '/login'} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role mismatch: redirect to their corresponding dashboard
    if (user.role === 'Admin') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'Employer') return <Navigate to="/employer-dashboard" replace />;
    return <Navigate to="/seeker-dashboard" replace />;
  }

  return <>{children}</>;
};

// Applies the selected theme; the landing page keeps its own fixed light design
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const themeClass = theme === 'light' && location.pathname !== '/' ? 'theme-light' : '';

  return (
    <div className={`min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-purple-650 selection:text-white ${themeClass}`}>
      {children}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppLayout>
            <Navbar />
            
            {/* Main Content Layout */}
            <main className="flex-grow flex flex-col w-full">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin/login" element={<AdminLogin />} />
  
                {/* Job Seeker Protected Routes */}
                <Route
                  path="/seeker-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['JobSeeker']}>
                      <JobDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seeker-profile"
                  element={
                    <ProtectedRoute allowedRoles={['JobSeeker']}>
                      <SeekerProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-applications"
                  element={
                    <ProtectedRoute allowedRoles={['JobSeeker']}>
                      <MyApplications />
                    </ProtectedRoute>
                  }
                />
  
                {/* Employer Protected Routes */}
                <Route
                  path="/employer-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['Employer']}>
                      <EmployerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/employer-profile"
                  element={
                    <ProtectedRoute allowedRoles={['Employer']}>
                      <EmployerProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/post-job"
                  element={
                    <ProtectedRoute allowedRoles={['Employer']}>
                      <PostJob />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manage-applicants/:jobId"
                  element={
                    <ProtectedRoute allowedRoles={['Employer']}>
                      <ManageApplicants />
                    </ProtectedRoute>
                  }
                />
  
                {/* Admin Protected Routes */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/jobseeker/:profileId"
                  element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                      <SeekerProfile />
                    </ProtectedRoute>
                  }
                />
  
                {/* Fallback Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </AppLayout>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
