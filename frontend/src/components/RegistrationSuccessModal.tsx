/* src/components/RegistrationSuccessModal.tsx */
import React, { useState } from 'react';
import { CheckCircle, Copy, Check } from 'lucide-react';

interface RegistrationSuccessModalProps {
  refNo: string;
  message?: string;
  buttonLabel?: string;
  onClose: () => void;
}

const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
  refNo,
  message = 'Registration successful.',
  buttonLabel = 'Continue',
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(refNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (e.g. plain http on the LAN); the number is still visible to note down
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-success-title"
    >
      <div className="max-w-md w-full glass p-8 rounded-3xl shadow-2xl relative border border-slate-800 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </div>

        <h3 id="registration-success-title" className="text-xl font-extrabold text-slate-100 mb-2">
          {message}
        </h3>
        <p className="text-sm text-slate-400 mb-6">This reference number is valid for today only. On a later visit, the admin office will issue a new one.</p>

        <div className="mb-6 flex items-center justify-center gap-3 px-4 py-3 bg-purple-950/40 border border-purple-500/25 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400">REF NO</span>
          <span className="text-lg font-mono font-bold tracking-wider text-purple-300">{refNo}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors cursor-pointer"
            title="Copy reference number"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg hover:shadow-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 cursor-pointer"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};

export default RegistrationSuccessModal;
