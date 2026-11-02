import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = false, className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Light Mode' : 'Dark Mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${label}`}
      aria-label={`Switch to ${label}`}
      className={`flex items-center justify-center space-x-2 p-2 rounded-lg border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-purple-400 hover:border-purple-500/50 transition-all duration-200 cursor-pointer ${className}`}
    >
      {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
      {showLabel && <span className="text-xs font-bold">{label}</span>}
    </button>
  );
};

export default ThemeToggle;
