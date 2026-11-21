import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, CheckCircle2, Eye, HelpCircle, RotateCcw, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { AppLayout } from '../../layouts/AppLayout.tsx';
import { apiRequest } from '../../lib/api.ts';
import type { BrainPuzzlePublic, Difficulty } from '../../types/playroom.ts';
import { playFeedbackTone } from '../../utils/sound.ts';

export const BrainTestPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { refreshProfile } = useAuth();

  const [phase, setPhase] = useState<'setup' | 'playing' | 'results'>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [sessionId, setSessionId] = useState('');
  const [puzzles, setPuzzles] = useState<BrainPuzzlePublic[]>([]);
  const [idx, setIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [memoryVisible, setMemoryVisible] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<{ isCorrect: boolean; correctIndex: number } | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  const currentPuzzle = puzzles[idx];

  const startGame = async () => {
    const res = await apiRequest<{ sessionId: string; puzzles: BrainPuzzlePublic[] }>('/games/brain/start', {
      method: 'POST',
      body: JSON.stringify({ difficulty }),
    });
    setSessionId(res.sessionId);
    setPuzzles(res.puzzles);
    setIdx(0);
    setShowHint(false);
    setSelectedIdx(null);
    setAnswerFeedback(null);
    setScore(0);
    setCorrectCount(0);
    setXpEarned(0);
    setElapsedSec(0);
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Memory sequence timed reveal
  useEffect(() => {
    if (phase !== 'playing' || !currentPuzzle?.visualData?.memorySequence) {
      setMemoryVisible(false);
      return;
    }
    setMemoryVisible(true);
    const ms = currentPuzzle.visualData.memoryRevealMs || 2600;
    const timer = setTimeout(() => setMemoryVisible(false), ms);
    return () => clearTimeout(timer);
  }, [phase, idx, currentPuzzle]);

  const submitAnswer = async (optIdx: number) => {
    if (answerFeedback !== null || !sessionId) return;
    setSelectedIdx(optIdx);
    const res = await apiRequest<{
      isCorrect: boolean;
      correctIndex: number;
      isComplete: boolean;
      score: number;
      correctCount: number;
      outcome?: { xpEarned: number };
    }>('/games/brain/answer', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        puzzleIndex: idx,
        selectedIndex: optIdx,
        usedHint: showHint,
      }),
    });

    setAnswerFeedback({ isCorrect: res.isCorrect, correctIndex: res.correctIndex });
    setCorrectCount(res.correctCount);
    setScore(res.score);
    if (res.isCorrect) playFeedbackTone('correct');
    else playFeedbackTone('wrong');

    if (res.outcome) {
      setXpEarned(res.outcome.xpEarned);
      void refreshProfile();
    }
  };

  const nextPuzzle = () => {
    if (idx + 1 >= puzzles.length) {
      playFeedbackTone('victory');
      setPhase('results');
      return;
    }
    setIdx((i) => i + 1);
    setShowHint(false);
    setSelectedIdx(null);
    setAnswerFeedback(null);
  };

  return (
    <AppLayout title={language === 'fr' ? 'Test Cérébral' : 'Brain Test'}>
      <div className="mx-auto max-w-3xl space-y-6">
        {phase === 'setup' && (
          <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">
                {language === 'fr' ? 'Test Cérébral' : 'Brain Test'}
              </h2>
              <p className="mt-1 text-sm text-[#9CA3AF]">
                {language === 'fr'
                  ? '5 épreuves progressives : suites logiques, matrices, calcul mathématique et mémoire.'
                  : '5 progressive challenges covering number sequences, pattern matrices, math, and memory.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                    difficulty === d
                      ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#F8FAFC]'
                      : 'border-[#8B5CF6]/15 bg-[#10101C] text-[#9CA3AF]'
                  }`}
                >
                  {t.common[d]}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={startGame}
              className="w-full rounded-lg bg-[#8B5CF6] py-3 text-sm font-semibold text-white hover:bg-[#7C3AED]"
            >
              {language === 'fr' ? 'Démarrer le test' : 'Start Brain Test'}
            </button>
          </div>
        )}

        {phase === 'playing' && currentPuzzle && (
          <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
              <span className="font-mono tabular-nums capitalize">
                {currentPuzzle.type} · {idx + 1} / {puzzles.length}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono tabular-nums">{elapsedSec}s</span>
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="inline-flex items-center gap-1 rounded-md border border-[#8B5CF6]/30 px-2.5 py-1 text-xs text-[#A855F7] hover:bg-[#10101C]"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Indice' : 'Hint'}</span>
                </button>
              </div>
            </div>

            <h2 className="font-display text-xl font-bold text-[#F8FAFC]">
              {language === 'fr' ? currentPuzzle.promptFr : currentPuzzle.promptEn}
            </h2>

            {currentPuzzle.visualData?.sequence && (
              <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-[#8B5CF6]/15 bg-[#10101C] p-4">
                {currentPuzzle.visualData.sequence.map((item, i) => (
                  <div
                    key={i}
                    className={`rounded-md border px-3.5 py-2 font-mono text-base font-bold ${
                      item === '?'
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#A855F7]'
                        : 'border-[#8B5CF6]/15 bg-[#151522] text-[#F8FAFC]'
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}

            {currentPuzzle.visualData?.grid && (
              <div className="grid grid-cols-3 gap-2 max-w-[200px] rounded-lg border border-[#8B5CF6]/15 bg-[#10101C] p-3">
                {currentPuzzle.visualData.grid.map((cell, i) => (
                  <div
                    key={i}
                    className={`aspect-square flex items-center justify-center rounded-md border font-mono text-base font-bold ${
                      cell === '?'
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#A855F7]'
                        : 'border-[#8B5CF6]/15 bg-[#151522] text-[#F8FAFC]'
                    }`}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            )}

            {currentPuzzle.visualData?.memorySequence && (
              <div className="rounded-lg border border-[#8B5CF6]/20 bg-[#10101C] p-5 text-center">
                {memoryVisible ? (
                  <div className="flex justify-center gap-3">
                    {currentPuzzle.visualData.memorySequence.map((tok, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-[#8B5CF6]/40 bg-[#151522] px-3.5 py-2 font-mono text-lg font-bold text-[#F8FAFC]"
                      >
                        {tok}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 text-xs text-[#9CA3AF]">
                    <Eye className="w-4 h-4 text-[#A855F7]" />
                    <span>
                      {language === 'fr'
                        ? 'Séquence masquée — sélectionnez l’ordre exact ci-dessous.'
                        : 'Sequence hidden — select the exact match below.'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {showHint && (
              <div className="rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-4 py-2.5 text-xs text-[#F8FAFC]">
                {language === 'fr' ? currentPuzzle.hintFr : currentPuzzle.hintEn}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentPuzzle.options.map((opt, oIdx) => {
                const isSelected = selectedIdx === oIdx;
                const isCorrectOpt = answerFeedback?.correctIndex === oIdx;
                let style =
                  'border-[#8B5CF6]/20 bg-[#10101C] text-[#F8FAFC] hover:border-[#8B5CF6]/60';
                if (answerFeedback) {
                  if (isCorrectOpt) style = 'border-emerald-500/70 bg-emerald-500/15 text-emerald-100';
                  else if (isSelected && !answerFeedback.isCorrect)
                    style = 'border-red-500/70 bg-red-500/15 text-red-100';
                  else style = 'border-[#8B5CF6]/10 bg-[#10101C]/60 text-[#9CA3AF]';
                }

                return (
                  <button
                    key={oIdx}
                    type="button"
                    disabled={answerFeedback !== null || memoryVisible}
                    onClick={() => submitAnswer(oIdx)}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left font-mono text-sm font-medium transition-colors disabled:opacity-60 ${style}`}
                  >
                    <span>{opt}</span>
                    {answerFeedback && isCorrectOpt && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {answerFeedback && isSelected && !answerFeedback.isCorrect && (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {answerFeedback && (
              <button
                type="button"
                onClick={nextPuzzle}
                className="w-full rounded-lg bg-[#8B5CF6] py-2.5 text-sm font-semibold text-white hover:bg-[#7C3AED]"
              >
                {idx + 1 >= puzzles.length
                  ? language === 'fr'
                    ? 'Voir les résultats'
                    : 'View Results'
                  : language === 'fr'
                    ? 'Épreuve suivante'
                    : 'Next Challenge'}
              </button>
            )}
          </div>
        )}

        {phase === 'results' && (
          <div className="rounded-xl border border-[#8B5CF6]/25 bg-[#151522] p-6 sm:p-8 text-center space-y-6">
            <Brain className="w-10 h-10 text-[#A855F7] mx-auto" />
            <div>
              <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">
                {language === 'fr' ? 'Bilan du Test Cérébral' : 'Brain Test Complete'}
              </h2>
              <p className="mt-1 text-sm text-[#9CA3AF]">
                {correctCount} / {puzzles.length}{' '}
                {language === 'fr' ? 'épreuves réussies' : 'solved'} ·{' '}
                {Math.round((correctCount / Math.max(1, puzzles.length)) * 100)}%{' '}
                {language === 'fr' ? 'précision' : 'accuracy'} · {elapsedSec}s
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="rounded-lg border border-[#8B5CF6]/15 bg-[#10101C] p-4">
                <div className="text-xs text-[#9CA3AF]">{t.common.score}</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#F8FAFC]">
                  {score}
                </div>
              </div>
              <div className="rounded-lg border border-[#8B5CF6]/15 bg-[#10101C] p-4">
                <div className="text-xs text-[#9CA3AF]">{t.common.xp}</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#A855F7]">
                  +{xpEarned}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={startGame}
                className="inline-flex items-center gap-2 rounded-lg bg-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7C3AED]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.common.replay}</span>
              </button>
              <Link
                to="/games"
                className="inline-flex items-center rounded-lg border border-[#8B5CF6]/30 px-5 py-2.5 text-sm font-medium text-[#F8FAFC]"
              >
                {t.common.back}
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
