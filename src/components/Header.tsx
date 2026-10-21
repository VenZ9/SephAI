import React from 'react';
import { Menu, Plus, Settings } from 'lucide-react';
import { SephLogo } from './SephLogo';
import { PuterUser } from '../types/chat';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  activeConversationTitle?: string;
  puterUser: PuterUser | null;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNewChat,
  onOpenSettings,
  activeConversationTitle,
  puterUser
}) => {
  return (
    <header className="h-14 border-b border-zinc-800/80 bg-black/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4">
      {/* Left controls: Sidebar toggle & App title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          type="button"
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors focus:outline-none"
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white flex-shrink-0">
            <SephLogo className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-white hidden xs:inline">
            Seph AI
          </span>

          {activeConversationTitle && (
            <span className="text-zinc-400 text-xs truncate max-w-[150px] sm:max-w-[280px] border-l border-zinc-800 pl-2 ml-1">
              {activeConversationTitle}
            </span>
          )}
        </div>
      </div>

      {/* Right controls: New Chat & User/Settings */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onNewChat}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors"
          title="Start new conversation"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        <button
          onClick={onOpenSettings}
          type="button"
          className="flex items-center gap-1.5 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors relative"
          title={puterUser ? `Signed in as ${puterUser.username}` : 'Settings & Puter Account'}
          aria-label="Settings"
        >
          {puterUser ? (
            <div className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-200 text-[10px] font-bold flex items-center justify-center">
              {puterUser.username.slice(0, 1).toUpperCase()}
            </div>
          ) : (
            <Settings className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
};
