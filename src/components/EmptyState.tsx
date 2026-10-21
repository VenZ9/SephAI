import React from 'react';
import { SephLogo } from './SephLogo';
import { Lightbulb, Code2, Sparkles, Compass } from 'lucide-react';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectPrompt }) => {
  const suggestions = [
    {
      icon: <Sparkles className="w-4 h-4 text-zinc-300" />,
      title: 'Explain simply',
      prompt: 'Explain quantum computing in simple terms with an everyday analogy.',
    },
    {
      icon: <Code2 className="w-4 h-4 text-zinc-300" />,
      title: 'Write code',
      prompt: 'Write a type-safe TypeScript debounce hook with cancellation support.',
    },
    {
      icon: <Compass className="w-4 h-4 text-zinc-300" />,
      title: 'Brainstorm',
      prompt: 'Brainstorm 5 innovative, privacy-focused open source web utility tools.',
    },
    {
      icon: <Lightbulb className="w-4 h-4 text-zinc-300" />,
      title: 'Analyze & Debug',
      prompt: 'What are the most common performance bottlenecks in modern React applications?',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto px-4 text-center my-auto">
      {/* Monochrome Brand Mark */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-[#0d0d10] border border-zinc-800/80 flex items-center justify-center text-white shadow-2xl">
          <SephLogo className="w-12 h-12 text-white" />
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-2">
        Where would you like to begin?
      </h1>
      <p className="text-sm text-zinc-400 mb-8 max-w-md">
        Minimalist, responsive AI interface with persistent local history, streaming markdown, and client-side intelligence.
      </p>

      {/* Suggestion Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-[#111114] hover:bg-[#18181c] border border-zinc-800/80 hover:border-zinc-700 text-left transition-all duration-150 group"
          >
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/60 group-hover:bg-zinc-850 flex-shrink-0">
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-zinc-300 block mb-0.5">
                {item.title}
              </span>
              <span className="text-xs text-zinc-400 line-clamp-1 group-hover:text-zinc-300 transition-colors">
                {item.prompt}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
