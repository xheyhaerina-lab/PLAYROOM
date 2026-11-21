import crypto from 'crypto';
import type { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { store } from './store.ts';
import type { BrainPuzzlePublic, QuizQuestionPublic, Room } from '../src/types/playroom.ts';
import { calculateQuizRoundPoints, difficultyMultiplier } from '../src/utils/progression.ts';

interface ClientMeta {
  ws: WebSocket;
  userId: string;
  roomCode: string | null;
}

interface ActiveMultiplayerSession {
  sessionId: string;
  roomCode: string;
  gameSlug: Room['gameSlug'];
  roundIndex: number;
  totalRounds: number;
  roundStartedAt: number;
  roundDurationMs: number;
  // Server-only truth
  quizQuestions?: {
    id: string;
    correctOptionIndex: number;
    explanationEn: string;
    explanationFr: string;
    publicData: QuizQuestionPublic;
  }[];
  brainPuzzles?: {
    id: string;
    correctIndex: number;
    publicData: BrainPuzzlePublic;
  }[];
  wordTarget?: string;
  wordHintEn?: string;
  wordHintFr?: string;
  wordCategoryEn?: string;
  wordCategoryFr?: string;
  submittedRounds: Map<string, Set<number>>; // userId -> Set<roundIndex>
  wordSolvedBy: Set<string>;
  roundTimer?: ReturnType<typeof setTimeout>;
}

class MultiplayerHub {
  private wss: WebSocketServer | null = null;
  private clients = new Set<ClientMeta>();
  private sessions = new Map<string, ActiveMultiplayerSession>(); // roomCode -> session

  attach(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url || '/ws', 'http://localhost');
      const token = url.searchParams.get('token') || '';
      const userId = store.verifyToken(token);
      if (!userId) {
        ws.close(4001, 'Unauthorized');
        return;
      }

      const meta: ClientMeta = { ws, userId, roomCode: null };
      this.clients.add(meta);

      const user = store.users.get(userId);
      if (user) user.lastActiveAt = new Date().toISOString();

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString()) as { type: string; payload?: Record<string, unknown> };
          this.handleMessage(meta, msg);
        } catch {
          this.send(ws, { type: 'error', payload: { message: 'Invalid message format' } });
        }
      });

      ws.on('close', () => {
        this.clients.delete(meta);
        if (meta.roomCode) {
          const room = store.getRoomByCode(meta.roomCode);
          if (room) {
            const p = room.players.find((pl) => pl.userId === meta.userId);
            if (p) {
              p.isConnected = false;
              this.broadcastRoomState(room.code);
            }
          }
        }
      });
    });
  }

  private send(ws: WebSocket, event: { type: string; payload: unknown }): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  broadcastToRoom(roomCode: string, event: { type: string; payload: unknown }): void {
    const normalized = roomCode.toUpperCase();
    for (const c of this.clients) {
      if (c.roomCode === normalized) {
        this.send(c.ws, event);
      }
    }
  }

  broadcastRoomState(roomCode: string): void {
    const room = store.getRoomByCode(roomCode);
    if (!room) return;
    this.broadcastToRoom(room.code, {
      type: 'room:state',
      payload: { room },
    });
  }

  private handleMessage(meta: ClientMeta, msg: { type: string; payload?: Record<string, unknown> }): void {
    const payload = msg.payload || {};

    switch (msg.type) {
      case 'room:subscribe': {
        const code = String(payload.code || '').trim().toUpperCase();
        const room = store.getRoomByCode(code);
        if (!room) {
          this.send(meta.ws, { type: 'error', payload: { message: 'Room not found' } });
          return;
        }
        const isMember = room.players.some((p) => p.userId === meta.userId);
        if (!isMember) {
          try {
            store.joinRoomByCode(code, meta.userId);
          } catch (err) {
            this.send(meta.ws, { type: 'error', payload: { message: (err as Error).message } });
            return;
          }
        } else {
          const p = room.players.find((pl) => pl.userId === meta.userId);
          if (p) p.isConnected = true;
        }
        meta.roomCode = code;
        this.broadcastRoomState(code);

        // If game already in progress, sync current round state to reconnecting client
        const active = this.sessions.get(code);
        if (active && room.status === 'in_progress') {
          this.sendCurrentRoundToClient(meta.ws, active);
        }
        break;
      }

      case 'room:toggle_ready': {
        if (!meta.roomCode) return;
        const room = store.getRoomByCode(meta.roomCode);
        if (!room || room.status !== 'lobby') return;
        const p = room.players.find((pl) => pl.userId === meta.userId);
        if (p) {
          p.isReady = !p.isReady;
          this.broadcastRoomState(room.code);
        }
        break;
      }

      case 'room:start': {
        if (!meta.roomCode) return;
        const room = store.getRoomByCode(meta.roomCode);
        if (!room || room.hostId !== meta.userId || room.status !== 'lobby') return;
        this.startRoomSession(room);
        break;
      }

      case 'room:submit_answer': {
        if (!meta.roomCode) return;
        const active = this.sessions.get(meta.roomCode);
        if (!active) return;
        this.handleRoundSubmission(meta, active, payload);
        break;
      }

      case 'room:rematch': {
        if (!meta.roomCode) return;
        const room = store.getRoomByCode(meta.roomCode);
        if (!room || room.hostId !== meta.userId) return;
        const old = this.sessions.get(room.code);
        if (old?.roundTimer) clearTimeout(old.roundTimer);
        this.sessions.delete(room.code);
        room.status = 'lobby';
        room.currentSessionId = null;
        room.players.forEach((p) => {
          p.score = 0;
          p.isReady = p.userId === room.hostId;
        });
        this.broadcastRoomState(room.code);
        break;
      }
    }
  }

  private startRoomSession(room: Room): void {
    const sessionId = crypto.randomUUID();
    room.status = 'in_progress';
    room.currentSessionId = sessionId;
    room.players.forEach((p) => {
      p.score = 0;
    });

    const active: ActiveMultiplayerSession = {
      sessionId,
      roomCode: room.code,
      gameSlug: room.gameSlug === 'mystery-room' ? 'quiz-battle' : room.gameSlug,
      roundIndex: 0,
      totalRounds: 5,
      roundStartedAt: Date.now(),
      roundDurationMs: room.difficulty === 'hard' ? 15000 : 20000,
      submittedRounds: new Map(),
      wordSolvedBy: new Set(),
    };

    if (active.gameSlug === 'quiz-battle') {
      const pool = store.quizQuestions.filter((q) => q.isActive && q.difficulty === room.difficulty);
      const chosen = [...(pool.length >= 5 ? pool : store.quizQuestions.filter((q) => q.isActive))]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);
      active.quizQuestions = chosen.map((q) => ({
        id: q.id,
        correctOptionIndex: q.correctOptionIndex,
        explanationEn: q.explanationEn,
        explanationFr: q.explanationFr,
        publicData: {
          id: q.id,
          category: q.category,
          difficulty: q.difficulty,
          promptEn: q.promptEn,
          promptFr: q.promptFr,
          optionsEn: q.optionsEn,
          optionsFr: q.optionsFr,
        },
      }));
    } else if (active.gameSlug === 'brain-test') {
      const pool = store.brainPuzzles.filter((p) => p.difficulty === room.difficulty);
      const chosen = [...(pool.length >= 5 ? pool : store.brainPuzzles)]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);
      active.brainPuzzles = chosen.map((p) => ({
        id: p.id,
        correctIndex: p.correctIndex,
        publicData: {
          id: p.id,
          type: p.type,
          difficulty: p.difficulty,
          promptEn: p.promptEn,
          promptFr: p.promptFr,
          visualData: p.visualData,
          options: p.options,
          hintEn: p.hintEn,
          hintFr: p.hintFr,
        },
      }));
    } else if (active.gameSlug === 'word-challenge') {
      const pool = store.wordBank.filter((w) => w.difficulty === room.difficulty);
      const chosen = pool[Math.floor(Math.random() * pool.length)] || store.wordBank[0];
      active.totalRounds = 1;
      active.roundDurationMs = 90000;
      active.wordTarget = chosen.wordEn.toUpperCase();
      active.wordHintEn = chosen.hintEn;
      active.wordHintFr = chosen.hintFr;
      active.wordCategoryEn = chosen.categoryEn;
      active.wordCategoryFr = chosen.categoryFr;
    }

    this.sessions.set(room.code, active);
    this.broadcastRoomState(room.code);
    this.dispatchRound(room, active);
  }

  private dispatchRound(room: Room, active: ActiveMultiplayerSession): void {
    active.roundStartedAt = Date.now();
    if (active.roundTimer) clearTimeout(active.roundTimer);

    for (const c of this.clients) {
      if (c.roomCode === room.code) {
        this.sendCurrentRoundToClient(c.ws, active);
      }
    }

    active.roundTimer = setTimeout(() => {
      this.advanceOrFinishRound(room.code);
    }, active.roundDurationMs + 1000);
  }

  private sendCurrentRoundToClient(ws: WebSocket, active: ActiveMultiplayerSession): void {
    if (active.gameSlug === 'quiz-battle' && active.quizQuestions) {
      const q = active.quizQuestions[active.roundIndex];
      this.send(ws, {
        type: 'game:round',
        payload: {
          sessionId: active.sessionId,
          gameSlug: active.gameSlug,
          roundIndex: active.roundIndex,
          totalRounds: active.totalRounds,
          durationMs: active.roundDurationMs,
          remainingMs: Math.max(0, active.roundDurationMs - (Date.now() - active.roundStartedAt)),
          question: q.publicData,
        },
      });
    } else if (active.gameSlug === 'brain-test' && active.brainPuzzles) {
      const p = active.brainPuzzles[active.roundIndex];
      this.send(ws, {
        type: 'game:round',
        payload: {
          sessionId: active.sessionId,
          gameSlug: active.gameSlug,
          roundIndex: active.roundIndex,
          totalRounds: active.totalRounds,
          durationMs: active.roundDurationMs,
          remainingMs: Math.max(0, active.roundDurationMs - (Date.now() - active.roundStartedAt)),
          puzzle: p.publicData,
        },
      });
    } else if (active.gameSlug === 'word-challenge' && active.wordTarget) {
      this.send(ws, {
        type: 'game:round',
        payload: {
          sessionId: active.sessionId,
          gameSlug: active.gameSlug,
          roundIndex: 0,
          totalRounds: 1,
          durationMs: active.roundDurationMs,
          remainingMs: Math.max(0, active.roundDurationMs - (Date.now() - active.roundStartedAt)),
          wordPuzzle: {
            length: active.wordTarget.length,
            firstLetter: active.wordTarget[0],
            categoryEn: active.wordCategoryEn,
            categoryFr: active.wordCategoryFr,
            hintEn: active.wordHintEn,
            hintFr: active.wordHintFr,
          },
        },
      });
    }
  }

  private handleRoundSubmission(
    meta: ClientMeta,
    active: ActiveMultiplayerSession,
    payload: Record<string, unknown>
  ): void {
    const room = store.getRoomByCode(active.roomCode);
    if (!room || room.status !== 'in_progress') return;
    const player = room.players.find((p) => p.userId === meta.userId);
    if (!player) return;

    if (active.gameSlug === 'word-challenge' && active.wordTarget) {
      if (active.wordSolvedBy.has(meta.userId)) return;
      const guess = String(payload.guess || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
      const target = active.wordTarget;
      if (guess.length !== target.length) return;

      const feedback: ('correct' | 'present' | 'absent')[] = new Array(target.length).fill('absent');
      const counts: Record<string, number> = {};
      for (let i = 0; i < target.length; i++) {
        if (guess[i] === target[i]) feedback[i] = 'correct';
        else counts[target[i]] = (counts[target[i]] || 0) + 1;
      }
      for (let i = 0; i < target.length; i++) {
        if (feedback[i] !== 'correct' && (counts[guess[i]] || 0) > 0) {
          feedback[i] = 'present';
          counts[guess[i]] -= 1;
        }
      }

      const solved = guess === target;
      if (solved) {
        active.wordSolvedBy.add(meta.userId);
        const elapsed = Date.now() - active.roundStartedAt;
        const speedBonus = Math.max(0, Math.round((1 - elapsed / active.roundDurationMs) * 120));
        const pts = Math.round((200 + speedBonus) * difficultyMultiplier(room.difficulty));
        player.score += pts;
        this.broadcastRoomState(room.code);
      }

      this.send(meta.ws, {
        type: 'game:word_feedback',
        payload: { guess, feedback, solved, score: player.score },
      });

      if (active.wordSolvedBy.size >= room.players.filter((p) => p.isConnected).length) {
        this.advanceOrFinishRound(room.code);
      }
      return;
    }

    // Quiz Battle & Brain Test round submission
    const roundIdx = Number(payload.roundIndex);
    if (roundIdx !== active.roundIndex) return;

    let userRounds = active.submittedRounds.get(meta.userId);
    if (!userRounds) {
      userRounds = new Set();
      active.submittedRounds.set(meta.userId, userRounds);
    }
    if (userRounds.has(roundIdx)) return; // Prevent duplicate submission
    userRounds.add(roundIdx);

    const selectedIndex = Number(payload.selectedIndex);
    const responseMs = Math.max(0, Date.now() - active.roundStartedAt);
    let isCorrect = false;
    let correctOptionIndex = 0;

    if (active.gameSlug === 'quiz-battle' && active.quizQuestions) {
      const q = active.quizQuestions[roundIdx];
      correctOptionIndex = q.correctOptionIndex;
      isCorrect = selectedIndex === q.correctOptionIndex;
    } else if (active.gameSlug === 'brain-test' && active.brainPuzzles) {
      const p = active.brainPuzzles[roundIdx];
      correctOptionIndex = p.correctIndex;
      isCorrect = selectedIndex === p.correctIndex;
    }

    const pointsAwarded = calculateQuizRoundPoints({
      isCorrect,
      difficulty: room.difficulty,
      responseMs,
      maxTimeMs: active.roundDurationMs,
    });
    player.score += pointsAwarded;

    this.send(meta.ws, {
      type: 'game:answer_result',
      payload: {
        roundIndex: roundIdx,
        isCorrect,
        correctOptionIndex,
        pointsAwarded,
        totalScore: player.score,
      },
    });
    this.broadcastRoomState(room.code);

    // If all connected players have answered this round, advance smoothly after a brief reveal beat
    const connectedCount = Math.max(1, room.players.filter((p) => p.isConnected).length);
    let answeredCount = 0;
    for (const p of room.players) {
      if (p.isConnected && active.submittedRounds.get(p.userId)?.has(roundIdx)) {
        answeredCount += 1;
      }
    }
    if (answeredCount >= connectedCount) {
      if (active.roundTimer) clearTimeout(active.roundTimer);
      active.roundTimer = setTimeout(() => {
        this.advanceOrFinishRound(room.code);
      }, 1200);
    }
  }

  private advanceOrFinishRound(roomCode: string): void {
    const room = store.getRoomByCode(roomCode);
    const active = this.sessions.get(roomCode);
    if (!room || !active) return;

    if (active.roundTimer) clearTimeout(active.roundTimer);

    if (active.roundIndex + 1 < active.totalRounds) {
      active.roundIndex += 1;
      this.dispatchRound(room, active);
      return;
    }

    // Complete match & award server-verified XP
    room.status = 'completed';
    const sorted = [...room.players].sort((a, b) => b.score - a.score);
    const topScore = sorted[0]?.score ?? 0;

    const results = sorted.map((p, index) => {
      const isWinner = p.score === topScore && topScore > 0 && index === 0;
      const outcome = store.awardMatchOutcome({
        userId: p.userId,
        gameSlug: active.gameSlug,
        mode: 'multiplayer',
        difficulty: room.difficulty,
        sessionId: active.sessionId,
        score: p.score,
        isWinner,
      });
      return {
        userId: p.userId,
        username: p.username,
        displayName: p.displayName,
        score: p.score,
        isWinner,
        xpEarned: outcome.xpEarned,
        newLevel: outcome.newLevel,
      };
    });

    this.broadcastRoomState(room.code);
    this.broadcastToRoom(room.code, {
      type: 'game:finished',
      payload: {
        sessionId: active.sessionId,
        results,
        revealedWord: active.wordTarget,
      },
    });
    this.sessions.delete(room.code);
  }
}

export const multiplayerHub = new MultiplayerHub();
