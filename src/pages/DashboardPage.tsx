import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Crown, Gamepad2, Plus, Trophy, UsersRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { AppLayout } from '../layouts/AppLayout.tsx';
import { apiRequest } from '../lib/api.ts';
import type { DailyChallengeItem, GameCatalogItem, GameHistoryRecord } from '../types/playroom.ts';
import { getLevelProgress } from '../utils/progression.ts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [games, setGames] = useState<GameCatalogItem[]>([]);
  const [daily, setDaily] = useState<DailyChallengeItem | null>(null);
  const [history, setHistory] = useState<GameHistoryRecord[]>([]);

  useEffect(() => {
    apiRequest<{ games: GameCatalogItem[] }>('/games')
      .then((res) => setGames(res.games))
      .catch(() => {});
    apiRequest<{ challenge: DailyChallengeItem }>('/challenges/daily')
      .then((res) => setDaily(res.challenge))
      .catch(() => {});
    apiRequest<{ history: GameHistoryRecord[] }>('/history')
      .then((res) => setHistory(res.history.slice(0, 6)))
      .catch(() => {});
  }, []);

  const prog = getLevelProgress(user?.xp ?? 0);

  return (
    <AppLayout title={t.nav.dashboard}>
      <div className="space-y-8">
        {/* Welcome & Progression Banner */}
        <section className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="text-xs text-[#9CA3AF]">
                {language === 'fr' ? 'Bon retour,' : 'Welcome back,'} @{user?.username}
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold text-[#F8FAFC]">
                {user?.displayName}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#9CA3AF]">
                <span>
                  {t.common.level}{' '}
                  <strong className="font-mono tabular-nums text-[#F8FAFC]">{prog.level}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="font-mono tabular-nums text-[#A855F7]">{user?.xp ?? 0}</strong> XP
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="font-mono tabular-nums text-[#F8FAFC]">
                    {user?.totalGamesPlayed ?? 0}
                  </strong>{' '}
                  {t.common.gamesPlayed}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="font-mono tabular-nums text-[#F8FAFC]">{user?.wins ?? 0}</strong>{' '}
                  {t.common.wins}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                to="/multiplayer/create"
                className="inline-flex items-center gap-2 rounded-lg bg-[#8B5CF6] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#7C3AED] transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>{t.landing.createRoom}</span>
              </Link>
              <Link
                to="/multiplayer/join"
                className="inline-flex items-center gap-2 rounded-lg border border-[#8B5CF6]/30 px-4 py-2.5 text-xs font-medium text-[#F8FAFC] hover:border-[#8B5CF6]/60 transition-colors whitespace-nowrap"
              >
                <UsersRound className="w-4 h-4 text-[#A855F7]" />
                <span>{language === 'fr' ? 'Rejoindre un salon' : 'Join room'}</span>
              </Link>
            </div>
          </div>

          {/* Level XP Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1.5">
              <span>
                {language === 'fr' ? 'Progression du niveau' : 'Level Progress'} ({prog.percent}%)
              </span>
              <span className="font-mono tabular-nums">
                {prog.xpIntoLevel} / {prog.xpNeededForNext} XP
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#10101C]">
              <div
                className="h-full rounded-full bg-[#8B5CF6] transition-all duration-300"
                style={{ width: `${prog.percent}%` }}
              />
            </div>
          </div>
        </section>

        {/* Daily Challenge & Membership Status */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#A855F7] mb-2">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CalendarCheck className="w-4 h-4" />
                  <span>{t.nav.challenges}</span>
                </span>
                {daily && <span className="font-mono tabular-nums">UTC {daily.challengeDate}</span>}
              </div>
              <h3 className="font-display text-lg font-bold text-[#F8FAFC]">
                {daily ? (language === 'fr' ? daily.titleFr : daily.titleEn) : t.common.loading}
              </h3>
              <p className="mt-1.5 text-sm text-[#9CA3AF]">
                {daily ? (language === 'fr' ? daily.descriptionFr : daily.descriptionEn) : ''}
              </p>
            </div>
            {daily && (
              <div className="mt-5 pt-4 border-t border-[#8B5CF6]/10 flex items-center justify-between">
                <span className="text-xs font-mono tabular-nums text-[#9CA3AF]">
                  {daily.completedAt
                    ? language === 'fr'
                      ? 'Défi terminé'
                      : 'Completed'
                    : `${language === 'fr' ? 'Objectif' : 'Target'}: ${daily.targetScore} pts · +${daily.xpReward} XP`}
                </span>
                <Link
                  to={`/games/${daily.gameSlug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#A855F7] hover:text-white"
                >
                  <span>{t.landing.playSolo}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A855F7] mb-2">
                <Crown className="w-4 h-4" />
                <span>{language === 'fr' ? 'Abonnement' : 'Membership'}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-[#F8FAFC]">
                {user?.subscriptionStatus === 'plus' ? 'PLAYROOM PLUS' : 'FREE'}
              </h3>
              <p className="mt-1.5 text-sm text-[#9CA3AF]">
                {user?.subscriptionStatus === 'plus'
                  ? language === 'fr'
                    ? 'Tous les avantages PLUS sont actifs sur votre compte.'
                    : 'All PLUS room capacities and exclusive modes are unlocked.'
                  : language === 'fr'
                    ? 'Passez à PLAYROOM PLUS pour les salons illimités et statistiques avancées.'
                    : 'Upgrade to PLAYROOM PLUS for unlimited private rooms and exclusive challenges.'}
              </p>
            </div>
            <div className="mt-5">
              <Link
                to="/subscription"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F8FAFC] hover:text-[#A855F7]"
              >
                <span>
                  {language === 'fr' ? 'Gérer mon abonnement' : 'Manage subscription'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Play Games */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-[#A855F7]" />
              <span>{t.nav.games}</span>
            </h2>
            <Link to="/games" className="text-xs font-medium text-[#A855F7] hover:text-white">
              {language === 'fr' ? 'Bibliothèque complète' : 'Full library'}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {games.map((g) => (
              <Link
                key={g.slug}
                to={`/games/${g.slug}`}
                className="group rounded-xl border border-[#8B5CF6]/15 bg-[#151522] overflow-hidden hover:border-[#8B5CF6]/50 transition-colors"
              >
                <div className="aspect-[4/3] bg-[#10101C] overflow-hidden">
                  <img
                    src={g.imageUrl}
                    alt={language === 'fr' ? g.titleFr : g.titleEn}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <div className="font-display text-sm font-bold text-[#F8FAFC]">
                    {language === 'fr' ? g.titleFr : g.titleEn}
                  </div>
                  <div className="mt-1 text-xs text-[#9CA3AF]">
                    +{g.baseXp} Base XP · {g.supportsMultiplayer ? 'Solo & Multi' : 'Solo'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Matches */}
        <section className="rounded-xl border border-[#8B5CF6]/15 bg-[#151522] p-6">
          <h2 className="font-display text-base font-bold text-[#F8FAFC] flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-[#A855F7]" />
            <span>{language === 'fr' ? 'Parties récentes' : 'Recent Match History'}</span>
          </h2>
          {history.length === 0 ? (
            <div className="text-sm text-[#9CA3AF]">
              {language === 'fr'
                ? 'Aucune partie enregistrée pour l’instant. Lancez votre premier jeu ci-dessus.'
                : 'No completed matches yet. Start your first game above to record scores and XP.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#8B5CF6]/15 text-[#9CA3AF]">
                  <tr>
                    <th className="py-2 pr-4 font-medium">{language === 'fr' ? 'Jeu' : 'Game'}</th>
                    <th className="py-2 pr-4 font-medium">Mode</th>
                    <th className="py-2 pr-4 font-medium">{language === 'fr' ? 'Difficulté' : 'Difficulty'}</th>
                    <th className="py-2 pr-4 font-medium text-right">{t.common.score}</th>
                    <th className="py-2 font-medium text-right">{t.common.xp}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8B5CF6]/10">
                  {history.map((h) => (
                    <tr key={h.sessionId}>
                      <td className="py-2.5 pr-4 font-medium text-[#F8FAFC] capitalize">
                        {h.gameSlug.replace('-', ' ')}
                      </td>
                      <td className="py-2.5 pr-4 text-[#9CA3AF] capitalize">{h.mode}</td>
                      <td className="py-2.5 pr-4 text-[#9CA3AF] capitalize">{h.difficulty}</td>
                      <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-[#F8FAFC]">
                        {h.score}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-[#A855F7]">
                        +{h.xpEarned}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};
