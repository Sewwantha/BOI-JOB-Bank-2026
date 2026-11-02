import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, ChevronRight, Users, Landmark } from 'lucide-react';
import api from '../services/api';

interface Job {
  id: string;
  companyName: string;
  companyLogoUrl: string;
  title: string;
  location: string;
  salaryRange: string;
  jobType: string;
  createdAt: string;
}

const LandingPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentJobs = async () => {
      try {
        const res = await api.get('/job');
        // Get the first 3 recent jobs for the homepage
        setJobs(res.data.slice(0, 3));
      } catch (err) {
        console.error('Error fetching jobs for landing page', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentJobs();
  }, []);

  return (
    <div className="w-full flex-grow flex flex-col justify-start bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 bg-white border-b border-slate-200">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-80"></div>
        
        {/* Colorful glowing radial accent circles */}
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-blue-100/30 blur-[150px]"></div>
        <div className="absolute top-20 -right-40 h-[500px] w-[500px] rounded-full bg-sky-100/30 blur-[120px]"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-slate-900">
            Connecting Talent with{' '}
            <span className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
              Opportunity
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Discover a comprehensive platform designed for Job Seekers, Employers, and Administrators. Browse open listings or register today to accelerate your growth.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl font-bold text-white bg-blue-800 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
            >
              Get Started Now
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-xl font-bold text-blue-850 bg-white hover:bg-slate-50 border border-blue-200 shadow-sm transition-all duration-200"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-900">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">10,000+</h3>
                <p className="text-slate-500 text-sm">Active Job Seekers</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-900">
                <Briefcase className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">4,500+</h3>
                <p className="text-slate-500 text-sm">Active Job Postings</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-900">
                <Landmark className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">250+</h3>
                <p className="text-slate-500 text-sm">Top Global Employers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Featured Job Openings</h2>
            <p className="text-slate-500 mt-2">Hand-picked premium listings from leading companies</p>
          </div>
          <Link
            to="/login"
            className="flex items-center space-x-1 text-blue-700 hover:text-blue-800 font-semibold group transition-all"
          >
            <span>Browse All Jobs</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
            <Briefcase className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-500 text-lg">No active jobs posted yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-300 p-6 rounded-2xl flex flex-col justify-between h-[300px]">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-850 border border-blue-100">
                      {job.jobType}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1 mb-1">{job.title}</h3>
                  <p className="text-blue-800 text-sm font-semibold mb-4">{job.companyName}</p>

                  <div className="space-y-2 mt-4 text-sm text-slate-500">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 font-medium text-slate-700">
                      <span className="text-emerald-700 font-semibold">{job.salaryRange}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link
                    to="/login"
                    className="w-full inline-flex justify-center items-center px-4 py-2 bg-slate-50 hover:bg-blue-800 border border-slate-200 hover:border-blue-800 rounded-xl text-sm font-bold text-slate-700 hover:text-white transition-all duration-200"
                  >
                    Login to Apply
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer Section */}
      <footer className="w-full py-8 bg-white border-t border-slate-200 mt-auto text-slate-500 text-center text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Job Bank Inc. Designed for maximum engineering excellence.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
