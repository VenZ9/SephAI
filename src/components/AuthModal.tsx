import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { SephLogo } from './SephLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => Promise<void>;
  pendingMessageText?: string;
  authError?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  pendingMessageText,
  authError,
}) => {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignInClick = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      await onSignIn();
    } catch (err: any) {
      setLocalError(err?.message || 'Sign in could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#111114] border border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Center Brand Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-xl">
            <SephLogo className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="text-lg font-semibold tracking-tight text-white mb-1.5">
            Sign in with Puter to Chat
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Puter provides access to top-tier AI models (Claude, GPT-4o, DeepSeek) directly from your browser without requiring manual API keys.
          </p>
        </div>

        {/* Message Preservation Preview */}
        {pendingMessageText && (
          <div className="mb-4 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/80 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1 text-[11px] font-medium">
              <Sparkles className="w-3 h-3 text-white" />
              <span>Message ready to send:</span>
            </div>
            <p className="text-zinc-200 line-clamp-2 italic">
              "{pendingMessageText}"
            </p>
          </div>
        )}

        {/* Error Notice */}
        {displayedError && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/20 border border-red-900/40 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              {displayedError}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleSignInClick}
            disabled={loading}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 font-medium text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Waiting for Puter Sign-in...</span>
              </>
            ) : (
              <>
                <span>Sign in with Puter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <button
            onClick={onClose}
            disabled={loading}
            type="button"
            className="w-full py-2 px-4 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 text-xs transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
        </div>

        {/* Honest info note */}
        <div className="text-center mt-4 text-[10px] text-zinc-500">
          A popup will appear to sign into Puter. Once authorized, your chat will resume automatically.
        </div>
      </div>
    </div>
  );
};
