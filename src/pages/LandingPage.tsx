import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  Crown,
  Gamepad2,
  Trophy,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { PublicLayout } from '../layouts/PublicLayout.tsx';
import { apiRequest } from '../lib/api.ts';
import { formatMoneyCents } from '../utils/currency.ts';
import type {
  DailyChallengeItem,
  GameCatalogItem,
  LeaderboardEntry,
  SubscriptionPlan,
} from '../types/playroom.ts';

export const LandingPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [games, setGames] = useState<GameCatalogItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallengeItem | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    apiRequest<{ games: GameCatalogItem[] }>('/games')
      .then((res) => setGames(res.games))
      .catch(() => {});
    apiRequest<{ entries: LeaderboardEntry[] }>('/leaderboards?period=all_time')
      .then((res) => setLeaderboard(res.entries.slice(0, 5)))
      .catch(() => {});
    apiRequest<{ challenge: DailyChallengeItem }>('/challenges/daily')
      .then((res) => setDailyChallenge(res.challenge))
      .catch(() => {});
    apiRequest<{ plans: SubscriptionPlan[] }>('/plans')
      .then((res) => setPlans(res.plans))
      .catch(() => {});
  }, []);

  const plusMonthly = plans.find((p) => p.code === 'plus_monthly');
  const plusAnnual = plans.find((p) => p.code === 'plus_annual');

  const faqs =
    language === 'fr'
      ? [
          {
            q: 'Puis-je jouer gratuitement sur PLAYROOM ?',
            a: 'Oui. Les quatre jeux principaux, le mode solo, les défis quotidiens et jusqu’à deux salons privés par jour sont inclus gratuitement.',
          },
          {
            q: 'Comment fonctionne le multijoueur en temps réel ?',
            a: 'Créez un salon, partagez le code unique avec vos amis et lancez la partie dès que chacun est prêt. Les scores et chronomètres sont synchronisés par le serveur.',
          },
          {
            q: 'Qu’apporte PLAYROOM PLUS ?',
            a: 'PLAYROOM PLUS débloque les salons privés illimités jusqu’à 12 joueurs, les dossiers Chambre Mystère avancés, les statistiques détaillées et des succès exclusifs.',
          },
          {
            q: 'Comment les paiements internationaux en USD sont-ils sécurisés ?',
            a: 'Les paiements sont facturés en USD via notre architecture Merchant of Record vérifiée côté serveur. Aucun abonnement n’est activé sans confirmation cryptographique par webhook.',
          },
        ]
      : [
          {
            q: 'Can I play on PLAYROOM for free?',
            a: 'Yes. All four core games, solo progression, UTC daily challenges, and up to two private multiplayer rooms per day are included in the Free tier.',
          },
          {
            q: 'How does real-time multiplayer work?',
            a: 'Create a room, share the generated code with friends, confirm ready status in the lobby, and play with server-synchronized timers and anti-cheat score calculation.',
          },
          {
            q: 'What does PLAYROOM PLUS include?',
            a: 'PLAYROOM PLUS unlocks unlimited private rooms for up to 12 players, exclusive Mystery Room case files, advanced category statistics, and PLUS-only achievements.',
          },
          {
            q: 'How are international USD payments verified?',
            a: 'Payments are processed in USD through a server-verified Merchant of Record billing flow. Subscriptions activate only after cryptographic webhook and amount verification.',
          },
        ];

  return (
    <PublicLayout>
      {/* HERO SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-medium tracking-wide text-[#A855F7] mb-4">
              {language === 'fr'
                ? 'Plateforme de jeux sociaux & défis cognitifs'
                : 'Social Gaming · Competitive Brain Games'}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] text-[#F8FAFC] text-balance">
              {t.hero.headline}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#9CA3AF] leading-relaxed max-w-xl">
              {t.hero.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="inline-flex items-center gap-2 rounded-lg bg-[#8B5CF6] px-6 py-3 text-sm font-semibold text-white hover:bg-[#7C3AED] transition-colors whitespace-nowrap"
              >
                <span>{t.hero.primaryCta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#games"
                className="inline-flex items-center gap-2 rounded-lg border border-[#8B5CF6]/30 bg-[#10101C] px-6 py-3 text-sm font-medium text-[#F8FAFC] hover:border-[#8B5CF6]/60 transition-colors whitespace-nowrap"
              >
                <Gamepad2 className="w-4 h-4 text-[#A855F7]" />
                <span>{t.hero.secondaryCta}</span>
              </a>
            </div>

            <div className="mt-10 pt-6 border-t border-[#8B5CF6]/15 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#9CA3AF]">
              <span>4 {language === 'fr' ? 'jeux originaux' : 'original games'}</span>
              <span aria-hidden="true">·</span>
              <span>{language === 'fr' ? 'Salons WebSocket en temps réel' : 'Real-time WebSocket rooms'}</span>
              <span aria-hidden="true">·</span>
              <span>{language === 'fr' ? 'Français & English' : 'English & Français'}</span>
            </div>
          </div>

          <div className="lg:col-span-6 flex">
            <div className="relative w-full overflow-hidden rounded-2xl border border-[#8B5CF6]/20 bg-[#10101C] min-h-[280px] lg:min-h-[420px]">
              <img
                src="/src/assets/images/hero_playroom_arena_1795256666136.jpg"
                alt="PLAYROOM competitive gaming studio"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-[#080810]/30 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs text-[#A855F7] font-medium">
                    {language === 'fr' ? 'Modes Solo & Salon Privé' : 'Solo & Private Lobby Modes'}
                  </div>
                  <div className="mt-1 font-display text-lg font-semibold text-[#F8FAFC]">
                    Quiz Battle · Word Challenge · Brain Test · Mystery Room
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED GAMES */}
      <section id="games" className="border-t border-[#8B5CF6]/15 bg-[#10101C]/50 py-16 lg:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
              {t.landing.featuredTitle}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#9CA3AF]">{t.landing.featuredSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game) => (
              <article
                key={game.slug}
                className="group flex flex-col overflow-hidden rounded-xl border border-[#8B5CF6]/15 bg-[#151522] hover:border-[#8B5CF6]/45 transition-colors"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#10101C]">
                  <img
                    src={game.imageUrl}
                    alt={language === 'fr' ? game.titleFr : game.titleEn}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="text-xs text-[#9CA3AF] mb-1.5">{game.category}</div>
                    <h3 className="font-display text-lg font-semibold text-[#F8FAFC]">
                      {language === 'fr' ? game.titleFr : game.titleEn}
                    </h3>
                    <p className="mt-2 text-sm text-[#9CA3AF] leading-relaxed">
                      {language === 'fr' ? game.descriptionFr : game.descriptionEn}
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-[#8B5CF6]/10 flex items-center justify-between text-xs">
                    <span className="font-mono tabular-nums text-[#A855F7]">+{game.baseXp} Base XP</span>
                    <Link
                      to={isAuthenticated ? `/games/${game.slug}` : '/register'}
                      className="font-medium text-[#F8FAFC] hover:text-[#A855F7] transition-colors inline-flex items-center gap-1"
                    >
                      <span>{t.landing.playSolo}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-16 lg:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC] mb-10">
            {t.landing.howTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-[#8B5CF6]/15 bg-[#151522] p-6">
              <h3 className="font-display text-lg font-semibold text-[#F8FAFC]">
                {t.landing.howStep1Title}
              </h3>
              <p className="mt-2.5 text-sm text-[#9CA3AF] leading-relaxed">{t.landing.howStep1Desc}</p>
            </div>
            <div className="rounded-xl border border-[#8B5CF6]/15 bg-[#151522] p-6">
              <h3 className="font-display text-lg font-semibold text-[#F8FAFC]">
                {t.landing.howStep2Title}
              </h3>
              <p className="mt-2.5 text-sm text-[#9CA3AF] leading-relaxed">{t.landing.howStep2Desc}</p>
            </div>
            <div className="rounded-xl border border-[#8B5CF6]/15 bg-[#151522] p-6">
              <h3 className="font-display text-lg font-semibold text-[#F8FAFC]">
                {t.landing.howStep3Title}
              </h3>
              <p className="mt-2.5 text-sm text-[#9CA3AF] leading-relaxed">{t.landing.howStep3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* MULTIPLAYER & DAILY CHALLENGE SPLIT */}
      <section className="border-t border-[#8B5CF6]/15 bg-[#10101C]/50 py-16 lg:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-xl border border-[#8B5CF6]/15 bg-[#151522] p-7 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#A855F7] mb-3">
                <UsersRound className="w-4 h-4" />
                <span>{language === 'fr' ? 'Expérience Multijoueur' : 'Multiplayer Experience'}</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#F8FAFC]">
                {t.landing.multiplayerTitle}
              </h3>
              <p className="mt-3 text-sm text-[#9CA3AF] leading-relaxed">
                {t.landing.multiplayerDesc}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={isAuthenticated ? '/multiplayer/create' : '/register'}
                className="inline-flex items-center gap-2 rounded-lg bg-[#8B5CF6] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#7C3AED] transition-colors"
              >
                {t.landing.createRoom}
              </Link>
              <Link
                to={isAuthenticated ? '/multiplayer/join' : '/login'}
                className="inline-flex items-center gap-2 rounded-lg border border-[#8B5CF6]/30 px-4 py-2.5 text-xs font-medium text-[#F8FAFC] hover:border-[#8B5CF6]/60 transition-colors"
              >
                {language === 'fr' ? 'Rejoindre un salon' : 'Join by code'}
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-[#8B5CF6]/15 bg-[#151522] p-7 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#6366F1] mb-3">
                <CalendarCheck className="w-4 h-4" />
                <span>{t.landing.dailyTitle}</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#F8FAFC]">
                {dailyChallenge
                  ? language === 'fr'
                    ? dailyChallenge.titleFr
                    : dailyChallenge.titleEn
                  : t.landing.dailyTitle}
              </h3>
              <p className="mt-3 text-sm text-[#9CA3AF] leading-relaxed">
                {dailyChallenge
                  ? language === 'fr'
                    ? dailyChallenge.descriptionFr
                    : dailyChallenge.descriptionEn
                  : t.landing.dailyDesc}
              </p>
            </div>
            {dailyChallenge && (
              <div className="mt-6 pt-4 border-t border-[#8B5CF6]/10 flex items-center justify-between text-xs">
                <span className="font-mono tabular-nums text-[#9CA3AF]">
                  UTC {dailyChallenge.challengeDate} · +{dailyChallenge.xpReward} XP
                </span>
                <Link
                  to={isAuthenticated ? '/challenges' : '/register'}
                  className="font-semibold text-[#A855F7] hover:text-white transition-colors"
                >
                  {t.landing.playSolo}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LEADERBOARD PREVIEW & PLAYROOM PLUS */}
      <section className="py-16 lg:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 rounded-xl border border-[#8B5CF6]/15 bg-[#151522] p-6 sm:p-7">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-xl font-bold text-[#F8FAFC] flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#A855F7]" />
                  <span>{t.landing.leaderboardTitle}</span>
                </h2>
                <p className="mt-1 text-xs text-[#9CA3AF]">{t.landing.leaderboardDesc}</p>
              </div>
              <Link
                to={isAuthenticated ? '/leaderboards' : '/register'}
                className="text-xs font-medium text-[#A855F7] hover:text-white transition-colors whitespace-nowrap"
              >
                {language === 'fr' ? 'Voir tout' : 'View all'}
              </Link>
            </div>

            {leaderboard.length === 0 ? (
              <div className="rounded-lg border border-[#8B5CF6]/10 bg-[#10101C] p-6 text-center text-sm text-[#9CA3AF]">
                {language === 'fr'
                  ? 'Le classement global est prêt. Terminez une première partie pour inscrire votre score.'
                  : 'Global standings are live. Complete your first match to claim the top rank.'}
              </div>
            ) : (
              <div className="divide-y divide-[#8B5CF6]/10">
                {leaderboard.map((row) => (
                  <div key={row.userId} className="flex items-center justify-between py-3 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono tabular-nums w-6 text-xs text-[#9CA3AF]">
                        #{row.rank}
                      </span>
                      <span className="font-medium text-[#F8FAFC] truncate">{row.displayName}</span>
                      <span className="text-xs text-[#9CA3AF]">@{row.username}</span>
                    </div>
                    <div className="font-mono tabular-nums text-xs text-[#A855F7] shrink-0">
                      {row.score.toLocaleString()} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 rounded-xl border border-[#8B5CF6]/35 bg-[#151522] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#A855F7] mb-3">
                <Crown className="w-4 h-4" />
                <span>{t.landing.plusTitle}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold tabular-nums text-[#F8FAFC]">
                  {plusMonthly
                    ? formatMoneyCents(plusMonthly.priceCents, plusMonthly.currency, { locale: language })
                    : '$4.99'}
                </span>
                <span className="text-xs text-[#9CA3AF]">
                  / {language === 'fr' ? 'mois' : 'month'}
                </span>
              </div>
              <p className="mt-1 text-xs font-mono text-[#A855F7]">
                {plusAnnual
                  ? `${language === 'fr' ? 'Ou' : 'Or'} ${formatMoneyCents(
                      plusAnnual.priceCents,
                      plusAnnual.currency,
                      { locale: language }
                    )} / ${language === 'fr' ? 'an' : 'year'}`
                  : language === 'fr'
                    ? 'Ou $39.99 / an'
                    : 'Or $39.99 / year'}
              </p>
              <p className="mt-3 text-sm text-[#9CA3AF] leading-relaxed">{t.landing.plusDesc}</p>
              <ul className="mt-5 space-y-2 text-xs text-[#F8FAFC]">
                {(plusMonthly
                  ? language === 'fr'
                    ? plusMonthly.featuresFr
                    : plusMonthly.featuresEn
                  : []
                ).map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <span className="text-[#8B5CF6]">·</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7">
              <Link
                to="/pricing"
                className="inline-flex w-full items-center justify-center rounded-lg bg-[#8B5CF6] py-3 text-sm font-semibold text-white hover:bg-[#7C3AED] transition-colors"
              >
                {t.landing.upgradePlus}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[#8B5CF6]/15 bg-[#10101C]/40 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F8FAFC] mb-8 text-center">
            {t.landing.faqTitle}
          </h2>
          <div className="space-y-3">
            {faqs.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={item.q}
                  className="rounded-xl border border-[#8B5CF6]/15 bg-[#151522] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-[#F8FAFC] hover:bg-[#1A1A2B] transition-colors"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#9CA3AF] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-sm text-[#9CA3AF] leading-relaxed">{item.a}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
