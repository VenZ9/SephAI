import React, { useRef, useEffect, useState } from 'react';
import { ArrowUp, Square, ChevronDown, Sparkles, Check } from 'lucide-react';
import { ModelOption } from '../types/chat';

interface ComposerProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  availableModels: ModelOption[];
  disabled?: boolean;
}

export const Composer: React.FC<ComposerProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isStreaming,
  selectedModel,
  onSelectModel,
  availableModels,
  disabled
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea according to content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // Cap at 200px max height
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  // Close model dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    if (modelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modelDropdownOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim() && !disabled) {
        onSend();
      }
    }
  };

  const currentModelObj = availableModels.find(m => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel,
    provider: 'Puter'
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-1">
      <div className="relative rounded-2xl bg-[#121215] border border-zinc-800 focus-within:border-zinc-600 transition-all shadow-xl">
        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent px-4 pt-3.5 pb-2 text-[15px] text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none leading-relaxed block"
          style={{ minHeight: '48px', maxHeight: '200px' }}
        />

        {/* Bottom Controls Bar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          {/* Model Selection Pill */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
              title="Select AI Model"
            >
              <Sparkles className="w-3 h-3 text-zinc-400" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {currentModelObj.name}
              </span>
              <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {modelDropdownOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-72 sm:w-80 max-h-72 overflow-y-auto rounded-xl bg-[#16161a] border border-zinc-800 shadow-2xl p-1.5 z-50">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/60 mb-1">
                  Select AI Model
                </div>
                {availableModels.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(m.id);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full flex items-start justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                      selectedModel === m.id
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-zinc-200">{m.name}</span>
                        {m.tag && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-700/60 text-zinc-300 font-mono">
                            {m.tag}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {m.description || m.provider}
                      </div>
                    </div>
                    {selectedModel === m.id && (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Button: Send or Stop */}
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="w-8 h-8 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center transition-all shadow-md"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!input.trim() || disabled}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  input.trim() && !disabled
                    ? 'bg-white text-black hover:bg-zinc-200 shadow-md cursor-pointer'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                }`}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subtle footnote */}
      <div className="text-center mt-2 text-[11px] text-zinc-400">
        <span>Seph AI may produce inaccurate information. Powered by Puter.js.</span>
      </div>
    </div>
  );
};
