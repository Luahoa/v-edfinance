'use client';

import { useState, useEffect, useRef } from 'react';
import { Heart, Coins, Briefcase, ChevronRight, Sparkles, User } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function SimLifePage() {
  const [scenario, setScenario] = useState<{ id: string; currentStatus: { age: number; job: string; savings: number; happiness: number } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<unknown[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startNewGame = async () => {
      setLoading(true);
      try {
        const data = await api.post<{ id: string; currentStatus: unknown; decisions: unknown[] }>('/simulation/life/start', {});
        setScenario(data as { id: string; currentStatus: { age: number; job: string; savings: number; happiness: number } });
        setHistory([data.decisions[0]]);
      } catch (error) {
        console.error('Failed to start scenario', error);
      } finally {
        setLoading(false);
      }
    };
    startNewGame();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const makeChoice = async (choiceId: string) => {
    if (!scenario) return;
    setLoading(true);
    try {
      const updated = await api.post<{ id: string; currentStatus: unknown; decisions: unknown[] }>('/simulation/life/continue', {
        scenarioId: scenario.id,
        choiceId
      });
      setScenario(updated as { id: string; currentStatus: { age: number; job: string; savings: number; happiness: number } });
      const nextEvent = updated.decisions[updated.decisions.length - 1];
      setHistory(prev => [...prev, nextEvent]);
    } catch (error) {
      console.error('Failed to continue scenario', error);
    } finally {
      setLoading(false);
    }
  };

  if (!scenario && loading) return <div className="p-20 text-center text-zinc-500 dark:text-zinc-400">Loading your destiny...</div>;

  return (
    <div className="container mx-auto max-w-4xl p-6 h-[calc(100vh-100px)] flex flex-col">
      {/* Stats Header */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex justify-around mb-6">
        <div className="flex items-center gap-2">
          <User className="text-blue-500" size={20} />
          <span className="font-bold">{scenario?.currentStatus.age} yrs</span>
        </div>
        <div className="flex items-center gap-2">
          <Briefcase className="text-purple-500" size={20} />
          <span className="font-medium text-sm">{scenario?.currentStatus.job}</span>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <Coins size={20} />
          <span className="font-bold">{scenario?.currentStatus.savings.toLocaleString()} VND</span>
        </div>
        <div className="flex items-center gap-2 text-red-500">
          <Heart size={20} />
          <span className="font-bold">{scenario?.currentStatus.happiness}%</span>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto space-y-6 mb-6 pr-2 custom-scrollbar"
      >
        {history.map((it, idx) => {
          const event = it as {
            choice?: string;
            eventTitle: string;
            description: string;
            aiNudge?: string;
            options: { id: string; text: string }[];
          };
          return (
            <div key={idx} className="space-y-4">
              {event.choice && (
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-none max-w-[80%] shadow-sm">
                    {event.choice}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                  <Sparkles className="text-blue-500" size={20} />
                </div>
                <div className="space-y-3 max-w-[85%]">
                  <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl rounded-tl-none shadow-sm border border-zinc-100 dark:border-zinc-700">
                    <h4 className="font-bold text-lg mb-2 text-zinc-900 dark:text-zinc-100">{event.eventTitle}</h4>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{event.description}</p>
                    
                    {event.aiNudge && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-sm text-blue-700 dark:text-blue-300 italic">
                        💡 {event.aiNudge}
                      </div>
                    )}
                  </div>

                  {/* Choices (Only show for the last event) */}
                  {idx === history.length - 1 && (
                    <div className="grid grid-cols-1 gap-2 pt-2">
                      {event.options.map((opt: { id: string; text: string }) => (
                        <button
                          key={opt.id}
                          onClick={() => makeChoice(opt.id)}
                          disabled={loading}
                          className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left group"
                        >
                          <span className="font-medium pr-4">{opt.text}</span>
                          <ChevronRight className="shrink-0 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={20} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex gap-3 animate-pulse">
             <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800" />
             <div className="h-20 w-64 bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-none" />
          </div>
        )}
      </div>
    </div>
  );
}
