import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, RotateCcw, Trophy, UsersRound, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { AppLayout } from '../../layouts/AppLayout.tsx';
import { apiRequest } from '../../lib/api.ts';
import type { Difficulty, QuizCategory, QuizQuestionPublic } from '../../types/playroom.ts';
import { playFeedbackTone } from '../../utils/sound.ts';

type GamePhase = 'setup' | 'playing' | 'results';

interface AnswerFeedback {
  isCorrect: boolean;
  correctOptionIndex: number;
  explanationEn: string;
  explanationFr: string;
  pointsAwarded: number;
}

export const QuizBattlePage: React.FC = () => {
  const { language, t } = useLanguage();
  const { refreshProfile } = useAuth();

  const [phase, setPhase] = useState<GamePhase>('setup');
  const [category, setCategory] = useState<QuizCategory | 'mixed'>('mixed');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [loading, setLoading] = useState(false);

  const [sessionId, setSessionId] = useState('');
  const [questions, setQuestions] = useState<QuizQuestionPublic[]>([]);
  const [timeLimitSec, setTimeLimitSec] = useState(20);
  const [roundIdx, setRoundIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(20);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [outcome, setOutcome] = useState<{
    xpEarned: number;
    newLevel: number;
    leveledUp: boolean;
    unlockedAchievements: string[];
  } | null>(null);

  const roundStartMs = useRef<number>(Date.now());

  const categories: { id: QuizCategory | 'mixed'; labelEn: string; labelFr: string }[] = [
    { id: 'mixed', labelEn: 'All Categories', labelFr: 'Toutes catégories' },
    { id: 'general', labelEn: 'General Knowledge', labelFr: 'Culture Générale' },
    { id: 'science', labelEn: 'Science', labelFr: 'Sciences' },
    { id: 'technology', labelEn: 'Technology', labelFr: 'Technologie' },
    { id: 'geography', labelEn: 'Geography', labelFr: 'Géographie' },
    { id: 'history', labelEn: 'History', labelFr: 'Histoire' },
    { id: 'entertainment', labelEn: 'Entertainment', labelFr: 'Divertissement' },
    { id: 'logic', labelEn: 'Logic', labelFr: 'Logique' },
  ];

  const startGame = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{
        sessionId: string;
        questions: QuizQuestionPublic[];
        timePerQuestionSec: number;
      }>('/games/quiz/start', {
        method: 'POST',
        body: JSON.stringify({ category, difficulty }),
      });
      setSessionId(res.sessionId);
      setQuestions(res.questions);
      setTimeLimitSec(res.timePerQuestionSec);
      setRoundIdx(0);
      setSecondsLeft(res.timePerQuestionSec);
      setSelectedIdx(null);
      setFeedback(null);
      setScore(0);
      setCorrectCount(0);
      setOutcome(null);
      roundStartMs.current = Date.now();
      setPhase('playing');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (optionIdx: number) => {
    if (feedback !== null || !sessionId) return;
    setSelectedIdx(optionIdx);
    const responseMs = Math.max(200, Date.now() - roundStartMs.current);
    try {
      const res = await apiRequest<
        AnswerFeedback & {
          totalScore: number;
          isComplete: boolean;
          outcome?: {
            xpEarned: number;
            newLevel: number;
            leveledUp: boolean;
            unlockedAchievements: string[];
          };
        }
      >('/games/quiz/answer', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          roundIndex: roundIdx,
          selectedIndex: optionIdx,
          responseMs,
        }),
      });
      setFeedback({
        isCorrect: res.isCorrect,
        correctOptionIndex: res.correctOptionIndex,
        explanationEn: res.explanationEn,
        explanationFr: res.explanationFr,
        pointsAwarded: res.pointsAwarded,
      });
      setScore(res.totalScore);
      if (res.isCorrect) {
        setCorrectCount((c) => c + 1);
        playFeedbackTone('correct');
      } else {
        playFeedbackTone('wrong');
      }
      if (res.outcome) {
        setOutcome(res.outcome);
        void refreshProfile();
      }
    } catch {
      // ignore duplicate
    }
  };

  // Countdown timer per round
  useEffect(() => {
    if (phase !== 'playing' || feedback !== null) return;
    if (secondsLeft <= 0) {
      void submitAnswer(-1);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, feedback, secondsLeft]);

  // Keyboard shortcuts 1-4
  useEffect(() => {
    if (phase !== 'playing' || feedback !== null) return;
    const onKey = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        void submitAnswer(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, feedback, roundIdx, sessionId]);

  const nextRound = () => {
    if (roundIdx + 1 >= questions.length) {
      playFeedbackTone('victory');
      setPhase('results');
      return;
    }
    setRoundIdx((i) => i + 1);
    setSelectedIdx(null);
    setFeedback(null);
    setSecondsLeft(timeLimitSec);
    roundStartMs.current = Date.now();
  };

  const currentQuestion = questions[roundIdx];

  return (
    <AppLayout title="Quiz Battle">
      <div className="mx-auto max-w-3xl space-y-6">
        {phase === 'setup' && (
          <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">Quiz Battle</h2>
                <p className="mt-1 text-sm text-[#9CA3AF]">
                  {language === 'fr'
                    ? '5 manches rapides. Répondez avant la fin du chrono pour maximiser votre bonus de vitesse.'
                    : '5 rapid rounds. Answer before the timer runs out to earn speed bonuses.'}
                </p>
              </div>
              <Link
                to="/multiplayer/create"
                className="inline-flex items-center gap-2 rounded-lg border border-[#8B5CF6]/30 px-3.5 py-2 text-xs font-medium text-[#F8FAFC] hover:border-[#8B5CF6]/60 whitespace-nowrap self-start"
              >
                <UsersRound className="w-4 h-4 text-[#A855F7]" />
                <span>{language === 'fr' ? 'Mode Multijoueur' : 'Multiplayer Room'}</span>
              </Link>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-2">
                {language === 'fr' ? 'Catégorie' : 'Category'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium text-left transition-colors ${
                      category === cat.id
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#F8FAFC]'
                        : 'border-[#8B5CF6]/15 bg-[#10101C] text-[#9CA3AF] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {language === 'fr' ? cat.labelFr : cat.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-2">
                {language === 'fr' ? 'Difficulté' : 'Difficulty'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`rounded-lg border px-3 py-2.5 text-xs font-medium capitalize transition-colors ${
                      difficulty === d
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#F8FAFC]'
                        : 'border-[#8B5CF6]/15 bg-[#10101C] text-[#9CA3AF] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {t.common[d]}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={startGame}
              className="w-full rounded-lg bg-[#8B5CF6] py-3 text-sm font-semibold text-white hover:bg-[#7C3AED] disabled:opacity-60 transition-colors"
            >
              {loading ? t.common.loading : language === 'fr' ? 'Lancer la partie' : 'Start Quiz Battle'}
            </button>
          </div>
        )}

        {phase === 'playing' && currentQuestion && (
          <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between gap-4 text-xs text-[#9CA3AF]">
              <span className="font-mono tabular-nums">
                {language === 'fr' ? 'Manche' : 'Round'} {roundIdx + 1} / {questions.length} ·{' '}
                <span className="capitalize">{currentQuestion.category}</span>
              </span>
              <div className="flex items-center gap-4">
                <span className="font-mono tabular-nums text-[#A855F7]">
                  {score} pts
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 font-mono tabular-nums ${
                    secondsLeft <= 5 ? 'text-red-400' : 'text-[#F8FAFC]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {secondsLeft}s
                </span>
              </div>
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F8FAFC] leading-snug">
              {language === 'fr' ? currentQuestion.promptFr : currentQuestion.promptEn}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {(language === 'fr' ? currentQuestion.optionsFr : currentQuestion.optionsEn).map(
                (opt, idx) => {
                  const isSelected = selectedIdx === idx;
                  const isCorrectOpt = feedback?.correctOptionIndex === idx;
                  let style =
                    'border-[#8B5CF6]/20 bg-[#10101C] text-[#F8FAFC] hover:border-[#8B5CF6]/60';
                  if (feedback) {
                    if (isCorrectOpt) {
                      style = 'border-emerald-500/70 bg-emerald-500/15 text-emerald-100';
                    } else if (isSelected && !feedback.isCorrect) {
                      style = 'border-red-500/70 bg-red-500/15 text-red-100';
                    } else {
                      style = 'border-[#8B5CF6]/10 bg-[#10101C]/60 text-[#9CA3AF]';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={feedback !== null}
                      onClick={() => submitAnswer(idx)}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3.5 text-left text-sm font-medium transition-colors ${style}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="font-mono text-xs text-[#9CA3AF]">{idx + 1}.</span>
                        <span>{opt}</span>
                      </span>
                      {feedback && isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {feedback && isSelected && !feedback.isCorrect && (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                    </button>
                  );
                }
              )}
            </div>

            {feedback && (
              <div className="rounded-lg border border-[#8B5CF6]/20 bg-[#10101C] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className={feedback.isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                    {feedback.isCorrect
                      ? language === 'fr'
                        ? 'Bonne réponse !'
                        : 'Correct answer!'
                      : language === 'fr'
                        ? 'Réponse incorrecte'
                        : 'Incorrect answer'}
                  </span>
                  <span className="font-mono tabular-nums text-[#A855F7]">
                    +{feedback.pointsAwarded} pts
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">
                  {language === 'fr' ? feedback.explanationFr : feedback.explanationEn}
                </p>
                <button
                  type="button"
                  onClick={nextRound}
                  className="w-full rounded-lg bg-[#8B5CF6] py-2.5 text-sm font-semibold text-white hover:bg-[#7C3AED] transition-colors"
                >
                  {roundIdx + 1 >= questions.length
                    ? language === 'fr'
                      ? 'Voir les résultats'
                      : 'View Results'
                    : language === 'fr'
                      ? 'Question suivante'
                      : 'Next Question'}
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'results' && (
          <div className="rounded-xl border border-[#8B5CF6]/25 bg-[#151522] p-6 sm:p-8 text-center space-y-6">
            <Trophy className="w-10 h-10 text-[#A855F7] mx-auto" />
            <div>
              <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">
                {language === 'fr' ? 'Partie terminée' : 'Match Complete'}
              </h2>
              <p className="mt-1 text-sm text-[#9CA3AF]">
                {correctCount} / {questions.length}{' '}
                {language === 'fr' ? 'bonnes réponses' : 'correct answers'}
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
                  +{outcome?.xpEarned ?? 0}
                </div>
              </div>
            </div>

            {outcome?.unlockedAchievements && outcome.unlockedAchievements.length > 0 && (
              <div className="text-xs text-emerald-300">
                {language === 'fr' ? 'Succès débloqués : ' : 'Unlocked achievements: '}
                {outcome.unlockedAchievements.join(', ')}
              </div>
            )}

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
                className="inline-flex items-center rounded-lg border border-[#8B5CF6]/30 px-5 py-2.5 text-sm font-medium text-[#F8FAFC] hover:border-[#8B5CF6]/60"
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
