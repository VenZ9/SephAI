import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, RotateCw, AlertCircle, Sparkles } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types/chat';
import { SephLogo } from './SephLogo';
import { CodeBlock } from './CodeBlock';

interface ChatMessageProps {
  message: ChatMessageType;
  onRegenerate?: () => void;
  onSignIn?: () => void;
  isLatestAssistant?: boolean;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegenerate,
  onSignIn,
  isLatestAssistant,
  isStreaming
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 w-full animate-in fade-in duration-200">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 bg-zinc-800/90 text-white border border-zinc-700/40 shadow-sm">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed break-words font-normal">
            {message.content}
          </p>
          <div className="mt-1.5 flex justify-end items-center text-[11px] text-zinc-400">
            <span>{formatTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="flex gap-3 sm:gap-4 mb-6 w-full animate-in fade-in duration-200">
      {/* Seph Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-inner">
          <SephLogo className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 min-w-0">
        {/* Model and Time Header */}
        <div className="flex items-center gap-2 mb-1.5 text-xs text-zinc-400">
          <span className="font-medium text-zinc-200">Seph AI</span>
          {message.modelUsed && (
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono">
              {message.modelUsed}
            </span>
          )}
          <span className="text-[11px] text-zinc-400">• {formatTime(message.timestamp)}</span>
        </div>

        {/* Message Content / Error */}
        {message.isError ? (
          <div className="p-4 rounded-xl border border-red-900/50 bg-red-950/20 text-red-200 text-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-300 mb-1">Response Failed</p>
                <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                  {message.errorMessage || message.content || 'Unable to complete request via Puter AI.'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Retry Request
                    </button>
                  )}
                  {onSignIn && message.errorMessage?.toLowerCase().includes('sign-in') && (
                    <button
                      onClick={onSignIn}
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-black hover:bg-zinc-200 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Sign In with Puter
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="prose-dark text-[15px] leading-relaxed text-zinc-200">
            {message.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    if (!inline && (match || codeString.includes('\n'))) {
                      return (
                        <CodeBlock
                          language={match ? match[1] : ''}
                          code={codeString}
                        />
                      );
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  a({ node, href, children, ...props }: any) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white underline underline-offset-4 hover:text-zinc-300"
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : isStreaming ? (
              <div className="flex items-center gap-2 text-zinc-400 text-sm py-1">
                <span className="inline-block w-2 h-2 rounded-full bg-zinc-400 animate-pulse"></span>
                <span className="text-xs">Thinking...</span>
              </div>
            ) : null}

            {/* Blinking cursor while actively streaming */}
            {isStreaming && message.content && (
              <span className="cursor-blink" />
            )}
          </div>
        )}

        {/* Action Bar Beneath Assistant Response */}
        {!message.isError && message.content && !isStreaming && (
          <div className="flex items-center gap-2 mt-3 pt-2 text-zinc-400 text-xs">
            <button
              onClick={handleCopy}
              type="button"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-zinc-800/80 hover:text-zinc-200 transition-colors"
              title="Copy response"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>

            {isLatestAssistant && onRegenerate && (
              <button
                onClick={onRegenerate}
                type="button"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-zinc-800/80 hover:text-zinc-200 transition-colors"
                title="Regenerate response"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="text-[11px]">Regenerate</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
