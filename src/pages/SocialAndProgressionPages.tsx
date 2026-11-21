import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Bell,
  CalendarCheck,
  Check,
  Flag,
  Search,
  Trophy,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { AppLayout } from '../layouts/AppLayout.tsx';
import { apiRequest } from '../lib/api.ts';
import type {
  AchievementItem,
  AppNotification,
  DailyChallengeItem,
  FriendRequestItem,
  LeaderboardEntry,
  PublicProfile,
} from '../types/playroom.ts';

// 1. LEADERBOARDS
export const LeaderboardsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('all_time');
  const [gameSlug, setGameSlug] = useState('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ entries: LeaderboardEntry[] }>(
      `/leaderboards?period=${period}&game=${encodeURIComponent(gameSlug)}`
    )
      .then((res) => setEntries(res.entries))
      .finally(() => setLoading(false));
  }, [period, gameSlug]);

  return (
    <AppLayout title={t.nav.leaderboards}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="inline-flex items-center gap-1 rounded-lg border border-[#8B5CF6]/20 bg-[#10101C] p-1 self-start">
            {(
              [
                { id: 'daily', en: 'Daily', fr: 'Jour' },
                { id: 'weekly', en: 'Weekly', fr: 'Semaine' },
                { id: 'monthly', en: 'Monthly', fr: 'Mois' },
                { id: 'all_time', en: 'All-time', fr: 'Global' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  period === p.id ? 'bg-[#8B5CF6] text-white' : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {language === 'fr' ? p.fr : p.en}
              </button>
            ))}
          </div>

          <select
            value={gameSlug}
            onChange={(e) => setGameSlug(e.target.value)}
            aria-label="Filter by game"
            className="rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3 py-2 text-xs text-[#F8FAFC]"
          >
            <option value="all">{language === 'fr' ? 'Tous les jeux' : 'All games'}</option>
            <option value="quiz-battle">Quiz Battle</option>
            <option value="word-challenge">Word Challenge</option>
            <option value="brain-test">Brain Test</option>
            <option value="mystery-room">Mystery Room</option>
          </select>
        </div>

        <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#9CA3AF]">{t.common.loading}</div>
          ) : entries.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Trophy className="w-8 h-8 text-[#A855F7] mx-auto" />
              <div className="text-sm font-medium text-[#F8FAFC]">
                {language === 'fr'
                  ? 'Aucun score enregistré sur cette période'
                  : 'No scores recorded for this period yet'}
              </div>
              <p className="text-xs text-[#9CA3AF]">
                {language === 'fr'
                  ? 'Complétez une partie pour apparaître au classement.'
                  : 'Complete a match to claim your spot on the leaderboard.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#8B5CF6]/15 bg-[#10101C] text-[#9CA3AF]">
                <tr>
                  <th className="py-3 px-4 font-medium">#</th>
                  <th className="py-3 px-4 font-medium">{language === 'fr' ? 'Joueur' : 'Player'}</th>
                  <th className="py-3 px-4 font-medium text-right">{t.common.level}</th>
                  <th className="py-3 px-4 font-medium text-right">{t.common.wins}</th>
                  <th className="py-3 px-4 font-medium text-right">{t.common.score}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8B5CF6]/10">
                {entries.map((row) => (
                  <tr key={row.userId} className="hover:bg-[#1A1A2B]/60">
                    <td className="py-3 px-4 font-mono tabular-nums text-[#9CA3AF]">{row.rank}</td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/profile/${row.username}`}
                        className="font-medium text-[#F8FAFC] hover:text-[#A855F7]"
                      >
                        {row.displayName}
                      </Link>{' '}
                      <span className="text-[#9CA3AF]">@{row.username}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#9CA3AF]">
                      Lv.{row.level}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#9CA3AF]">
                      {row.wins}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#A855F7]">
                      {row.score.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

// 2. ACHIEVEMENTS
export const AchievementsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [items, setItems] = useState<AchievementItem[]>([]);

  useEffect(() => {
    apiRequest<{ achievements: AchievementItem[] }>('/achievements')
      .then((res) => setItems(res.achievements))
      .catch(() => {});
  }, []);

  return (
    <AppLayout title={t.nav.achievements}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((a) => {
          const unlocked = Boolean(a.unlockedAt);
          return (
            <div
              key={a.id}
              className={`rounded-xl border p-5 flex flex-col justify-between ${
                unlocked
                  ? 'border-[#8B5CF6]/45 bg-[#151522]'
                  : 'border-[#8B5CF6]/15 bg-[#10101C]/80 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={unlocked ? 'text-emerald-400 font-medium' : 'text-[#9CA3AF]'}>
                    {unlocked
                      ? language === 'fr'
                        ? 'Débloqué'
                        : 'Unlocked'
                      : language === 'fr'
                        ? 'Verrouillé'
                        : 'Locked'}
                  </span>
                  <span className="font-mono tabular-nums text-[#A855F7]">+{a.xpReward} XP</span>
                </div>
                <h3 className="font-display text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#A855F7] shrink-0" />
                  <span>{language === 'fr' ? a.titleFr : a.titleEn}</span>
                </h3>
                <p className="mt-2 text-xs text-[#9CA3AF] leading-relaxed">
                  {language === 'fr' ? a.descriptionFr : a.descriptionEn}
                </p>
              </div>
              {a.isPlusExclusive && (
                <div className="mt-4 pt-3 border-t border-[#8B5CF6]/10 text-xs text-[#A855F7]">
                  PLAYROOM PLUS
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

// 3. DAILY CHALLENGES
export const DailyChallengesPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [challenge, setChallenge] = useState<DailyChallengeItem | null>(null);
  const [utcCountdown, setUtcCountdown] = useState('');

  useEffect(() => {
    apiRequest<{ challenge: DailyChallengeItem }>('/challenges/daily')
      .then((res) => setChallenge(res.challenge))
      .catch(() => {});

    const updateCountdown = () => {
      const now = new Date();
      const nextUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0);
      const diff = Math.max(0, Math.floor((nextUtc - now.getTime()) / 1000));
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setUtcCountdown(`${h}:${m}:${s}`);
    };
    updateCountdown();
    const id = setInterval(updateCountdown, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <AppLayout title={t.nav.challenges}>
      <div className="mx-auto max-w-2xl">
        {challenge ? (
          <div className="rounded-xl border border-[#8B5CF6]/25 bg-[#151522] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
              <span className="inline-flex items-center gap-1.5 text-[#A855F7] font-medium">
                <CalendarCheck className="w-4 h-4" />
                <span>UTC {challenge.challengeDate}</span>
              </span>
              <span className="font-mono tabular-nums">
                {language === 'fr' ? 'Réinitialisation dans' : 'Resets in'} {utcCountdown}
              </span>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">
                {language === 'fr' ? challenge.titleFr : challenge.titleEn}
              </h2>
              <p className="mt-2 text-sm text-[#9CA3AF]">
                {language === 'fr' ? challenge.descriptionFr : challenge.descriptionEn}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-[#8B5CF6]/15 bg-[#10101C] p-4">
                <div className="text-xs text-[#9CA3AF]">{language === 'fr' ? 'Objectif' : 'Target'}</div>
                <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#F8FAFC]">
                  {challenge.targetScore} pts
                </div>
              </div>
              <div className="rounded-lg border border-[#8B5CF6]/15 bg-[#10101C] p-4">
                <div className="text-xs text-[#9CA3AF]">{language === 'fr' ? 'Votre meilleur' : 'Your best'}</div>
                <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#F8FAFC]">
                  {challenge.bestScore} pts
                </div>
              </div>
              <div className="rounded-lg border border-[#8B5CF6]/15 bg-[#10101C] p-4">
                <div className="text-xs text-[#9CA3AF]">{language === 'fr' ? 'Récompense' : 'Reward'}</div>
                <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#A855F7]">
                  +{challenge.xpReward} XP
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-medium text-emerald-400">
                {challenge.completedAt
                  ? language === 'fr'
                    ? 'Défi quotidien validé !'
                    : 'Daily challenge completed!'
                  : ''}
              </span>
              <Link
                to={`/games/${challenge.gameSlug}`}
                className="rounded-lg bg-[#8B5CF6] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#7C3AED]"
              >
                {t.landing.playSolo}
              </Link>
            </div>
          </div>
        ) : (
          <div className="h-48 rounded-xl bg-[#151522] animate-pulse" />
        )}
      </div>
    </AppLayout>
  );
};

// 4. FRIENDS & PLAYER SEARCH
export const FriendsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [friends, setFriends] = useState<PublicProfile[]>([]);
  const [incoming, setIncoming] = useState<FriendRequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequestItem[]>([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [feedback, setFeedback] = useState('');
  const [reportTarget, setReportTarget] = useState<PublicProfile | null>(null);
  const [reportReason, setReportReason] = useState('');

  const loadFriends = () => {
    apiRequest<{
      friends: PublicProfile[];
      incoming: FriendRequestItem[];
      outgoing: FriendRequestItem[];
    }>('/friends')
      .then((res) => {
        setFriends(res.friends);
        setIncoming(res.incoming);
        setOutgoing(res.outgoing);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadFriends();
  }, []);

  const searchPlayers = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest<{ players: PublicProfile[] }>(
      `/players/search?q=${encodeURIComponent(query)}`
    );
    setSearchResults(res.players);
  };

  const sendRequest = async (targetUserId: string) => {
    setFeedback('');
    try {
      await apiRequest('/friends/request', {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      });
      setFeedback(language === 'fr' ? 'Demande envoyée.' : 'Friend request sent.');
      loadFriends();
    } catch (err) {
      setFeedback((err as Error).message);
    }
  };

  const respondRequest = async (id: string, action: 'accept' | 'reject') => {
    await apiRequest(`/friends/requests/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    loadFriends();
  };

  const removeFriend = async (friendId: string) => {
    await apiRequest(`/friends/${friendId}`, { method: 'DELETE' });
    loadFriends();
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget || reportReason.trim().length < 3) return;
    await apiRequest('/reports', {
      method: 'POST',
      body: JSON.stringify({ reportedUserId: reportTarget.id, reason: reportReason }),
    });
    setReportTarget(null);
    setReportReason('');
    setFeedback(language === 'fr' ? 'Signalement transmis à la modération.' : 'Report submitted.');
  };

  return (
    <AppLayout title={t.nav.friends}>
      <div className="space-y-8">
        {feedback && (
          <div className="rounded-lg border border-[#8B5CF6]/30 bg-[#151522] px-4 py-2.5 text-xs text-[#F8FAFC]">
            {feedback}
          </div>
        )}

        {/* Search Players */}
        <section className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
            {language === 'fr' ? 'Rechercher des joueurs' : 'Find Players'}
          </h2>
          <form onSubmit={searchPlayers} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={language === 'fr' ? 'Nom ou pseudo...' : 'Search by username or name...'}
              className="flex-1 rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2 text-sm text-[#F8FAFC]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7C3AED]"
            >
              <Search className="w-4 h-4" />
              <span>{t.common.search}</span>
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="divide-y divide-[#8B5CF6]/10 pt-2">
              {searchResults.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <Link to={`/profile/${p.username}`} className="font-medium text-[#F8FAFC] hover:text-[#A855F7]">
                      {p.displayName}
                    </Link>{' '}
                    <span className="text-xs text-[#9CA3AF]">
                      @{p.username} · Lv.{p.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sendRequest(p.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#8B5CF6]/30 px-2.5 py-1 text-xs text-[#A855F7] hover:bg-[#10101C]"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{language === 'fr' ? 'Ajouter' : 'Add'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportTarget(p)}
                      aria-label={`Report ${p.username}`}
                      className="rounded-md p-1.5 text-[#9CA3AF] hover:text-red-400"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pending Requests */}
        {(incoming.length > 0 || outgoing.length > 0) && (
          <section className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
              {language === 'fr' ? 'Demandes en attente' : 'Pending Requests'}
            </h2>
            <div className="space-y-2">
              {incoming.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-lg bg-[#10101C] px-4 py-3 text-xs">
                  <span>
                    <strong className="text-[#F8FAFC]">{req.peer.displayName}</strong>{' '}
                    <span className="text-[#9CA3AF]">@{req.peer.username}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => respondRequest(req.id, 'accept')}
                      className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-white"
                    >
                      <Check className="w-3 h-3" />
                      <span>{language === 'fr' ? 'Accepter' : 'Accept'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => respondRequest(req.id, 'reject')}
                      className="inline-flex items-center gap-1 rounded border border-[#8B5CF6]/20 px-2.5 py-1 text-[#9CA3AF]"
                    >
                      <X className="w-3 h-3" />
                      <span>{language === 'fr' ? 'Refuser' : 'Decline'}</span>
                    </button>
                  </div>
                </div>
              ))}
              {outgoing.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-lg bg-[#10101C] px-4 py-3 text-xs text-[#9CA3AF]">
                  <span>
                    {language === 'fr' ? 'Envoyée à' : 'Sent to'} @{req.peer.username}
                  </span>
                  <span>{language === 'fr' ? 'En attente' : 'Pending'}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Friends List */}
        <section className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
            {language === 'fr' ? 'Liste d’amis' : 'Your Friends'} ({friends.length})
          </h2>
          {friends.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">
              {language === 'fr'
                ? 'Vous n’avez pas encore d’amis connectés. Recherchez un pseudo ci-dessus.'
                : 'No friends added yet. Use player search above to connect.'}
            </p>
          ) : (
            <div className="divide-y divide-[#8B5CF6]/10">
              {friends.map((f) => (
                <div key={f.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <Link to={`/profile/${f.username}`} className="font-medium text-[#F8FAFC] hover:text-[#A855F7]">
                      {f.displayName}
                    </Link>
                    <div className="text-xs text-[#9CA3AF]">
                      @{f.username} · Lv.{f.level} ·{' '}
                      {f.isOnline ? (language === 'fr' ? 'En ligne' : 'Online') : language === 'fr' ? 'Hors ligne' : 'Offline'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFriend(f.id)}
                    aria-label="Remove friend"
                    className="rounded-lg border border-red-500/25 p-2 text-red-300 hover:bg-red-500/10"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {reportTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
            <form
              onSubmit={submitReport}
              className="w-full max-w-md rounded-xl border border-[#8B5CF6]/25 bg-[#151522] p-6 space-y-4"
            >
              <h3 className="font-display text-lg font-bold text-[#F8FAFC]">
                {language === 'fr' ? 'Signaler' : 'Report'} @{reportTarget.username}
              </h3>
              <input
                type="text"
                required
                minLength={3}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder={language === 'fr' ? 'Motif du signalement...' : 'Reason for report...'}
                className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2 text-sm text-[#F8FAFC]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportTarget(null)}
                  className="rounded-lg border border-[#8B5CF6]/25 px-4 py-2 text-xs text-[#9CA3AF]"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  {t.common.submit}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

// 5. NOTIFICATIONS
export const NotificationsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [items, setItems] = useState<AppNotification[]>([]);

  const load = () => {
    apiRequest<{ notifications: AppNotification[] }>('/notifications')
      .then((res) => setItems(res.notifications))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const markAllRead = async () => {
    await apiRequest('/notifications/read-all', { method: 'POST' });
    load();
  };

  return (
    <AppLayout title={t.nav.notifications}>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[#F8FAFC] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#A855F7]" />
            <span>{t.nav.notifications}</span>
          </h2>
          {items.length > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-medium text-[#A855F7] hover:text-white"
            >
              {language === 'fr' ? 'Tout marquer comme lu' : 'Mark all read'}
            </button>
          )}
        </div>

        <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] divide-y divide-[#8B5CF6]/10">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#9CA3AF]">
              {language === 'fr' ? 'Aucune notification.' : 'You are all caught up.'}
            </div>
          ) : (
            items.map((n) => (
              <div key={n.id} className={`p-4 ${n.isRead ? 'opacity-70' : 'bg-[#8B5CF6]/5'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold text-[#F8FAFC]">
                    {language === 'fr' ? n.titleFr : n.titleEn}
                  </div>
                  <span className="font-mono text-xs text-[#9CA3AF]">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {language === 'fr' ? n.bodyFr : n.bodyEn}
                </p>
                {n.actionUrl && (
                  <Link
                    to={n.actionUrl}
                    className="mt-2 inline-block text-xs font-medium text-[#A855F7] hover:text-white"
                  >
                    {language === 'fr' ? 'Ouvrir' : 'Open'}
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};
