import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Search, 
  Settings, 
  LogIn, 
  LogOut, 
  Github,
  PanelLeftClose
} from 'lucide-react';
import { Conversation, PuterUser } from '../types/chat';
import { SephLogo } from './SephLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  puterUser: PuterUser | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onOpenSettings,
  onSignIn,
  onSignOut,
  puterUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = () => {
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this chat permanently?')) {
      onDeleteConversation(id);
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-[#0c0c0e] border-r border-zinc-800/80 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        {/* Header / Brand */}
        <div className="p-3.5 border-b border-zinc-800/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <SephLogo className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-sm text-white tracking-tight block">
                Seph AI
              </span>
              <span className="text-[10px] text-zinc-400 block font-mono">
                Puter.js Powered
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 lg:hidden"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Action: New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-medium transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        {conversations.length > 0 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="w-full bg-[#141418] border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-700"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          <div className="px-2 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Recent Chats ({filteredConversations.length})
          </div>

          {filteredConversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-zinc-400">
              {searchQuery ? 'No matching chats found' : 'No conversation history yet'}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeId;
              const isEditing = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-zinc-800/90 text-white font-medium border border-zinc-700/60'
                      : 'text-zinc-300 hover:bg-zinc-850 hover:text-zinc-100'
                  }`}
                >
                  {isEditing ? (
                    <form
                      onSubmit={(e) => handleSaveRename(conv.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 w-full"
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="p-1 hover:text-emerald-400 text-zinc-400"
                        title="Save title"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        className="p-1 hover:text-red-400 text-zinc-400"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400 group-hover:text-zinc-300" />
                        <span className="truncate">{conv.title}</span>
                      </div>

                      {/* Action buttons (Rename & Delete) */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(conv, e)}
                          className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-700/60"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(conv.id, e)}
                          className="p-1 text-zinc-400 hover:text-red-400 rounded hover:bg-zinc-700/60"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Account & Settings */}
        <div className="p-3 border-t border-zinc-800/70 bg-[#0d0d10] space-y-1.5">
          {/* Puter Account Status */}
          {puterUser ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800/80 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-zinc-700 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                  {puterUser.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="text-zinc-200 font-medium truncate block">
                    {puterUser.username}
                  </span>
                  <span className="text-[10px] text-emerald-400 block">
                    Puter Connected
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="p-1 text-zinc-400 hover:text-zinc-200"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <LogIn className="w-3.5 h-3.5 text-zinc-400" />
                <span>Sign in with Puter</span>
              </div>
              <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">Free</span>
            </button>
          )}

          {/* Settings & Links */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 py-1 px-1.5 rounded transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            <a
              href="https://github.com/VenZ9/SephAI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 py-1 px-1.5 rounded transition-colors"
              title="GitHub Repository"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};
