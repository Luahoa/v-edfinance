'use client';

/**
 * Interactive Video Component - Track 4 (RedWave)
 * Epic: ved-59th - Video System Optimization
 * Bead: ved-q8q2 - Add Interactive Video Elements
 * 
 * Features:
 * - Clickable hotspots at specific timestamps
 * - Pause for quizzes during playback
 * - Interactive transcripts with jump-to
 * - Branching video narratives
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface VideoHotspot {
  id: string;
  timestamp: number; // in seconds
  position: { x: number; y: number }; // percentage (0-100)
  title: Record<string, string>; // Localized
  content: Record<string, string>; // Localized
  action?: () => void;
  link?: string;
}

export interface VideoQuiz {
  id: string;
  timestamp: number;
  question: Record<string, string>; // Localized
  options: Array<{
    id: string;
    text: Record<string, string>; // Localized
    isCorrect: boolean;
  }>;
  explanation?: Record<string, string>; // Localized
}

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: Record<string, string>; // Localized
  speaker?: string;
}

export interface VideoInteraction {
  hotspots?: VideoHotspot[];
  quizzes?: VideoQuiz[];
  transcript?: TranscriptSegment[];
  branches?: Array<{
    id: string;
    timestamp: number;
    choices: Array<{
      label: Record<string, string>;
      nextVideoUrl: string;
    }>;
  }>;
}

interface InteractiveVideoProps {
  videoUrl: string;
  interactions?: VideoInteraction;
  locale?: string;
  onQuizAnswer?: (quizId: string, answerId: string, isCorrect: boolean) => void;
  onHotspotClick?: (hotspotId: string) => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function InteractiveVideo({
  videoUrl,
  interactions = {},
  locale = 'en',
  onQuizAnswer,
  onHotspotClick,
  className = '',
}: InteractiveVideoProps) {
  const t = useTranslations('InteractiveVideo');

  // Video refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Interaction state
  const [activeHotspots, setActiveHotspots] = useState<VideoHotspot[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<VideoQuiz | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [activeSegment, setActiveSegment] = useState<TranscriptSegment | null>(null);

  // Quiz state
  const [answeredQuizzes, setAnsweredQuizzes] = useState<Set<string>>(new Set());

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      checkInteractions(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  // ============================================================================
  // INTERACTION LOGIC
  // ============================================================================

  const checkInteractions = useCallback(
    (time: number) => {
      // Check hotspots (visible for 3 seconds)
      if (interactions.hotspots) {
        const visible = interactions.hotspots.filter(
          (h) => time >= h.timestamp && time < h.timestamp + 3
        );
        setActiveHotspots(visible);
      }

      // Check quizzes
      if (interactions.quizzes) {
        const quiz = interactions.quizzes.find(
          (q) => Math.abs(time - q.timestamp) < 0.5 && !answeredQuizzes.has(q.id)
        );

        if (quiz && !activeQuiz) {
          setActiveQuiz(quiz);
          videoRef.current?.pause();
        }
      }

      // Check transcript segment
      if (interactions.transcript) {
        const segment = interactions.transcript.find(
          (s) => time >= s.startTime && time < s.endTime
        );
        setActiveSegment(segment || null);
      }
    },
    [interactions, activeQuiz, answeredQuizzes]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleHotspotClick = (hotspot: VideoHotspot) => {
    onHotspotClick?.(hotspot.id);

    if (hotspot.action) {
      hotspot.action();
    } else if (hotspot.link) {
      window.open(hotspot.link, '_blank');
    }
  };

  const handleQuizSubmit = (answerId: string) => {
    if (!activeQuiz) return;

    const selectedOption = activeQuiz.options.find((opt) => opt.id === answerId);
    if (!selectedOption) return;

    setQuizAnswer(answerId);
    setShowExplanation(true);
    setAnsweredQuizzes((prev) => new Set(prev).add(activeQuiz.id));

    onQuizAnswer?.(activeQuiz.id, answerId, selectedOption.isCorrect);
  };

  const handleQuizContinue = () => {
    setActiveQuiz(null);
    setQuizAnswer(null);
    setShowExplanation(false);
    videoRef.current?.play();
  };

  const handleTranscriptSeek = (segment: TranscriptSegment) => {
    if (!videoRef.current) return;

    videoRef.current.currentTime = segment.startTime;
    setShowTranscript(false);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div ref={containerRef} className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video"
        onClick={handlePlayPause}
      />

      {/* Hotspots Overlay */}
      <AnimatePresence>
        {activeHotspots.map((hotspot) => (
          <motion.button
            key={hotspot.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => handleHotspotClick(hotspot)}
            className="absolute bg-primary/80 text-primary-foreground px-3 py-2 rounded-lg shadow-lg hover:bg-primary transition-colors cursor-pointer z-10"
            style={{
              left: `${hotspot.position.x}%`,
              top: `${hotspot.position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {hotspot.title[locale] || hotspot.title.en}
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Quiz Overlay */}
      <AnimatePresence>
        {activeQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 flex items-center justify-center z-20 p-6"
          >
            <div className="bg-card rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">
                {activeQuiz.question[locale] || activeQuiz.question.en}
              </h3>

              <div className="space-y-3 mb-6">
                {activeQuiz.options.map((option) => {
                  const isSelected = quizAnswer === option.id;
                  const showResult = showExplanation;
                  const isCorrect = option.isCorrect;

                  return (
                    <button
                      key={option.id}
                      onClick={() => !showExplanation && handleQuizSubmit(option.id)}
                      disabled={showExplanation}
                      className={`
                        w-full text-left p-4 rounded-lg border-2 transition-all
                        ${isSelected && !showResult ? 'border-primary bg-primary/10' : 'border-border'}
                        ${showResult && isSelected && isCorrect ? 'border-green-500 bg-green-500/10' : ''}
                        ${showResult && isSelected && !isCorrect ? 'border-red-500 bg-red-500/10' : ''}
                        ${showResult && !isSelected && isCorrect ? 'border-green-500 bg-green-500/5' : ''}
                        ${!showExplanation ? 'hover:border-primary cursor-pointer' : 'cursor-default'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {showResult && isSelected && (
                          isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          )
                        )}
                        {showResult && !isSelected && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                        <span>{option.text[locale] || option.text.en}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {showExplanation && activeQuiz.explanation && (
                <div className="bg-muted p-4 rounded-lg mb-4">
                  <p className="text-sm">
                    {activeQuiz.explanation[locale] || activeQuiz.explanation.en}
                  </p>
                </div>
              )}

              {showExplanation && (
                <button
                  onClick={handleQuizContinue}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {t('continue', { default: 'Continue' })}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript Toggle */}
      {interactions.transcript && interactions.transcript.length > 0 && (
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="absolute bottom-4 right-4 bg-card/90 p-3 rounded-lg shadow-lg hover:bg-card transition-colors z-10"
          aria-label={t('transcript', { default: 'Transcript' })}
        >
          <FileText className="w-5 h-5" />
        </button>
      )}

      {/* Transcript Panel */}
      <AnimatePresence>
        {showTranscript && interactions.transcript && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-card shadow-2xl z-30 overflow-y-auto"
          >
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-card">
              <h3 className="font-semibold">{t('transcript', { default: 'Transcript' })}</h3>
              <button
                onClick={() => setShowTranscript(false)}
                className="p-1 hover:bg-accent rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {interactions.transcript.map((segment) => {
                const isActive = activeSegment?.id === segment.id;

                return (
                  <button
                    key={segment.id}
                    onClick={() => handleTranscriptSeek(segment)}
                    className={`
                      w-full text-left p-3 rounded-lg transition-colors
                      ${isActive ? 'bg-primary/10 border-2 border-primary' : 'bg-accent/50 hover:bg-accent border-2 border-transparent'}
                    `}
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {Math.floor(segment.startTime / 60)}:
                      {String(Math.floor(segment.startTime % 60)).padStart(2, '0')}
                    </div>
                    <p className={`text-sm ${isActive ? 'text-primary font-medium' : ''}`}>
                      {segment.text[locale] || segment.text.en}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause Overlay */}
      {!isPlaying && !activeQuiz && (
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors z-10"
        >
          <Play className="w-16 h-16 text-white" />
        </button>
      )}
    </div>
  );
}
