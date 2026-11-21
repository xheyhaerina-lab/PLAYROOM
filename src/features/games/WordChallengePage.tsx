import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, RotateCcw, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { AppLayout } from '../../layouts/AppLayout.tsx';
import { apiRequest } from '../../lib/api.ts';
import type { Difficulty, WordPuzzlePublic } from '../../types/playroom.ts';
import { playFeedbackTone } from '../../utils/sound.ts';

type LetterState = 'correct' | 'present' | 'absent';

interface GuessRow {
  word: string;
  feedback: LetterState[];
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
];

export const WordChallengePage: React.FC = () => {
  const { language, t } = useLanguage();
  const { refreshProfile } = useAuth();

  const [phase, setPhase] = useState<'setup' | 'playing' | 'results'>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isDaily, setIsDaily] = useState(false);

  const [sessionId, setSessionId] = useState('');
  const [puzzle, setPuzzle] = useState<WordPuzzlePublic | null>(null);
  const [rows, setRows] = useState<GuessRow[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState('');
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(false);
  const [revealedWord, setRevealedWord] = useState('');
  const [xpEarned, setXpEarned] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  const startGame = async () => {
    setError('');
    const res = await apiRequest<{ sessionId: string; puzzle: WordPuzzlePublic }>('/games/word/start', {
      method: 'POST',
      body: JSON.stringify({ difficulty, language, isDaily }),
    });
    setSessionId(res.sessionId);
    setPuzzle(res.puzzle);
    setRows([]);
    setCurrentGuess('');
    setHintsUsed(0);
    setShowHint(false);
    setScore(0);
    setSolved(false);
    setRevealedWord('');
    setXpEarned(0);
    setElapsedSec(0);
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const submitGuess = async () => {
    if (!puzzle || !sessionId) return;
    if (currentGuess.length !== puzzle.length) {
      setError(
        language === 'fr'
          ? `Le mot doit contenir ${puzzle.length} lettres.`
          : `Word must be ${puzzle.length} letters long.`
      );
      return;
    }
    setError('');
    try {
      const res = await apiRequest<{
        feedback: LetterState[];
        solved: boolean;
        gameOver: boolean;
        targetWord?: string;
        score: number;
        outcome?: { xpEarned: number };
      }>('/games/word/guess', {
        method: 'POST',
        body: JSON.stringify({ sessionId, guess: currentGuess, hintsUsed }),
      });

      setRows((prev) => [...prev, { word: currentGuess, feedback: res.feedback }]);
      setCurrentGuess('');

      if (res.solved) playFeedbackTone('victory');
      else playFeedbackTone('click');

      if (res.gameOver) {
        setSolved(res.solved);
        setScore(res.score);
        setRevealedWord(res.targetWord || '');
        setXpEarned(res.outcome?.xpEarned ?? 0);
        void refreshProfile();
        setTimeout(() => setPhase('results'), 500);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleVirtualKey = (key: string) => {
    if (phase !== 'playing' || !puzzle) return;
    if (key === 'ENTER') {
      void submitGuess();
    } else if (key === 'DEL') {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < puzzle.length) {
      setCurrentGuess((prev) => prev + key);
    }
  };

  useEffect(() => {
    if (phase !== 'playing' || !puzzle) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        void submitGuess();
      } else if (e.key === 'Backspace') {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < puzzle.length) {
        setCurrentGuess((prev) => prev + e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, puzzle, currentGuess, sessionId, hintsUsed]);

  const revealHint = () => {
    if (!showHint) {
      setShowHint(true);
      setHintsUsed((h) => h + 1);
    }
  };

  const letterStatusMap = new Map<string, LetterState>();
  rows.forEach((row) => {
    row.word.split('').forEach((ch, idx) => {
      const st = row.feedback[idx];
      const existing = letterStatusMap.get(ch);
      if (st === 'correct' || (st === 'present' && existing !== 'correct') || !existing) {
        letterStatusMap.set(ch, st);
      }
    });
  });

  return (
    <AppLayout title={language === 'fr' ? 'Défi des Mots' : 'Word Challenge'}>
      <div className="mx-auto max-w-2xl space-y-6">
        {phase === 'setup' && (
          <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">
                {language === 'fr' ? 'Défi des Mots' : 'Word Challenge'}
              </h2>
              <p className="mt-1 text-sm text-[#9CA3AF]">
                {language === 'fr'
                  ? 'Trouvez le mot caché en 6 essais maximum. Vert = bien placé, Ambre = présent ailleurs.'
                  : 'Decode the hidden word in up to 6 attempts. Emerald = exact spot, Amber = wrong spot.'}
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
                  {t.common[d]} ({d === 'easy' ? '5' : d === 'medium' ? '6' : '7'})
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2.5 text-sm text-[#F8FAFC] cursor-pointer">
              <input
                type="checkbox"
                checked={isDaily}
                onChange={(e) => setIsDaily(e.target.checked)}
                className="rounded border-[#8B5CF6]/40 bg-[#10101C]"
              />
              <span>
                {language === 'fr' ? 'Jouer le Mot Quotidien (UTC)' : 'Play Daily UTC Word Challenge'}
              </span>
            </label>

            <button
              type="button"
              onClick={startGame}
              className="w-full rounded-lg bg-[#8B5CF6] py-3 text-sm font-semibold text-white hover:bg-[#7C3AED] transition-colors"
            >
              {language === 'fr' ? 'Commencer' : 'Start Word Challenge'}
            </button>
          </div>
        )}

        {phase === 'playing' && puzzle && (
          <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-5 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9CA3AF]">
              <span>
                {language === 'fr' ? puzzle.categoryFr : puzzle.categoryEn} ·{' '}
                {language === 'fr' ? 'Première lettre' : 'Starts with'}{' '}
                <strong className="font-mono text-[#F8FAFC]">{puzzle.firstLetter}</strong>
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono tabular-nums">{elapsedSec}s</span>
                <button
                  type="button"
                  onClick={revealHint}
                  className="inline-flex items-center gap-1 rounded-md border border-[#8B5CF6]/30 px-2.5 py-1 text-xs text-[#A855F7] hover:bg-[#10101C]"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Indice' : 'Hint'}</span>
                </button>
              </div>
            </div>

            {showHint && (
              <div className="rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-4 py-2.5 text-xs text-[#F8FAFC]">
                {language === 'fr' ? puzzle.hintFr : puzzle.hintEn}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}

            {/* Word Grid */}
            <div className="space-y-2 max-w-md mx-auto">
              {Array.from({ length: puzzle.maxAttempts }).map((_, rIdx) => {
                const submitted = rows[rIdx];
                const isActive = rIdx === rows.length;
                return (
                  <div
                    key={rIdx}
                    className="grid gap-1.5"
                    style={{ gridTemplateColumns: `repeat(${puzzle.length}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: puzzle.length }).map((__, cIdx) => {
                      const char = submitted
                        ? submitted.word[cIdx]
                        : isActive
                          ? currentGuess[cIdx] || ''
                          : '';
                      const state = submitted?.feedback[cIdx];
                      const cellStyle =
                        state === 'correct'
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-100'
                          : state === 'present'
                            ? 'border-amber-500 bg-amber-500/20 text-amber-100'
                            : state === 'absent'
                              ? 'border-slate-700 bg-[#080810] text-[#9CA3AF]'
                              : char
                                ? 'border-[#8B5CF6] bg-[#10101C] text-[#F8FAFC]'
                                : 'border-[#8B5CF6]/20 bg-[#10101C] text-[#F8FAFC]';

                      return (
                        <div
                          key={cIdx}
                          aria-label={char ? `${char} ${state || ''}` : 'empty'}
                          className={`aspect-square flex items-center justify-center rounded-lg border font-mono text-lg sm:text-xl font-bold ${cellStyle}`}
                        >
                          {char}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Virtual Keyboard */}
            <div className="space-y-1.5 pt-2">
              {KEYBOARD_ROWS.map((kRow, rIdx) => (
                <div key={rIdx} className="flex justify-center gap-1">
                  {kRow.map((k) => {
                    const st = letterStatusMap.get(k);
                    const keyBg =
                      st === 'correct'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : st === 'present'
                          ? 'bg-amber-600 text-white border-amber-500'
                          : st === 'absent'
                            ? 'bg-[#080810] text-[#6B7280] border-[#8B5CF6]/10'
                            : 'bg-[#10101C] text-[#F8FAFC] border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50';
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handleVirtualKey(k)}
                        className={`rounded-md border px-2 sm:px-3 py-2.5 text-xs font-mono font-semibold transition-colors ${keyBg}`}
                      >
                        {k}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === 'results' && (
          <div className="rounded-xl border border-[#8B5CF6]/25 bg-[#151522] p-6 sm:p-8 text-center space-y-6">
            <Trophy className="w-10 h-10 text-[#A855F7] mx-auto" />
            <div>
              <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">
                {solved
                  ? language === 'fr'
                    ? 'Mot décodé !'
                    : 'Word Decoded!'
                  : language === 'fr'
                    ? 'Essais épuisés'
                    : 'Out of Attempts'}
              </h2>
              <p className="mt-2 text-sm text-[#9CA3AF]">
                {language === 'fr' ? 'Le mot était : ' : 'Target word: '}
                <strong className="font-mono text-[#F8FAFC]">{revealedWord}</strong>
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
