import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSearch, Lock, RotateCcw, Search, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { AppLayout } from '../../layouts/AppLayout.tsx';
import { apiRequest } from '../../lib/api.ts';
import type { MysteryScenarioPublic } from '../../types/playroom.ts';
import { playFeedbackTone } from '../../utils/sound.ts';

export const MysteryRoomPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { refreshProfile } = useAuth();

  const [scenarios, setScenarios] = useState<MysteryScenarioPublic[]>([]);
  const [phase, setPhase] = useState<'select' | 'investigate' | 'results'>('select');
  const [sessionId, setSessionId] = useState('');
  const [activeCase, setActiveCase] = useState<MysteryScenarioPublic | null>(null);
  const [clueDetails, setClueDetails] = useState<Record<string, { detailEn: string; detailFr: string }>>({});
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, number>>({});
  const [accusedSuspectId, setAccusedSuspectId] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    solvedCulprit: boolean;
    culpritId: string;
    correctDeductions: number;
    totalQuestions: number;
    resolutionEn: string;
    resolutionFr: string;
    score: number;
    outcome: { xpEarned: number };
  } | null>(null);

  useEffect(() => {
    apiRequest<{ scenarios: MysteryScenarioPublic[] }>('/games/mystery/scenarios')
      .then((res) => setScenarios(res.scenarios))
      .catch(() => {});
  }, []);

  const startCase = async (scenarioId: string) => {
    setError('');
    try {
      const res = await apiRequest<{ sessionId: string; scenario: MysteryScenarioPublic }>(
        '/games/mystery/start',
        {
          method: 'POST',
          body: JSON.stringify({ scenarioId }),
        }
      );
      setSessionId(res.sessionId);
      setActiveCase(res.scenario);
      const initialClues: Record<string, { detailEn: string; detailFr: string }> = {};
      res.scenario.clues.forEach((c) => {
        if (c.detailEn) initialClues[c.id] = { detailEn: c.detailEn, detailFr: c.detailFr };
      });
      setClueDetails(initialClues);
      setQuestionAnswers({});
      setAccusedSuspectId('');
      setResult(null);
      setPhase('investigate');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const inspectClue = async (clueId: string) => {
    if (!sessionId || clueDetails[clueId]) return;
    const res = await apiRequest<{ clueId: string; detailEn: string; detailFr: string }>(
      '/games/mystery/clue',
      {
        method: 'POST',
        body: JSON.stringify({ sessionId, clueId }),
      }
    );
    playFeedbackTone('click');
    setClueDetails((prev) => ({
      ...prev,
      [clueId]: { detailEn: res.detailEn, detailFr: res.detailFr },
    }));
  };

  const submitCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || !sessionId) return;
    if (!accusedSuspectId || Object.keys(questionAnswers).length < activeCase.questions.length) {
      setError(
        language === 'fr'
          ? 'Veuillez répondre à toutes les questions de déduction et désigner un suspect.'
          : 'Please answer every deduction question and select a culprit before submitting.'
      );
      return;
    }
    setError('');
    const res = await apiRequest<NonNullable<typeof result>>('/games/mystery/submit', {
      method: 'POST',
      body: JSON.stringify({ sessionId, questionAnswers, accusedSuspectId }),
    });
    setResult(res);
    playFeedbackTone(res.solvedCulprit ? 'victory' : 'wrong');
    void refreshProfile();
    setPhase('results');
  };

  return (
    <AppLayout title={language === 'fr' ? 'Chambre Mystère' : 'Mystery Room'}>
      <div className="mx-auto max-w-4xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-200">
            {error}
          </div>
        )}

        {phase === 'select' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">
                {language === 'fr' ? 'Dossiers d’enquête disponibles' : 'Available Mystery Case Files'}
              </h2>
              <p className="mt-1 text-sm text-[#9CA3AF]">
                {language === 'fr'
                  ? 'Inspectez les preuves, vérifiez les alibis et identifiez le véritable responsable.'
                  : 'Inspect physical evidence, verify suspect alibis, and submit your final deduction.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {scenarios.map((sc) => (
                <div
                  key={sc.id}
                  className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs text-[#9CA3AF] mb-1.5">
                      {t.common[sc.difficulty]} · {language === 'fr' ? sc.locationFr : sc.locationEn}
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#F8FAFC]">
                      {language === 'fr' ? sc.titleFr : sc.titleEn}
                    </h3>
                    <p className="mt-2 text-xs text-[#9CA3AF] leading-relaxed">
                      {language === 'fr' ? sc.introFr : sc.introEn}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startCase(sc.id)}
                    className="mt-5 w-full rounded-lg bg-[#8B5CF6] py-2.5 text-xs font-semibold text-white hover:bg-[#7C3AED] transition-colors"
                  >
                    {language === 'fr' ? 'Ouvrir le dossier' : 'Investigate Case'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === 'investigate' && activeCase && (
          <form onSubmit={submitCase} className="space-y-6">
            <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6">
              <div className="text-xs text-[#A855F7] font-medium mb-1">
                {language === 'fr' ? activeCase.locationFr : activeCase.locationEn}
              </div>
              <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">
                {language === 'fr' ? activeCase.titleFr : activeCase.titleEn}
              </h2>
              <p className="mt-2 text-sm text-[#9CA3AF] leading-relaxed">
                {language === 'fr' ? activeCase.introFr : activeCase.introEn}
              </p>
            </div>

            {/* Clues */}
            <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold text-[#F8FAFC] flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-[#A855F7]" />
                <span>{language === 'fr' ? 'Indices & Preuves' : 'Evidence & Clues'}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeCase.clues.map((clue) => {
                  const unlocked = clueDetails[clue.id];
                  return (
                    <div
                      key={clue.id}
                      className="rounded-lg border border-[#8B5CF6]/15 bg-[#10101C] p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-[#F8FAFC] mb-2">
                          {language === 'fr' ? clue.labelFr : clue.labelEn}
                        </div>
                        {unlocked ? (
                          <p className="text-xs text-[#9CA3AF] leading-relaxed">
                            {language === 'fr' ? unlocked.detailFr : unlocked.detailEn}
                          </p>
                        ) : (
                          <p className="text-xs text-[#6B7280] flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              {language === 'fr' ? 'Preuve non examinée' : 'Evidence unexamined'}
                            </span>
                          </p>
                        )}
                      </div>
                      {!unlocked && (
                        <button
                          type="button"
                          onClick={() => inspectClue(clue.id)}
                          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-md border border-[#8B5CF6]/30 py-1.5 text-xs font-medium text-[#A855F7] hover:bg-[#151522]"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>{language === 'fr' ? 'Analyser' : 'Inspect clue'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Suspects */}
            <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold text-[#F8FAFC] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#A855F7]" />
                <span>{language === 'fr' ? 'Suspects & Alibis' : 'Suspects & Alibis'}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeCase.suspects.map((s) => {
                  const selected = accusedSuspectId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setAccusedSuspectId(s.id)}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        selected
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/15'
                          : 'border-[#8B5CF6]/15 bg-[#10101C] hover:border-[#8B5CF6]/50'
                      }`}
                    >
                      <div className="font-semibold text-sm text-[#F8FAFC]">{s.name}</div>
                      <div className="text-xs text-[#A855F7] mb-2">
                        {language === 'fr' ? s.roleFr : s.roleEn}
                      </div>
                      <p className="text-xs text-[#9CA3AF] leading-relaxed">
                        {language === 'fr' ? s.alibiFr : s.alibiEn}
                      </p>
                      <div className="mt-3 text-xs font-medium text-[#F8FAFC]">
                        {selected
                          ? language === 'fr'
                            ? 'Sélectionné comme coupable'
                            : 'Selected as culprit'
                          : language === 'fr'
                            ? 'Désigner ce suspect'
                            : 'Accuse suspect'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Deduction Questions */}
            <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-5">
              <h3 className="font-display text-lg font-semibold text-[#F8FAFC]">
                {language === 'fr' ? 'Déduction logique' : 'Logical Deduction'}
              </h3>
              {activeCase.questions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <div className="text-sm font-medium text-[#F8FAFC]">
                    {language === 'fr' ? q.promptFr : q.promptEn}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {(language === 'fr' ? q.optionsFr : q.optionsEn).map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => setQuestionAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                        className={`rounded-lg border px-4 py-2.5 text-left text-xs font-medium transition-colors ${
                          questionAnswers[q.id] === oIdx
                            ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#F8FAFC]'
                            : 'border-[#8B5CF6]/15 bg-[#10101C] text-[#9CA3AF] hover:text-[#F8FAFC]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button
                type="submit"
                className="w-full rounded-lg bg-[#8B5CF6] py-3 text-sm font-semibold text-white hover:bg-[#7C3AED]"
              >
                {language === 'fr' ? 'Soumettre la conclusion' : 'Submit Final Deduction'}
              </button>
            </div>
          </form>
        )}

        {phase === 'results' && result && activeCase && (
          <div className="rounded-xl border border-[#8B5CF6]/25 bg-[#151522] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <ShieldCheck
                className={`w-8 h-8 ${result.solvedCulprit ? 'text-emerald-400' : 'text-amber-400'}`}
              />
              <div>
                <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">
                  {result.solvedCulprit
                    ? language === 'fr'
                      ? 'Enquête résolue !'
                      : 'Case Solved!'
                    : language === 'fr'
                      ? 'Conclusion partielle'
                      : 'Case Closed'}
                </h2>
                <p className="text-xs text-[#9CA3AF]">
                  {result.correctDeductions} / {result.totalQuestions}{' '}
                  {language === 'fr' ? 'déductions exactes' : 'deductions correct'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[#8B5CF6]/15 bg-[#10101C] p-4 text-sm text-[#F8FAFC] leading-relaxed">
              {language === 'fr' ? result.resolutionFr : result.resolutionEn}
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <div className="rounded-lg border border-[#8B5CF6]/15 bg-[#10101C] p-4">
                <div className="text-xs text-[#9CA3AF]">{t.common.score}</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#F8FAFC]">
                  {result.score}
                </div>
              </div>
              <div className="rounded-lg border border-[#8B5CF6]/15 bg-[#10101C] p-4">
                <div className="text-xs text-[#9CA3AF]">{t.common.xp}</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#A855F7]">
                  +{result.outcome.xpEarned}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setPhase('select')}
                className="inline-flex items-center gap-2 rounded-lg bg-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7C3AED]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{language === 'fr' ? 'Autre dossier' : 'Choose Another Case'}</span>
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
