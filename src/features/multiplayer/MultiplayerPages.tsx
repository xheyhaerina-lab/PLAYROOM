import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Crown,
  DoorOpen,
  Play,
  Plus,
  RotateCcw,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { AppLayout } from '../../layouts/AppLayout.tsx';
import { ApiError, apiRequest } from '../../lib/api.ts';
import type {
  BrainPuzzlePublic,
  Difficulty,
  GameSlug,
  PublicProfile,
  QuizQuestionPublic,
  Room,
} from '../../types/playroom.ts';
import { playFeedbackTone } from '../../utils/sound.ts';

// 1. MULTIPLAYER LOBBY BROWSER
export const MultiplayerLobbyPage: React.FC = () => {
  const { language } = useLanguage();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRooms = () => {
    setLoading(true);
    apiRequest<{ rooms: Room[] }>('/rooms')
      .then((res) => setRooms(res.rooms))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRooms();
  }, []);

  return (
    <AppLayout title={language === 'fr' ? 'Salons Multijoueurs' : 'Multiplayer Lobby'}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">
              {language === 'fr' ? 'Salons publics actifs' : 'Public Active Rooms'}
            </h2>
            <p className="mt-1 text-sm text-[#9CA3AF]">
              {language === 'fr'
                ? 'Rejoignez un salon ouvert ou créez le vôtre pour inviter vos amis.'
                : 'Join an open lobby or create a private room with a shareable code.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/multiplayer/join"
              className="inline-flex items-center gap-2 rounded-lg border border-[#8B5CF6]/30 px-4 py-2 text-xs font-medium text-[#F8FAFC] hover:border-[#8B5CF6]/60"
            >
              <DoorOpen className="w-4 h-4 text-[#A855F7]" />
              <span>{language === 'fr' ? 'Rejoindre par code' : 'Join by code'}</span>
            </Link>
            <Link
              to="/multiplayer/create"
              className="inline-flex items-center gap-2 rounded-lg bg-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7C3AED]"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'fr' ? 'Créer un salon' : 'Create room'}</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="h-40 rounded-xl bg-[#151522] animate-pulse" />
        ) : rooms.length === 0 ? (
          <div className="rounded-xl border border-[#8B5CF6]/15 bg-[#151522] p-8 text-center space-y-3">
            <UsersRound className="w-8 h-8 text-[#A855F7] mx-auto" />
            <div className="text-sm font-medium text-[#F8FAFC]">
              {language === 'fr'
                ? 'Aucun salon public ouvert pour le moment'
                : 'No public rooms open right now'}
            </div>
            <p className="text-xs text-[#9CA3AF]">
              {language === 'fr'
                ? 'Créez un salon et partagez le code avec vos amis.'
                : 'Create the first room and share the code with friends.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                    <span className="font-mono text-[#A855F7]">{r.code}</span>
                    <span className="capitalize">{r.difficulty}</span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold text-[#F8FAFC] capitalize">
                    {r.gameSlug.replace('-', ' ')}
                  </h3>
                  <div className="mt-1 text-xs text-[#9CA3AF] font-mono tabular-nums">
                    {r.players.length} / {r.maxPlayers}{' '}
                    {language === 'fr' ? 'joueurs' : 'players'}
                  </div>
                </div>
                <Link
                  to={`/multiplayer/room/${r.code}`}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#8B5CF6] py-2 text-xs font-semibold text-white hover:bg-[#7C3AED]"
                >
                  {language === 'fr' ? 'Rejoindre le salon' : 'Enter Lobby'}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

// 2. CREATE ROOM
export const CreateRoomPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [gameSlug, setGameSlug] = useState<GameSlug>('quiz-battle');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const res = await apiRequest<{ room: Room }>('/rooms', {
        method: 'POST',
        body: JSON.stringify({ gameSlug, difficulty, maxPlayers, isPrivate }),
      });
      navigate(`/multiplayer/room/${res.room.code}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Unable to create room';
      setError(
        msg === 'FREE_PRIVATE_ROOM_LIMIT'
          ? language === 'fr'
            ? 'Limite gratuite atteinte (2 salons privés/jour). Passez à PLAYROOM PLUS.'
            : 'Free tier limit reached (2 private rooms/day). Upgrade to PLAYROOM PLUS for unlimited rooms.'
          : msg === 'PLUS_REQUIRED_MAX_PLAYERS'
            ? language === 'fr'
              ? 'Les salons de plus de 4 joueurs nécessitent PLAYROOM PLUS.'
              : 'Rooms larger than 4 players require PLAYROOM PLUS.'
            : msg
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppLayout title={language === 'fr' ? 'Créer un salon' : 'Create Room'}>
      <div className="mx-auto max-w-xl rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 sm:p-8 space-y-6">
        <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">
          {language === 'fr' ? 'Configurer le salon multijoueur' : 'Configure Multiplayer Room'}
        </h2>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] mb-2">
              {language === 'fr' ? 'Jeu' : 'Game'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { slug: 'quiz-battle', label: 'Quiz Battle' },
                  { slug: 'word-challenge', label: 'Word Challenge' },
                  { slug: 'brain-test', label: 'Brain Test' },
                ] as const
              ).map((g) => (
                <button
                  key={g.slug}
                  type="button"
                  onClick={() => setGameSlug(g.slug)}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                    gameSlug === g.slug
                      ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#F8FAFC]'
                      : 'border-[#8B5CF6]/15 bg-[#10101C] text-[#9CA3AF]'
                  }`}
                >
                  {g.label}
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
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    difficulty === d
                      ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#F8FAFC]'
                      : 'border-[#8B5CF6]/15 bg-[#10101C] text-[#9CA3AF]'
                  }`}
                >
                  {t.common[d]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] mb-2">
              {language === 'fr' ? 'Nombre max de joueurs' : 'Max players'} (2–
              {user?.subscriptionStatus === 'plus' ? '12' : '4'})
            </label>
            <input
              type="number"
              min={2}
              max={user?.subscriptionStatus === 'plus' ? 12 : 4}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2.5 text-sm font-mono text-[#F8FAFC]"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-[#F8FAFC] cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            <span>
              {language === 'fr'
                ? 'Salon privé (accessible uniquement par code)'
                : 'Private room (join by code only)'}
            </span>
          </label>

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-lg bg-[#8B5CF6] py-3 text-sm font-semibold text-white hover:bg-[#7C3AED] disabled:opacity-60"
          >
            {creating ? t.common.loading : language === 'fr' ? 'Créer le salon' : 'Create Room'}
          </button>
        </form>
      </div>
    </AppLayout>
  );
};

// 3. JOIN ROOM BY CODE
export const JoinRoomPage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError(language === 'fr' ? 'Code de salon invalide.' : 'Enter a valid room code.');
      return;
    }
    setError('');
    setJoining(true);
    try {
      await apiRequest<{ room: Room }>(`/rooms/${encodeURIComponent(trimmed)}/join`, {
        method: 'POST',
      });
      navigate(`/multiplayer/room/${trimmed}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <AppLayout title={language === 'fr' ? 'Rejoindre un salon' : 'Join Room'}>
      <div className="mx-auto max-w-md rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 sm:p-8 space-y-5">
        <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">
          {language === 'fr' ? 'Entrer un code de salon' : 'Enter Room Code'}
        </h2>
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
            {error}
          </div>
        )}
        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="A1B2C3"
            className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-4 py-3 text-center font-mono text-lg tracking-widest text-[#F8FAFC]"
          />
          <button
            type="submit"
            disabled={joining}
            className="w-full rounded-lg bg-[#8B5CF6] py-3 text-sm font-semibold text-white hover:bg-[#7C3AED]"
          >
            {language === 'fr' ? 'Rejoindre' : 'Join Room'}
          </button>
        </form>
      </div>
    </AppLayout>
  );
};

