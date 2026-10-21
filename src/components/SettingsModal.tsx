import React, { useEffect } from 'react';
import { X, User, LogIn, LogOut, Trash2, Download, RotateCcw, ShieldCheck } from 'lucide-react';
import { AppSettings, PuterUser, ModelOption, DEFAULT_SETTINGS, Conversation } from '../types/chat';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  puterUser: PuterUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onClearAllData: () => void;
  conversations: Conversation[];
  availableModels: ModelOption[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  puterUser,
  onSignIn,
  onSignOut,
  onClearAllData,
  conversations,
  availableModels,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `seph-ai-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetSystemPrompt = () => {
    onUpdateSettings({
      ...settings,
      systemPrompt: DEFAULT_SETTINGS.systemPrompt,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col bg-[#111114] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 text-sm">
          {/* Puter Account Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Puter.js Account & Quotas
              </span>
              <span className="text-[11px] text-zinc-400">Zero API Key Needed</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#16161a] border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-medium">
                    {puterUser ? puterUser.username.slice(0, 1).toUpperCase() : <User className="w-4 h-4 text-zinc-400" />}
                  </div>
                  <div>
                    <span className="font-medium text-zinc-200 block">
                      {puterUser ? puterUser.username : 'Guest Session'}
                    </span>
                    <span className="text-xs text-zinc-400 block">
                      {puterUser ? 'Authenticated Puter Account' : 'Standard Free Usage Tier'}
                    </span>
                  </div>
                </div>

                {puterUser ? (
                  <button
                    onClick={onSignOut}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={onSignIn}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-black hover:bg-zinc-200 transition-colors shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In
                  </button>
                )}
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed pt-1 border-t border-zinc-800/80">
                Puter.js provides client-side AI routing without manual API key entry. Signing in with a free Puter account provides higher rate limits and uninterrupted model availability.
              </p>
            </div>
          </div>

          {/* Model Preferences */}
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
              Model Preferences
            </span>

            {/* Default Model */}
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Default AI Model
              </label>
              <select
                value={settings.defaultModel}
                onChange={(e) => onUpdateSettings({ ...settings, defaultModel: e.target.value })}
                className="w-full bg-[#16161a] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Temperature: <span className="font-mono text-white">{settings.temperature}</span>
                </label>
                <span className="text-[11px] text-zinc-400">
                  {settings.temperature < 0.4 ? 'Precise / Code' : settings.temperature > 0.9 ? 'Creative' : 'Balanced'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => onUpdateSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                className="w-full accent-white h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* System Prompt */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Custom System Instructions
                </label>
                <button
                  onClick={handleResetSystemPrompt}
                  type="button"
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200"
                  title="Reset to default"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
              <textarea
                rows={3}
                value={settings.systemPrompt}
                onChange={(e) => onUpdateSettings({ ...settings, systemPrompt: e.target.value })}
                className="w-full bg-[#16161a] border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* Privacy & Storage */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Privacy & Data Storage
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#16161a] border border-zinc-800 text-xs text-zinc-400 leading-relaxed mb-3">
              Your conversations are stored strictly inside your browser's local storage. Seph AI contains zero analytics, zero cookies, zero tracking scripts, and no server-side telemetry.
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportData}
                disabled={conversations.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Chat History ({conversations.length})
              </button>

              <button
                type="button"
                onClick={onClearAllData}
                disabled={conversations.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/50 border border-red-900/40 disabled:opacity-40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All Conversations
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/80 bg-[#0d0d10] flex justify-end">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-1.5 rounded-xl text-xs font-medium bg-white text-black hover:bg-zinc-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
