'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuthStore } from '@/store/useAuthStore';
import type { ChatMessage, ChatThread } from '@/types/chat';
import {
  Bot,
  ClipboardCheck,
  ExternalLink,
  Loader2,
  MessageSquare,
  Play,
  Plus,
  Send,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function AiMentor() {
  const t = useTranslations('Dashboard');
  const { token } = useAuthStore();
  const { trackEvent } = useAnalytics();

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai/threads`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setThreads(data);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchMessages = useCallback(
    async (threadId: string) => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai/threads/${threadId}/messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setMessages(data);
      } catch (e) {
        console.error(e);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token) {
      fetchThreads();
    }
  }, [token, fetchThreads]);

  useEffect(() => {
    if (currentThread) {
      fetchMessages(currentThread.id);
    }
  }, [currentThread, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createNewThread = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai/threads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: `Hội thoại mới ${new Date().toLocaleTimeString()}` }),
        }
      );
      const newThread = await res.json();
      setThreads([newThread, ...threads]);
      setCurrentThread(newThread);
      setIsSidebarOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !currentThread) return;

    const userPrompt = input;
    setInput('');
    setIsLoading(true);

    // Track analytics
    trackEvent('SEND_CHAT_MESSAGE', { threadId: currentThread.id });

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai/threads/${currentThread.id}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prompt: userPrompt }),
        }
      );
      await res.json();

      // Refresh messages to include user message and AI response
      await fetchMessages(currentThread.id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4 dark:border-zinc-800">
        <div className="flex items-center gap-2 font-semibold">
          <Bot className="h-5 w-5 text-blue-600" />
          <span>{currentThread ? currentThread.title : t('aiMentor')}</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar (Thread List) */}
        {isSidebarOpen && (
          <div className="absolute inset-0 z-10 flex flex-col bg-white dark:bg-zinc-950 sm:relative sm:w-64 sm:border-r dark:border-zinc-800">
            <div className="p-4">
              <button
                onClick={createNewThread}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Thread mới
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => {
                    setCurrentThread(thread);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full rounded-lg p-3 text-left text-sm transition-colors ${
                    currentThread?.id === thread.id
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <p className="font-medium truncate">{thread.title}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(thread.updatedAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {!currentThread ? (
              <div className="flex h-full flex-col items-center justify-center text-center space-y-4">
                <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/20">
                  <Bot className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold">{t('aiWelcome')}</h3>
                <button
                  onClick={createNewThread}
                  className="rounded-lg border border-blue-600 px-6 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  Bắt đầu thảo luận ngay
                </button>
              </div>
            ) : messages.length === 0 && !isLoading ? (
              <div className="text-center text-zinc-500 mt-10">
                Hãy bắt đầu câu hỏi đầu tiên của bạn...
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex max-w-[85%] gap-2 rounded-2xl p-4 ${
                      m.role === 'USER'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100'
                    }`}
                  >
                    {m.role === 'ASSISTANT' && <Bot className="h-5 w-5 shrink-0 mt-1" />}
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                    {/* Action Card Renderer */}
                    {m.metadata?.hasActionCard && (
                      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                            {m.metadata.type === 'COURSE_LINK' && (
                              <Play className="h-5 w-5 text-blue-600" />
                            )}
                            {m.metadata.type === 'QUIZ' && (
                              <ClipboardCheck className="h-5 w-5 text-blue-600" />
                            )}
                            {m.metadata.type === 'UPDATE_PROFILE' && (
                              <ExternalLink className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">
                              {m.metadata.label}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              trackEvent('CLICK_ACTION_CARD', {
                                type: m.metadata?.type,
                                threadId: currentThread.id,
                              });
                              // Handle action based on type
                              if (
                                m.metadata?.type === 'COURSE_LINK' &&
                                m.metadata.payload &&
                                typeof m.metadata.payload === 'object' &&
                                'id' in m.metadata.payload
                              ) {
                                window.location.href = `/${(m.metadata.payload as { id: string }).id}`;
                              }
                            }}
                            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                          >
                            Thực hiện
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-4 dark:border-zinc-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={currentThread ? t('aiPlaceholder') : 'Chọn thread để bắt đầu...'}
                disabled={!currentThread || isLoading}
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim() || !currentThread}
                className="rounded-xl bg-blue-600 p-3 text-white transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
