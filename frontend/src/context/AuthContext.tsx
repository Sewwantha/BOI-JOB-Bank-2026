import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  token: string;
  email: string;
  role: 'Admin' | 'Employer' | 'JobSeeker';
  userId: string;
  profileId: string | null;
  userName?: string; // Admin display name (UsrUser)
  locationName?: string; // Admin location (common database)
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (session: UserSession) => void;
  logout: () => void;
  updateProfileId: (profileId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedAuth = localStorage.getItem('jobbank_auth');
    if (savedAuth) {
      try {
        setUser(JSON.parse(savedAuth));
      } catch (err) {
        console.error('Failed to parse saved auth', err);
        localStorage.removeItem('jobbank_auth');
      }
    }
    setLoading(false);
  }, []);

  const login = (session: UserSession) => {
    setUser(session);
    localStorage.setItem('jobbank_auth', JSON.stringify(session));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('jobbank_auth');
  };

  const updateProfileId = (profileId: string) => {
    if (user) {
      const updated = { ...user, profileId };
      setUser(updated);
      localStorage.setItem('jobbank_auth', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfileId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
