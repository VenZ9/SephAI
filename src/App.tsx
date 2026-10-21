import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { Composer } from './components/Composer';
import { EmptyState } from './components/EmptyState';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { 
  Conversation, 
  ChatMessage as ChatMessageType, 
  AppSettings, 
  PuterUser, 
  POPULAR_MODELS, 
  ModelOption 
} from './types/chat';
import { 
  loadConversations, 
  saveConversations, 
  loadActiveConversationId, 
  saveActiveConversationId, 
  loadSettings, 
  saveSettings, 
  clearAllConversations,
  savePendingAuthAction,
  loadPendingAuthAction,
  clearPendingAuthAction
} from './services/storageService';
import { 
  waitForPuter, 
  isPuterSignedIn,
  getPuterUser, 
  signInPuter, 
  signOutPuter, 
  streamChatResponse, 
  fetchAvailableModels,
  PuterAuthError
} from './services/puterService';
import { ArrowDown, AlertCircle, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  // State
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string | null>(() => loadActiveConversationId());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [selectedModel, setSelectedModel] = useState<string>(() => loadSettings().defaultModel);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>(POPULAR_MODELS);
  const [puterUser, setPuterUser] = useState<PuterUser | null>(null);

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingMessagePreview, setPendingMessagePreview] = useState<string | undefined>(undefined);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // References
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const hasResumedPendingRef = useRef<boolean>(false);

  // Initialize Puter, load models, user, and resume pending auth action if returning from redirect
  useEffect(() => {
    let isMounted = true;
    (async () => {
      await waitForPuter(4000);
      if (!isMounted) return;

      // 1. Fetch user status
      const user = await getPuterUser();
      if (isMounted) setPuterUser(user);

      // 2. Fetch available models from Puter
      const models = await fetchAvailableModels();
      if (isMounted && models.length > 0) {
        setAvailableModels(models);

        // If current selectedModel is a legacy retired model, migrate it
        setSelectedModel((curr) => {
          const isKnownUnavailable = ['claude-3-5-sonnet', 'claude-3.5-sonnet', 'claude-3-7-sonnet', 'deepseek-chat'].includes(curr);
          if (isKnownUnavailable) {
            return POPULAR_MODELS[0].id;
          }
          return curr;
        });
      }

      // 3. Handle pending auth action (e.g. returning from mobile browser redirect or popup)
      if (!hasResumedPendingRef.current) {
        hasResumedPendingRef.current = true;
        const pendingAction = loadPendingAuthAction();
        if (pendingAction) {
          // Clear pending action FIRST to prevent loops or duplicate submissions
          clearPendingAuthAction();

          const currentlySignedIn = isPuterSignedIn();
          if (currentlySignedIn && user) {
            // User successfully authenticated! Resume sending
            if (pendingAction.type === 'send_message' && pendingAction.messageText) {
              if (isMounted) {
                if (pendingAction.conversationId) {
                  setActiveId(pendingAction.conversationId);
                }
                setTimeout(() => {
                  handleSendMessage(pendingAction.messageText, pendingAction.conversationId);
                }, 300);
              }
            }
          } else {
            // User returned but authentication was not completed
            if (isMounted && pendingAction.messageText) {
              setInput(pendingAction.messageText);
              setAuthNotice('Sign-in was not completed. Your message was preserved in the composer.');
              setTimeout(() => setAuthNotice(null), 6000);
            }
          }
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save conversations whenever changed
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Save activeId whenever changed
  useEffect(() => {
    saveActiveConversationId(activeId);
  }, [activeId]);

  // Get current active conversation
  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // Auto scroll to bottom when messages update
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    if (isNearBottom) {
      scrollToBottom('smooth');
    }
  }, [activeConversation?.messages]);

  // Scroll position listener for "Scroll to bottom" button
  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 200;
    setShowScrollBottom(isScrolledUp);
  };

  // Start new conversation
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopGeneration();
    }
    setActiveId(null);
    setInput('');
  };

  // Select conversation
  const handleSelectConversation = (id: string) => {
    if (isStreaming) {
      handleStopGeneration();
    }
    setActiveId(id);
    const target = conversations.find((c) => c.id === id);
    if (target?.model) {
      // Validate model exists, else keep current
      const isLegacy = ['claude-3-5-sonnet', 'claude-3.5-sonnet', 'deepseek-chat'].includes(target.model);
      setSelectedModel(isLegacy ? POPULAR_MODELS[0].id : target.model);
    }
  };

  // Rename conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Delete conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Clear all data
  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to delete all conversations permanently?')) {
      clearAllConversations();
      clearPendingAuthAction();
      setConversations([]);
      setActiveId(null);
      setSettingsOpen(false);
    }
  };

  // Explicit Puter Auth flow
  const handleSignIn = async () => {
    try {
      const user = await signInPuter();
      setPuterUser(user);
      setAuthModalOpen(false);
      setAuthNotice(null);

      // Check if there was a pending action
      const pending = loadPendingAuthAction();
      if (pending) {
        clearPendingAuthAction();
        if (pending.type === 'send_message' && pending.messageText) {
          if (pending.conversationId) setActiveId(pending.conversationId);
          setTimeout(() => {
            handleSendMessage(pending.messageText, pending.conversationId);
          }, 150);
        }
      }
    } catch (err: any) {
      if (err instanceof PuterAuthError && (err.code === 'auth_canceled' || err.code === 'popup_blocked')) {
        setAuthNotice(err.message);
        setTimeout(() => setAuthNotice(null), 5000);
      } else {
        alert(err?.message || 'Puter sign in could not be completed.');
      }
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutPuter();
      setPuterUser(null);
      clearPendingAuthAction();
    } catch (err: any) {
      alert(err.message || 'Puter sign out failed.');
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // Update message state cleanly
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeId) return c;
        const updatedMessages = c.messages.map((m) =>
          m.isStreaming ? { ...m, isStreaming: false } : m
        );
        return { ...c, messages: updatedMessages, updatedAt: Date.now() };
      })
    );
  };

  // Send Message
  const handleSendMessage = async (textToSend?: string, targetConvId?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isStreaming) return;

    // Check authentication upfront before initiating request to prevent unexpected redirects
    if (!isPuterSignedIn()) {
      let convId = targetConvId || activeId;
      if (!convId) {
        convId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      }
      // Save pending action to localStorage
      savePendingAuthAction({
        type: 'send_message',
        conversationId: convId,
        messageText: text,
        model: selectedModel,
        timestamp: Date.now()
      });
      setPendingMessagePreview(text);
      setAuthModalOpen(true);
      return;
    }

    setInput('');

    let currentConvId = targetConvId || activeId;
    let currentConv = conversations.find((c) => c.id === currentConvId);

    // If no active conversation, create one
    if (!currentConvId || !currentConv) {
      const newId = currentConvId || ('conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
      const title = text.length > 36 ? text.substring(0, 36).trim() + '...' : text;
      const newConv: Conversation = {
        id: newId,
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: selectedModel,
        messages: [],
      };
      setConversations((prev) => [newConv, ...prev.filter(c => c.id !== newId)]);
      setActiveId(newId);
      currentConvId = newId;
      currentConv = newConv;
    }

    // Create user message
    const userMessage: ChatMessageType = {
      id: 'msg_u_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    // Create assistant placeholder message
    const assistantMessageId = 'msg_a_' + Date.now();
    const assistantMessage: ChatMessageType = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelUsed: selectedModel,
      isStreaming: true,
    };

    // Filter out previous failed/empty assistant messages before appending new turn
    const cleanPreviousMessages = currentConv.messages.filter(
      (m) => !(m.role === 'assistant' && (!m.content || m.content.trim() === '')) && !m.isError
    );

    const updatedMessages = [...cleanPreviousMessages, userMessage, assistantMessage];

    // Update conversation state with user & empty assistant placeholder
    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConvId
          ? { ...c, messages: updatedMessages, updatedAt: Date.now(), model: selectedModel }
          : c
      )
    );

    // Setup streaming request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);

    try {
      // Pass full conversation history up to the user message
      const historyToSend = [...cleanPreviousMessages, userMessage];

      const fullOutput = await streamChatResponse(
        historyToSend,
        settings.systemPrompt,
        selectedModel,
        settings.temperature,
        controller.signal,
        (currentChunk) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== currentConvId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: currentChunk }
                    : m
                ),
              };
            })
          );
        },
        availableModels
      );

      // Finish streaming successfully
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== currentConvId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: fullOutput, isStreaming: false }
                : m
            ),
            updatedAt: Date.now(),
          };
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Cleanly handled on user stop
        return;
      }

      if (err instanceof PuterAuthError) {
        setPuterUser(null);
        // Save pending action for quick retry after sign-in
        savePendingAuthAction({
          type: 'send_message',
          conversationId: currentConvId,
          messageText: text,
          model: selectedModel,
          timestamp: Date.now()
        });
      }

      const errorMessage = err?.message || 'Failed to generate response.';

      // Mark assistant message with clean, honest error state
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== currentConvId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: m.content || '',
                    isStreaming: false,
                    isError: true,
                    errorMessage,
                  }
                : m
            ),
            updatedAt: Date.now(),
          };
        })
      );
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = async () => {
    if (!activeConversation || isStreaming) return;
    const messages = activeConversation.messages;
    if (messages.length === 0) return;

    // Find the last user message
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user' && messages[i].content && messages[i].content.trim()) {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const userMsgToRerun = messages[lastUserIndex].content;

    // Truncate messages to right before that user message
    const trimmedMessages = messages.slice(0, lastUserIndex);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, messages: trimmedMessages, updatedAt: Date.now() } : c
      )
    );

    // Re-send user message
    await handleSendMessage(userMsgToRerun, activeId || undefined);
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setSelectedModel(newSettings.defaultModel);
  };

  const hasMessages = activeConversation && activeConversation.messages.length > 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-zinc-100">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setSettingsOpen(true)}
        onSignIn={() => {
          setPendingMessagePreview(undefined);
          setAuthModalOpen(true);
        }}
        onSignOut={handleSignOut}
        puterUser={puterUser}
      />

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNewChat={handleNewChat}
          onOpenSettings={() => setSettingsOpen(true)}
          activeConversationTitle={activeConversation?.title}
          puterUser={puterUser}
        />

        {/* Global Temporary Auth / Session Notice */}
        {authNotice && (
          <div className="mx-4 sm:mx-8 mt-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs text-zinc-200 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <span>{authNotice}</span>
            </div>
            <button
              onClick={() => setAuthNotice(null)}
              className="text-zinc-400 hover:text-white px-1.5 py-0.5 rounded text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Unauthenticated subtle warning bar if user has no Puter session yet */}
        {!puterUser && !authNotice && (
          <div className="mx-4 sm:mx-8 mt-2 py-1.5 px-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-zinc-400" />
              <span>Puter authentication required for chat. Sign in for seamless free access.</span>
            </div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="text-white hover:underline font-medium text-[11px]"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Scrollable Chat Area */}
        <div
          ref={chatScrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6"
        >
          {hasMessages ? (
            <div className="max-w-3xl mx-auto w-full">
              {activeConversation.messages.map((msg, index) => {
                const isLatestAssistant =
                  msg.role === 'assistant' &&
                  index === activeConversation.messages.length - 1;

                return (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    onRegenerate={isLatestAssistant ? handleRegenerate : undefined}
                    onSignIn={() => {
                      setPendingMessagePreview(undefined);
                      setAuthModalOpen(true);
                    }}
                    isLatestAssistant={isLatestAssistant}
                    isStreaming={msg.isStreaming && isStreaming}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <EmptyState onSelectPrompt={(prompt) => handleSendMessage(prompt)} />
          )}
        </div>

        {/* Scroll to bottom float button */}
        {showScrollBottom && (
          <button
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-24 right-6 sm:right-10 p-2 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white border border-zinc-700 shadow-xl transition-all z-20 cursor-pointer"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        {/* Bottom Composer */}
        <Composer
          input={input}
          setInput={setInput}
          onSend={() => handleSendMessage()}
          onStop={handleStopGeneration}
          isStreaming={isStreaming}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          availableModels={availableModels}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        puterUser={puterUser}
        onSignIn={() => {
          setSettingsOpen(false);
          setAuthModalOpen(true);
        }}
        onSignOut={handleSignOut}
        onClearAllData={handleClearAllData}
        conversations={conversations}
        availableModels={availableModels}
      />

      {/* Explicit Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          clearPendingAuthAction();
        }}
        onSignIn={handleSignIn}
        pendingMessageText={pendingMessagePreview}
      />
    </div>
  );
};

export default App;