// 4. LIVE MULTIPLAYER ROOM & SESSION
export const RoomSessionPage: React.FC = () => {
  const { code = '' } = useParams();
  const { user, token, refreshProfile } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [friends, setFriends] = useState<PublicProfile[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Active live game state
  const [roundState, setRoundState] = useState<{
    gameSlug: GameSlug;
    roundIndex: number;
    totalRounds: number;
    remainingMs: number;
    question?: QuizQuestionPublic;
    puzzle?: BrainPuzzlePublic;
    wordPuzzle?: {
      length: number;
      firstLetter: string;
      categoryEn: string;
      categoryFr: string;
      hintEn: string;
      hintFr: string;
    };
  } | null>(null);
  const [submittedRound, setSubmittedRound] = useState<number | null>(null);
  const [roundFeedback, setRoundFeedback] = useState<{
    isCorrect: boolean;
    correctOptionIndex: number;
    pointsAwarded: number;
  } | null>(null);
  const [wordGuess, setWordGuess] = useState('');
  const [wordGuesses, setWordGuesses] = useState<{ guess: string; feedback: string[] }[]>([]);
  const [finalResults, setFinalResults] = useState<{
    results: {
      userId: string;
      username: string;
      displayName: string;
      score: number;
      isWinner: boolean;
      xpEarned: number;
    }[];
    revealedWord?: string;
  } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    apiRequest<{ room: Room }>(`/rooms/${encodeURIComponent(code)}`)
      .then((res) => setRoom(res.room))
      .catch((err) => setError((err as Error).message));

    apiRequest<{ friends: PublicProfile[] }>('/friends')
      .then((res) => setFriends(res.friends))
      .catch(() => {});
  }, [code]);

  useEffect(() => {
    if (!token || !code) return;
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'room:subscribe', payload: { code } }));
    };

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data) as { type: string; payload: Record<string, unknown> };
      if (msg.type === 'room:state') {
        const nextRoom = msg.payload.room as Room;
        setRoom(nextRoom);
        if (nextRoom.status === 'lobby') {
          setRoundState(null);
          setFinalResults(null);
          setSubmittedRound(null);
          setRoundFeedback(null);
          setWordGuesses([]);
        }
      } else if (msg.type === 'game:round') {
        const p = msg.payload as NonNullable<typeof roundState>;
        setRoundState(p);
        setSecondsLeft(Math.ceil((p.remainingMs || 20000) / 1000));
        setSubmittedRound(null);
        setRoundFeedback(null);
        setFinalResults(null);
      } else if (msg.type === 'game:answer_result') {
        const fb = msg.payload as {
          roundIndex: number;
          isCorrect: boolean;
          correctOptionIndex: number;
          pointsAwarded: number;
        };
        setRoundFeedback(fb);
        playFeedbackTone(fb.isCorrect ? 'correct' : 'wrong');
      } else if (msg.type === 'game:word_feedback') {
        const wf = msg.payload as { guess: string; feedback: string[]; solved: boolean };
        setWordGuesses((prev) => [...prev, { guess: wf.guess, feedback: wf.feedback }]);
        setWordGuess('');
        playFeedbackTone(wf.solved ? 'victory' : 'click');
      } else if (msg.type === 'game:finished') {
        setFinalResults(
          msg.payload as {
            results: {
              userId: string;
              username: string;
              displayName: string;
              score: number;
              isWinner: boolean;
              xpEarned: number;
            }[];
            revealedWord?: string;
          }
        );
        playFeedbackTone('victory');
        void refreshProfile();
      } else if (msg.type === 'error') {
        setError(String(msg.payload.message || 'Room error'));
      }
    };

    return () => {
      ws.close();
    };
  }, [token, code, refreshProfile]);

  useEffect(() => {
    if (!roundState || room?.status !== 'in_progress') return;
    if (secondsLeft <= 0) return;
    const tmr = setTimeout(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(tmr);
  }, [roundState, room?.status, secondsLeft]);

  const sendWs = (type: string, payload: Record<string, unknown> = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const leaveRoom = async () => {
    await apiRequest(`/rooms/${encodeURIComponent(code)}/leave`, { method: 'POST' }).catch(() => {});
    navigate('/multiplayer');
  };

  const inviteFriend = async (friendId: string) => {
    await apiRequest(`/rooms/${encodeURIComponent(code)}/invite`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId: friendId }),
    });
  };

  const copyCode = () => {
    void navigator.clipboard.writeText(code.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const submitChoice = (idx: number) => {
    if (!roundState || submittedRound === roundState.roundIndex) return;
    setSubmittedRound(roundState.roundIndex);
    sendWs('room:submit_answer', { roundIndex: roundState.roundIndex, selectedIndex: idx });
  };

  const submitWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordGuess.trim()) return;
    sendWs('room:submit_answer', { guess: wordGuess.trim().toUpperCase() });
  };

  const isHost = room?.hostId === user?.id;
  const mePlayer = room?.players.find((p) => p.userId === user?.id);

  return (
    <AppLayout title={`${language === 'fr' ? 'Salon' : 'Room'} · ${code.toUpperCase()}`}>
      <div className="mx-auto max-w-4xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-200">
            {error}
          </div>
        )}

        {room && (
          <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold text-[#A855F7]">{room.code}</span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="inline-flex items-center gap-1 rounded-md border border-[#8B5CF6]/30 px-2.5 py-1 text-xs text-[#F8FAFC] hover:bg-[#10101C]"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? (language === 'fr' ? 'Copié' : 'Copied') : 'Copy'}</span>
                </button>
              </div>
              <div className="mt-1 text-xs text-[#9CA3AF] capitalize">
                {room.gameSlug.replace('-', ' ')} · {room.difficulty} · {room.players.length}/
                {room.maxPlayers} {language === 'fr' ? 'joueurs' : 'players'}
              </div>
            </div>

            <button
              type="button"
              onClick={leaveRoom}
              className="rounded-lg border border-red-500/30 px-3.5 py-2 text-xs font-medium text-red-300 hover:bg-red-500/10"
            >
              {language === 'fr' ? 'Quitter le salon' : 'Leave Room'}
            </button>
          </div>
        )}

        {/* LOBBY VIEW */}
        {room && room.status === 'lobby' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-4">
              <h3 className="font-display text-lg font-bold text-[#F8FAFC]">
                {language === 'fr' ? 'Joueurs connectés' : 'Connected Players'}
              </h3>
              <div className="divide-y divide-[#8B5CF6]/10">
                {room.players.map((p) => (
                  <div key={p.userId} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center font-mono text-xs font-bold text-[#F8FAFC]">
                        {p.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#F8FAFC] flex items-center gap-2">
                          <span>{p.displayName}</span>
                          {p.userId === room.hostId && (
                            <Crown className="w-3.5 h-3.5 text-[#A855F7]" aria-label="Host" />
                          )}
                        </div>
                        <div className="text-xs text-[#9CA3AF]">
                          @{p.username} · Lv.{p.level}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        p.isReady ? 'text-emerald-400' : 'text-[#9CA3AF]'
                      }`}
                    >
                      {p.isReady
                        ? language === 'fr'
                          ? 'Prêt'
                          : 'Ready'
                        : language === 'fr'
                          ? 'En attente'
                          : 'Waiting'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => sendWs('room:toggle_ready')}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#8B5CF6]/35 px-4 py-2.5 text-xs font-medium text-[#F8FAFC] hover:bg-[#10101C]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#A855F7]" />
                  <span>
                    {mePlayer?.isReady
                      ? language === 'fr'
                        ? 'Pas prêt'
                        : 'Unready'
                      : language === 'fr'
                        ? 'Je suis prêt'
                        : 'Mark Ready'}
                  </span>
                </button>

                {isHost && (
                  <button
                    type="button"
                    onClick={() => sendWs('room:start')}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#8B5CF6] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#7C3AED]"
                  >
                    <Play className="w-4 h-4" />
                    <span>{language === 'fr' ? 'Lancer la partie' : 'Start Match'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-3">
              <h3 className="font-display text-sm font-bold text-[#F8FAFC]">
                {language === 'fr' ? 'Inviter des amis' : 'Invite Friends'}
              </h3>
              {friends.length === 0 ? (
                <p className="text-xs text-[#9CA3AF]">
                  {language === 'fr'
                    ? 'Ajoutez des amis pour les inviter directement ici.'
                    : 'Add friends in the Friends tab to invite them with one click.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {friends.map((f) => (
                    <div key={f.id} className="flex items-center justify-between text-xs">
                      <span className="text-[#F8FAFC] truncate">{f.displayName}</span>
                      <button
                        type="button"
                        onClick={() => inviteFriend(f.id)}
                        className="rounded border border-[#8B5CF6]/30 px-2.5 py-1 text-[#A855F7] hover:bg-[#10101C]"
                      >
                        {language === 'fr' ? 'Inviter' : 'Invite'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* IN-PROGRESS GAME SESSION */}
        {room && room.status === 'in_progress' && roundState && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-5">
              <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                <span className="font-mono tabular-nums">
                  {language === 'fr' ? 'Manche' : 'Round'} {roundState.roundIndex + 1} /{' '}
                  {roundState.totalRounds}
                </span>
                <span className="font-mono tabular-nums text-[#F8FAFC]">{secondsLeft}s</span>
              </div>

              {roundState.question && (
                <>
                  <h2 className="font-display text-xl font-bold text-[#F8FAFC]">
                    {language === 'fr' ? roundState.question.promptFr : roundState.question.promptEn}
                  </h2>
                  <div className="grid grid-cols-1 gap-2.5">
                    {(language === 'fr'
                      ? roundState.question.optionsFr
                      : roundState.question.optionsEn
                    ).map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={submittedRound === roundState.roundIndex}
                        onClick={() => submitChoice(idx)}
                        className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                          roundFeedback?.correctOptionIndex === idx
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-100'
                            : 'border-[#8B5CF6]/20 bg-[#10101C] text-[#F8FAFC] hover:border-[#8B5CF6]/60'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {roundState.puzzle && (
                <>
                  <h2 className="font-display text-xl font-bold text-[#F8FAFC]">
                    {language === 'fr' ? roundState.puzzle.promptFr : roundState.puzzle.promptEn}
                  </h2>
                  {roundState.puzzle.visualData?.sequence && (
                    <div className="flex flex-wrap gap-2">
                      {roundState.puzzle.visualData.sequence.map((s, i) => (
                        <span
                          key={i}
                          className="rounded border border-[#8B5CF6]/20 bg-[#10101C] px-3 py-1.5 font-mono text-sm"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2.5">
                    {roundState.puzzle.options.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={submittedRound === roundState.roundIndex}
                        onClick={() => submitChoice(idx)}
                        className={`rounded-lg border px-4 py-3 text-left font-mono text-sm transition-colors ${
                          roundFeedback?.correctOptionIndex === idx
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-100'
                            : 'border-[#8B5CF6]/20 bg-[#10101C] text-[#F8FAFC] hover:border-[#8B5CF6]/60'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {roundState.wordPuzzle && (
                <div className="space-y-4">
                  <div className="text-xs text-[#9CA3AF]">
                    {language === 'fr'
                      ? roundState.wordPuzzle.categoryFr
                      : roundState.wordPuzzle.categoryEn}{' '}
                    · {roundState.wordPuzzle.length} letters · Starts with{' '}
                    <strong className="font-mono text-[#F8FAFC]">
                      {roundState.wordPuzzle.firstLetter}
                    </strong>
                  </div>
                  <p className="text-sm text-[#F8FAFC]">
                    {language === 'fr' ? roundState.wordPuzzle.hintFr : roundState.wordPuzzle.hintEn}
                  </p>
                  <form onSubmit={submitWord} className="flex gap-2">
                    <input
                      type="text"
                      maxLength={roundState.wordPuzzle.length}
                      value={wordGuess}
                      onChange={(e) => setWordGuess(e.target.value.toUpperCase())}
                      placeholder={`${roundState.wordPuzzle.length} letters`}
                      className="flex-1 rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2.5 font-mono text-sm uppercase text-[#F8FAFC]"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-[#8B5CF6] px-4 py-2.5 text-xs font-semibold text-white"
                    >
                      {t.common.submit}
                    </button>
                  </form>
                  <div className="space-y-1.5">
                    {wordGuesses.map((wg, i) => (
                      <div key={i} className="flex gap-1.5">
                        {wg.guess.split('').map((ch, ci) => (
                          <span
                            key={ci}
                            className={`w-9 h-9 flex items-center justify-center rounded border font-mono text-sm font-bold ${
                              wg.feedback[ci] === 'correct'
                                ? 'border-emerald-500 bg-emerald-500/20'
                                : wg.feedback[ci] === 'present'
                                  ? 'border-amber-500 bg-amber-500/20'
                                  : 'border-slate-700 bg-[#10101C]'
                            }`}
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {roundFeedback && (
                <div className="text-xs font-mono text-[#A855F7]">
                  {roundFeedback.isCorrect ? '+' : ''}
                  {roundFeedback.pointsAwarded} pts
                </div>
              )}
            </div>

            <div className="lg:col-span-4 rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-5 space-y-3">
              <h3 className="font-display text-sm font-bold text-[#F8FAFC]">
                {language === 'fr' ? 'Scores en direct' : 'Live Scoreboard'}
              </h3>
              <div className="space-y-2">
                {[...room.players]
                  .sort((a, b) => b.score - a.score)
                  .map((p) => (
                    <div key={p.userId} className="flex items-center justify-between text-xs">
                      <span className="text-[#F8FAFC] truncate">{p.displayName}</span>
                      <span className="font-mono tabular-nums text-[#A855F7]">{p.score} pts</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS VIEW */}
        {room && room.status === 'completed' && finalResults && (
          <div className="rounded-xl border border-[#8B5CF6]/25 bg-[#151522] p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">
                {language === 'fr' ? 'Classement final' : 'Final Match Rankings'}
              </h2>
              {finalResults.revealedWord && (
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {language === 'fr' ? 'Mot : ' : 'Word: '}
                  <strong className="font-mono text-[#F8FAFC]">{finalResults.revealedWord}</strong>
                </p>
              )}
            </div>

            <div className="divide-y divide-[#8B5CF6]/10">
              {finalResults.results.map((r, i) => (
                <div key={r.userId} className="flex items-center justify-between py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#9CA3AF]">#{i + 1}</span>
                    <span className="font-medium text-[#F8FAFC]">{r.displayName}</span>
                    {r.isWinner && (
                      <span className="text-xs font-semibold text-emerald-400">
                        {language === 'fr' ? 'Vainqueur' : 'Winner'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 font-mono tabular-nums text-xs">
                    <span className="text-[#F8FAFC]">{r.score} pts</span>
                    <span className="text-[#A855F7]">+{r.xpEarned} XP</span>
                  </div>
                </div>
              ))}
            </div>

            {isHost && (
              <button
                type="button"
                onClick={() => sendWs('room:rematch')}
                className="inline-flex items-center gap-2 rounded-lg bg-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7C3AED]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{language === 'fr' ? 'Revanche' : 'Rematch in Lobby'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
