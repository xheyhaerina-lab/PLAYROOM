import crypto from 'crypto';
import express, { Router, type Request, type Response } from 'express';
import { envConfig } from '../config.ts';
import { GAME_CATALOG } from '../gameData.ts';
import {
  createRateLimiter,
  optionalAuth,
  requireAdmin,
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware.ts';
import { paymentProvider } from '../payments/index.ts';
import { store } from '../store.ts';
import { multiplayerHub } from '../wsHub.ts';
import type { Difficulty, GameSlug, PaymentRecord, QuizCategory } from '../../src/types/playroom.ts';

export const apiRouter = Router();

const authLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });
const paymentLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

// ============================================================================
// HEALTH & PUBLIC CONFIG
// ============================================================================
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    paymentProvider: paymentProvider.providerId,
    paymentConfigured: paymentProvider.isConfigured(),
    defaultCurrency: envConfig.defaultBillingCurrency,
  });
});

// ============================================================================
// AUTHENTICATION & PROFILE
// ============================================================================
apiRouter.post('/auth/register', authLimiter, (req: Request, res: Response) => {
  try {
    const { username, displayName, email, password, preferredLanguage } = req.body || {};
    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Missing required registration fields' });
      return;
    }
    const result = store.registerUser({
      username,
      displayName: typeof displayName === 'string' && displayName.trim() ? displayName : username,
      email,
      password,
      preferredLanguage: preferredLanguage === 'fr' ? 'fr' : 'en',
    });
    res.status(201).json({
      user: result.user,
      token: result.token,
      emailVerificationRequired: true,
    });
  } catch (err) {
    const code = (err as Error).message;
    const status = code === 'EMAIL_EXISTS' || code === 'USERNAME_EXISTS' ? 409 : 400;
    res.status(status).json({ error: code });
  }
});

apiRouter.post('/auth/login', authLimiter, (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const result = store.loginUser(email, password);
    res.json(result);
  } catch (err) {
    const code = (err as Error).message;
    const status = code === 'ACCOUNT_SUSPENDED' ? 403 : 401;
    res.status(status).json({ error: code });
  }
});

apiRouter.post('/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.authToken) {
    store.revokedTokens.add(req.authToken);
  }
  res.json({ ok: true });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = store.users.get(req.userId!);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: store.sanitizeOwnUser(user) });
});

apiRouter.post('/auth/forgot-password', authLimiter, (req: Request, res: Response) => {
  const { email } = req.body || {};
  if (typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'Valid email is required' });
    return;
  }
  const { resetToken } = store.requestPasswordReset(email);
  // In production email delivery sends resetToken via SMTP/Supabase Auth.
  // Never expose resetToken in production responses.
  res.json({
    ok: true,
    message: 'If an account matches that email, password reset instructions have been issued.',
    ...(envConfig.appEnv !== 'production' && resetToken ? { previewResetToken: resetToken } : {}),
  });
});

apiRouter.post('/auth/reset-password', authLimiter, (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body || {};
    if (typeof token !== 'string' || typeof newPassword !== 'string') {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }
    const ok = store.resetPassword(token, newPassword);
    if (!ok) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

apiRouter.patch('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = store.users.get(req.userId!);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { displayName, preferredLanguage, isPublicProfile, avatarUrl } = req.body || {};
  if (typeof displayName === 'string' && displayName.trim().length >= 1) {
    user.displayName = displayName.trim().slice(0, 48);
  }
  if (preferredLanguage === 'en' || preferredLanguage === 'fr') {
    user.preferredLanguage = preferredLanguage;
  }
  if (typeof isPublicProfile === 'boolean') {
    user.isPublicProfile = isPublicProfile;
  }
  if (typeof avatarUrl === 'string' && (avatarUrl === '' || /^https?:\/\//.test(avatarUrl))) {
    user.avatarUrl = avatarUrl || null;
  }
  res.json({ user: store.sanitizeOwnUser(user) });
});

// ============================================================================
// GAMES CATALOG, LEADERBOARDS, CHALLENGES & ACHIEVEMENTS
// ============================================================================
apiRouter.get('/games', (_req: Request, res: Response) => {
  res.json({ games: GAME_CATALOG });
});

apiRouter.get('/leaderboards', (req: Request, res: Response) => {
  const period = String(req.query.period || 'all_time');
  const gameSlug = String(req.query.game || 'all');
  const validPeriods = ['daily', 'weekly', 'monthly', 'all_time'] as const;
  const periodType = validPeriods.includes(period as (typeof validPeriods)[number])
    ? (period as (typeof validPeriods)[number])
    : 'all_time';
  const entries = store.getLeaderboard(periodType, gameSlug);
  res.json({ period: periodType, gameSlug, entries });
});

apiRouter.get('/challenges/daily', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.userId) {
    res.json({ challenge: store.getDailyChallengeForUser(req.userId) });
    return;
  }
  const c = store.ensureTodayChallenge();
  res.json({ challenge: { ...c, bestScore: 0, completedAt: null } });
});

apiRouter.get('/achievements', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ achievements: store.getUserAchievements(req.userId!) });
});

apiRouter.get('/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const items = store.gameHistory.filter((h) => h.userId === req.userId).slice(0, 30);
  res.json({ history: items });
});

// ============================================================================
// GAME 1: QUIZ BATTLE
// ============================================================================
apiRouter.post('/games/quiz/start', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { category, difficulty, mode } = req.body || {};
  const validDiff: Difficulty = difficulty === 'easy' || difficulty === 'hard' ? difficulty : 'medium';
  const data = store.startQuizSession({
    userId: req.userId!,
    category: (category || 'mixed') as QuizCategory | 'mixed',
    difficulty: validDiff,
    mode: mode === 'daily' ? 'daily' : 'solo',
  });
  res.json(data);
});

apiRouter.post('/games/quiz/answer', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, roundIndex, selectedIndex, responseMs } = req.body || {};
    const result = store.submitQuizAnswer({
      sessionId: String(sessionId),
      userId: req.userId!,
      roundIndex: Number(roundIndex),
      selectedIndex: Number(selectedIndex),
      responseMs: Number(responseMs || 10000),
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// ============================================================================
// GAME 2: WORD CHALLENGE
// ============================================================================
apiRouter.post('/games/word/start', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { difficulty, language, isDaily } = req.body || {};
  const validDiff: Difficulty = difficulty === 'easy' || difficulty === 'hard' ? difficulty : 'medium';
  const data = store.startWordSession({
    userId: req.userId!,
    difficulty: validDiff,
    language: language === 'fr' ? 'fr' : 'en',
    isDaily: Boolean(isDaily),
  });
  res.json(data);
});

apiRouter.post('/games/word/guess', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, guess, hintsUsed } = req.body || {};
    const result = store.submitWordGuess({
      sessionId: String(sessionId),
      userId: req.userId!,
      guess: String(guess || ''),
      hintsUsed: Number(hintsUsed || 0),
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// ============================================================================
// GAME 3: BRAIN TEST
// ============================================================================
apiRouter.post('/games/brain/start', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { difficulty } = req.body || {};
  const validDiff: Difficulty = difficulty === 'easy' || difficulty === 'hard' ? difficulty : 'medium';
  const data = store.startBrainSession({
    userId: req.userId!,
    difficulty: validDiff,
  });
  res.json(data);
});

apiRouter.post('/games/brain/answer', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, puzzleIndex, selectedIndex, usedHint } = req.body || {};
    const result = store.submitBrainAnswer({
      sessionId: String(sessionId),
      userId: req.userId!,
      puzzleIndex: Number(puzzleIndex),
      selectedIndex: Number(selectedIndex),
      usedHint: Boolean(usedHint),
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// ============================================================================
// GAME 4: MYSTERY ROOM
// ============================================================================
apiRouter.get('/games/mystery/scenarios', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ scenarios: store.listMysteryScenarios() });
});

apiRouter.post('/games/mystery/start', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { scenarioId } = req.body || {};
    const data = store.startMysterySession({
      userId: req.userId!,
      scenarioId: String(scenarioId),
    });
    res.json(data);
  } catch (err) {
    const code = (err as Error).message;
    res.status(code === 'PLUS_REQUIRED' ? 403 : 400).json({ error: code });
  }
});

apiRouter.post('/games/mystery/clue', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, clueId } = req.body || {};
    const result = store.inspectMysteryClue({
      sessionId: String(sessionId),
      userId: req.userId!,
      clueId: String(clueId),
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

apiRouter.post('/games/mystery/submit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, questionAnswers, accusedSuspectId } = req.body || {};
    const result = store.submitMysterySolution({
      sessionId: String(sessionId),
      userId: req.userId!,
      questionAnswers: (questionAnswers || {}) as Record<string, number>,
      accusedSuspectId: String(accusedSuspectId || ''),
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// ============================================================================
// MULTIPLAYER ROOMS
// ============================================================================
apiRouter.get('/rooms', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const publicRooms = Array.from(store.rooms.values())
    .filter((r) => !r.isPrivate && r.status === 'lobby')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ rooms: publicRooms });
});

apiRouter.post('/rooms', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { gameSlug, difficulty, maxPlayers, isPrivate } = req.body || {};
    const validGames: GameSlug[] = ['quiz-battle', 'word-challenge', 'brain-test'];
    const selectedGame: GameSlug = validGames.includes(gameSlug) ? gameSlug : 'quiz-battle';
    const validDiff: Difficulty = difficulty === 'easy' || difficulty === 'hard' ? difficulty : 'medium';

    const room = store.createRoom({
      hostId: req.userId!,
      gameSlug: selectedGame,
      difficulty: validDiff,
      maxPlayers: Number(maxPlayers || 4),
      isPrivate: Boolean(isPrivate),
    });
    res.status(201).json({ room });
  } catch (err) {
    const code = (err as Error).message;
    const status = code.includes('LIMIT') || code.includes('PLUS_REQUIRED') ? 403 : 400;
    res.status(status).json({ error: code });
  }
});

apiRouter.get('/rooms/:code', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const room = store.getRoomByCode(String(req.params.code));
  if (!room) {
    res.status(404).json({ error: 'ROOM_NOT_FOUND' });
    return;
  }
  res.json({ room });
});

apiRouter.post('/rooms/:code/join', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const room = store.joinRoomByCode(String(req.params.code), req.userId!);
    multiplayerHub.broadcastRoomState(room.code);
    res.json({ room });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

apiRouter.post('/rooms/:code/leave', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const room = store.leaveRoom(String(req.params.code), req.userId!);
  if (room) {
    multiplayerHub.broadcastRoomState(room.code);
  }
  res.json({ ok: true });
});

apiRouter.post('/rooms/:code/invite', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const room = store.getRoomByCode(String(req.params.code));
  const targetUserId = String(req.body?.targetUserId || '');
  const sender = store.users.get(req.userId!);
  if (!room || !sender || !store.users.has(targetUserId)) {
    res.status(404).json({ error: 'Room or player not found' });
    return;
  }
  store.pushNotification(targetUserId, {
    type: 'room_invite',
    titleEn: `Room Invite from ${sender.displayName}`,
    titleFr: `Invitation de ${sender.displayName}`,
    bodyEn: `Join ${room.gameSlug} room ${room.code}.`,
    bodyFr: `Rejoignez le salon ${room.gameSlug} (${room.code}).`,
    actionUrl: `/multiplayer/room/${room.code}`,
  });
  res.json({ ok: true });
});

// ============================================================================
// FRIENDS, PUBLIC PROFILES, NOTIFICATIONS & REPORTS
// ============================================================================
apiRouter.get('/players/search', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const results = Array.from(store.users.values())
    .filter(
      (u) =>
        u.id !== req.userId &&
        !u.isSuspended &&
        u.isPublicProfile &&
        (q.length === 0 ||
          u.username.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q))
    )
    .slice(0, 20)
    .map((u) => store.sanitizePublicProfile(u));
  res.json({ players: results });
});

apiRouter.get('/players/:username', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const uname = String(req.params.username).trim().toLowerCase();
  const uid = store.usernameIndex.get(uname);
  const user = uid ? store.users.get(uid) : undefined;
  if (!user || user.isSuspended || (!user.isPublicProfile && user.id !== req.userId)) {
    res.status(404).json({ error: 'Player profile not found or private' });
    return;
  }
  const history = store.gameHistory.filter((h) => h.userId === user.id).slice(0, 10);
  const achievements = store.getUserAchievements(user.id).filter((a) => a.unlockedAt !== null);
  res.json({
    profile: store.sanitizePublicProfile(user),
    history,
    achievements,
  });
});

apiRouter.get('/friends', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const friends = store.getFriendsList(req.userId!);
  const requests = store.getFriendRequestsForUser(req.userId!);
  res.json({ friends, ...requests });
});

apiRouter.post('/friends/request', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const targetId = String(req.body?.targetUserId || '');
  if (!targetId || targetId === req.userId || !store.users.has(targetId)) {
    res.status(400).json({ error: 'Invalid target user' });
    return;
  }
  const pair = store.getFriendPairKey(req.userId!, targetId);
  if (store.friendPairs.has(pair)) {
    res.status(409).json({ error: 'Already friends' });
    return;
  }
  for (const existing of store.friendRequests.values()) {
    if (
      existing.status === 'pending' &&
      ((existing.senderId === req.userId && existing.receiverId === targetId) ||
        (existing.senderId === targetId && existing.receiverId === req.userId))
    ) {
      res.status(409).json({ error: 'Friend request already pending' });
      return;
    }
  }
  const id = crypto.randomUUID();
  store.friendRequests.set(id, {
    id,
    senderId: req.userId!,
    receiverId: targetId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  const sender = store.users.get(req.userId!);
  if (sender) {
    store.pushNotification(targetId, {
      type: 'friend_request',
      titleEn: 'New Friend Request',
      titleFr: 'Nouvelle demande d’ami',
      bodyEn: `${sender.displayName} sent you a friend request.`,
      bodyFr: `${sender.displayName} vous a envoyé une demande d’ami.`,
      actionUrl: '/friends',
    });
  }
  res.status(201).json({ ok: true, id });
});

apiRouter.post('/friends/requests/:id/respond', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const reqItem = store.friendRequests.get(String(req.params.id));
  if (!reqItem || reqItem.receiverId !== req.userId || reqItem.status !== 'pending') {
    res.status(404).json({ error: 'Friend request not found' });
    return;
  }
  const accept = req.body?.action === 'accept';
  reqItem.status = accept ? 'accepted' : 'rejected';
  if (accept) {
    store.friendPairs.add(store.getFriendPairKey(reqItem.senderId, reqItem.receiverId));
  }
  res.json({ ok: true, status: reqItem.status });
});

apiRouter.delete('/friends/:friendId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const pair = store.getFriendPairKey(req.userId!, String(req.params.friendId));
  store.friendPairs.delete(pair);
  res.json({ ok: true });
});

apiRouter.get('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ notifications: store.notifications.get(req.userId!) || [] });
});

apiRouter.post('/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const list = store.notifications.get(req.userId!) || [];
  list.forEach((n) => {
    n.isRead = true;
  });
  res.json({ ok: true });
});

apiRouter.post('/reports', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { reportedUserId, reason, details } = req.body || {};
  const reporter = store.users.get(req.userId!);
  const reported = store.users.get(String(reportedUserId || ''));
  if (!reporter || !reported || reporter.id === reported.id || typeof reason !== 'string' || reason.trim().length < 3) {
    res.status(400).json({ error: 'Valid reported user and reason are required' });
    return;
  }
  const report = {
    id: crypto.randomUUID(),
    reporterId: reporter.id,
    reporterUsername: reporter.username,
    reportedUserId: reported.id,
    reportedUsername: reported.username,
    reason: reason.trim().slice(0, 120),
    details: typeof details === 'string' ? details.trim().slice(0, 500) : null,
    status: 'open' as const,
    resolutionNote: null,
    createdAt: new Date().toISOString(),
  };
  store.reports.unshift(report);
  res.status(201).json({ ok: true, report });
});

// ============================================================================
// SUBSCRIPTIONS & PROVIDER-INDEPENDENT PAYMENT FLOW (USD INTEGER CENTS)
// ============================================================================
apiRouter.get('/plans', (_req: Request, res: Response) => {
  res.json({
    plans: store.subscriptionPlans.filter((p) => p.isActive),
    defaultCurrency: envConfig.defaultBillingCurrency,
    paymentProvider: paymentProvider.providerId,
    paymentProviderName: paymentProvider.displayName,
    paymentConfigured: paymentProvider.isConfigured(),
  });
});

apiRouter.get('/subscription', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const sub = store.syncSubscriptionExpiration(req.userId!);
  const payments = Array.from(store.payments.values())
    .filter((p) => p.userId === req.userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({
    subscription: sub,
    payments,
    defaultCurrency: envConfig.defaultBillingCurrency,
    paymentProvider: paymentProvider.providerId,
    paymentProviderName: paymentProvider.displayName,
    paymentConfigured: paymentProvider.isConfigured(),
  });
});

apiRouter.post('/subscription/cancel', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const existing = store.subscriptions.get(req.userId!);
  const user = store.users.get(req.userId!);
  if (!existing || !user) {
    res.status(404).json({ error: 'No active subscription found' });
    return;
  }

  if (existing.providerSubscriptionId) {
    const cancelRes = await paymentProvider.cancelSubscription({
      providerSubscriptionId: existing.providerSubscriptionId,
      cancelImmediately: Boolean(req.body?.immediate),
    });
    if (!cancelRes.success) {
      res.status(502).json({
        error: 'SUBSCRIPTION_CANCEL_UPSTREAM_FAILED',
        message: cancelRes.errorMessage || 'Failed to cancel subscription with payment provider.',
      });
      return;
    }
  }

  const sub = store.cancelUserSubscription(req.userId!);
  res.json({ subscription: sub });
});

apiRouter.post('/payments/checkout', requireAuth, paymentLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = store.users.get(req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const planCode = String(req.body?.planCode || 'plus_monthly');
    if (planCode !== 'plus_monthly' && planCode !== 'plus_annual') {
      res.status(400).json({ error: 'Invalid paid subscription plan' });
      return;
    }
    const plan = store.subscriptionPlans.find((p) => p.code === planCode && p.isActive);
    if (!plan || plan.priceCents <= 0) {
      res.status(400).json({ error: 'Invalid paid subscription plan' });
      return;
    }

    const billingInterval = plan.intervalUnit === 'year' ? 'year' : 'month';
    const reference = `PR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const now = new Date().toISOString();

    const payment: PaymentRecord = {
      id: crypto.randomUUID(),
      userId: user.id,
      planId: plan.id,
      subscriptionId: null,
      provider: paymentProvider.providerId,
      reference,
      providerTransactionId: null,
      providerCheckoutSessionId: null,
      providerSubscriptionId: null,
      amountCents: plan.priceCents,
      currency: plan.currency,
      billingInterval,
      status: 'pending',
      checkoutUrl: null,
      failureReason: null,
      verifiedAt: null,
      createdAt: now,
    };
    store.payments.set(reference, payment);

    const checkoutResult = await paymentProvider.createCheckoutSession({
      reference,
      userId: user.id,
      planCode,
      billingInterval,
      amountCents: plan.priceCents,
      currency: plan.currency,
      providerProductId: plan.providerProductId,
      customerEmail: user.email || '',
      customerName: user.displayName,
      description: `PLAYROOM ${plan.nameEn}`,
      returnUrl: `${envConfig.appUrl}/subscription?ref=${encodeURIComponent(reference)}`,
    });

    if (!checkoutResult.configured || !checkoutResult.checkoutUrl) {
      payment.status = 'failed';
      payment.failureReason = checkoutResult.errorMessage || 'Payment provider unavailable';
      res.status(503).json({
        error: checkoutResult.errorCode || 'PAYMENT_PROVIDER_UNAVAILABLE',
        message: checkoutResult.errorMessage,
        missingConfiguration: checkoutResult.missingConfiguration || [],
        payment,
      });
      return;
    }

    payment.checkoutUrl = checkoutResult.checkoutUrl;
    payment.providerCheckoutSessionId = checkoutResult.providerCheckoutSessionId || null;
    payment.providerTransactionId = checkoutResult.providerTransactionId || null;
    res.json({ payment, checkoutUrl: checkoutResult.checkoutUrl });
  } catch {
    res.status(500).json({ error: 'Failed to initiate checkout session' });
  }
});

apiRouter.get('/payments/verify/:reference', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const reference = String(req.params.reference);
  const payment = store.payments.get(reference);
  if (!payment || payment.userId !== req.userId) {
    res.status(404).json({ error: 'Payment reference not found' });
    return;
  }

  if (payment.status === 'completed') {
    res.json({ payment, verified: true });
    return;
  }

  const verification = await paymentProvider.verifyPayment({
    reference,
    providerCheckoutSessionId: payment.providerCheckoutSessionId,
    providerTransactionId: payment.providerTransactionId,
    expectedAmountCents: payment.amountCents,
    expectedCurrency: payment.currency,
  });

  if (verification.verified) {
    payment.status = 'completed';
    payment.verifiedAt = new Date().toISOString();
    payment.failureReason = null;
    if (verification.providerTransactionId) {
      payment.providerTransactionId = verification.providerTransactionId;
    }
    if (verification.providerSubscriptionId) {
      payment.providerSubscriptionId = verification.providerSubscriptionId;
    }
    store.activatePlusSubscription(payment.userId, payment.planId, {
      provider: payment.provider,
      providerSubscriptionId: payment.providerSubscriptionId,
      renewsAt: verification.renewsAt,
      paymentReference: payment.reference,
    });
  } else if (verification.status === 'failed' || verification.status === 'cancelled') {
    payment.status = verification.status;
    payment.failureReason = verification.failureReason || verification.errorMessage || null;
    if (verification.status === 'failed') {
      store.handlePaymentFailure({
        reference: payment.reference,
        providerSubscriptionId: payment.providerSubscriptionId,
        failureReason: payment.failureReason,
      });
    }
  }

  res.json({ payment, verified: verification.verified, message: verification.errorMessage });
});

// Provider-independent authenticated webhook handler (idempotent + HMAC verified)
apiRouter.post(
  '/webhooks/payments',
  express.raw({ type: 'application/json' }),
  (req: Request, res: Response) => {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body || {});

    const verified = paymentProvider.verifyWebhookAndParse(rawBody, req.headers);
    if (!verified.valid || !verified.event) {
      res.status(401).json({ error: verified.errorMessage || 'Invalid webhook signature' });
      return;
    }

    const evt = verified.event;

    // Idempotent duplicate webhook event guard
    if (store.processedWebhookEvents.has(evt.eventId)) {
      res.json({ ok: true, idempotent: true });
      return;
    }

    // Resolve matching payment or subscription record
    const payment = evt.reference
      ? store.payments.get(evt.reference)
      : Array.from(store.payments.values()).find(
          (p) =>
            (evt.providerCheckoutSessionId &&
              p.providerCheckoutSessionId === evt.providerCheckoutSessionId) ||
            (evt.providerTransactionId && p.providerTransactionId === evt.providerTransactionId)
        );

    const existingSub =
      (evt.providerSubscriptionId &&
        store.findSubscriptionByProviderId(evt.providerSubscriptionId)) ||
      (evt.userId ? store.subscriptions.get(evt.userId) : null);

    if (evt.eventType === 'payment.succeeded') {
      if (payment) {
        const amountOk = evt.amountCents === null || evt.amountCents === payment.amountCents;
        const currencyOk =
          evt.currency === null || evt.currency.toUpperCase() === payment.currency.toUpperCase();
        if (!amountOk || !currencyOk) {
          res.status(400).json({ error: 'Payment amount or currency mismatch' });
          return;
        }
        payment.status = 'completed';
        payment.verifiedAt = new Date().toISOString();
        payment.failureReason = null;
        if (evt.providerTransactionId) {
          payment.providerTransactionId = evt.providerTransactionId;
        }
        if (evt.providerSubscriptionId) {
          payment.providerSubscriptionId = evt.providerSubscriptionId;
        }
        store.activatePlusSubscription(payment.userId, payment.planId, {
          provider: paymentProvider.providerId,
          providerSubscriptionId: payment.providerSubscriptionId,
          renewsAt: evt.renewsAt,
          paymentReference: payment.reference,
        });
      } else if (existingSub && evt.amountCents !== null && evt.currency !== null) {
        // Verified recurring renewal payment from Merchant of Record
        const renewalRecord: PaymentRecord = {
          id: crypto.randomUUID(),
          userId: existingSub.userId,
          planId: existingSub.planId,
          subscriptionId: existingSub.id,
          provider: paymentProvider.providerId,
          reference: `REN-${evt.providerTransactionId || crypto.randomBytes(4).toString('hex')}`,
          providerTransactionId: evt.providerTransactionId,
          providerCheckoutSessionId: evt.providerCheckoutSessionId,
          providerSubscriptionId: existingSub.providerSubscriptionId,
          amountCents: evt.amountCents,
          currency: evt.currency,
          billingInterval: existingSub.billingInterval,
          status: 'completed',
          checkoutUrl: null,
          failureReason: null,
          verifiedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        store.payments.set(renewalRecord.reference, renewalRecord);
        store.activatePlusSubscription(existingSub.userId, existingSub.planId, {
          provider: paymentProvider.providerId,
          providerSubscriptionId: existingSub.providerSubscriptionId,
          renewsAt: evt.renewsAt,
        });
      }
      store.processedWebhookEvents.add(evt.eventId);
      res.json({ ok: true, activated: true });
      return;
    }

    if (evt.eventType === 'subscription.active' || evt.eventType === 'subscription.renewed') {
      const targetUserId = payment?.userId || existingSub?.userId || evt.userId;
      const targetPlanId = payment?.planId || existingSub?.planId;
      if (targetUserId && targetPlanId) {
        store.activatePlusSubscription(targetUserId, targetPlanId, {
          provider: paymentProvider.providerId,
          providerSubscriptionId: evt.providerSubscriptionId || existingSub?.providerSubscriptionId,
          renewsAt: evt.renewsAt,
          paymentReference: payment?.reference,
        });
      }
      store.processedWebhookEvents.add(evt.eventId);
      res.json({ ok: true, activated: true });
      return;
    }

    if (evt.eventType === 'payment.failed' || evt.eventType === 'subscription.past_due') {
      store.handlePaymentFailure({
        reference: payment?.reference || evt.reference,
        providerSubscriptionId: evt.providerSubscriptionId,
        failureReason: evt.failureReason,
      });
      store.processedWebhookEvents.add(evt.eventId);
      res.json({ ok: true, handled: 'payment_failed' });
      return;
    }

    if (evt.eventType === 'subscription.cancelled') {
      const targetUserId = existingSub?.userId || payment?.userId || evt.userId;
      if (targetUserId) {
        store.cancelUserSubscription(targetUserId, evt.cancelledAt);
      }
      store.processedWebhookEvents.add(evt.eventId);
      res.json({ ok: true, handled: 'cancelled' });
      return;
    }

    if (evt.eventType === 'subscription.expired') {
      const targetUserId = existingSub?.userId || payment?.userId || evt.userId;
      if (targetUserId) {
        store.expireUserSubscription(targetUserId);
      }
      store.processedWebhookEvents.add(evt.eventId);
      res.json({ ok: true, handled: 'expired' });
      return;
    }

    store.processedWebhookEvents.add(evt.eventId);
    res.json({ ok: true, ignored: true });
  }
);

// ============================================================================
// ADMIN BOOTSTRAP & PROTECTED ADMIN ROUTES
// ============================================================================
apiRouter.get('/admin/bootstrap-status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = store.users.get(req.userId!);
  res.json({
    hasAnyAdmin: store.hasAnyAdmin(),
    passcodeConfigured: Boolean(envConfig.adminClaimPasscode),
    currentUserIsAdmin: Boolean(user?.role),
  });
});

apiRouter.post('/admin/claim', requireAuth, authLimiter, (req: AuthenticatedRequest, res: Response) => {
  try {
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode : undefined;
    const updated = store.claimAdminRole(req.userId!, passcode);
    res.json({ user: updated });
  } catch (err) {
    const code = (err as Error).message;
    res.status(code === 'ADMIN_ALREADY_CLAIMED' || code === 'INVALID_ADMIN_PASSCODE' ? 403 : 400).json({
      error: code,
    });
  }
});

apiRouter.get('/admin/overview', requireAuth, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const allUsers = Array.from(store.users.values());
  const now = Date.now();
  const activeUsers = allUsers.filter((u) => now - new Date(u.lastActiveAt).getTime() < 24 * 60 * 60 * 1000).length;
  const activeSubscriptions = Array.from(store.subscriptions.values()).filter((s) => s.status === 'active').length;
  const verifiedRevenueCents = Array.from(store.payments.values())
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + Math.trunc(p.amountCents), 0);

  res.json({
    stats: {
      totalUsers: allUsers.length,
      activeUsers,
      totalGamesPlayed: store.gameHistory.length,
      activeSubscriptions,
      verifiedRevenueCents,
      currency: envConfig.defaultBillingCurrency,
      openReports: store.reports.filter((r) => r.status === 'open').length,
    },
    recentActivity: store.gameHistory.slice(0, 12).map((h) => ({
      ...h,
      username: store.users.get(h.userId)?.username || 'unknown',
    })),
  });
});

apiRouter.get('/admin/users', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const users = Array.from(store.users.values())
    .filter(
      (u) =>
        !q ||
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    )
    .map((u) => store.sanitizeOwnUser(u));
  res.json({ users });
});

apiRouter.patch('/admin/users/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const target = store.users.get(String(req.params.id));
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { isSuspended } = req.body || {};
  if (typeof isSuspended === 'boolean' && target.id !== req.userId) {
    target.isSuspended = isSuspended;
  }
  res.json({ user: store.sanitizeOwnUser(target) });
});

apiRouter.get('/admin/questions', requireAuth, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ questions: store.quizQuestions });
});

apiRouter.post('/admin/questions', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { category, difficulty, promptEn, promptFr, optionsEn, optionsFr, correctOptionIndex, explanationEn, explanationFr } =
    req.body || {};
  if (
    typeof promptEn !== 'string' ||
    !Array.isArray(optionsEn) ||
    optionsEn.length !== 4 ||
    typeof correctOptionIndex !== 'number'
  ) {
    res.status(400).json({ error: 'Invalid question payload' });
    return;
  }
  const question = {
    id: `qb-${crypto.randomUUID().slice(0, 8)}`,
    category: (category || 'general') as QuizCategory,
    difficulty: (difficulty || 'medium') as Difficulty,
    promptEn: promptEn.trim(),
    promptFr: typeof promptFr === 'string' && promptFr.trim() ? promptFr.trim() : promptEn.trim(),
    optionsEn: optionsEn.map(String) as [string, string, string, string],
    optionsFr: (Array.isArray(optionsFr) && optionsFr.length === 4 ? optionsFr : optionsEn).map(String) as [
      string,
      string,
      string,
      string,
    ],
    correctOptionIndex: Math.min(3, Math.max(0, Math.floor(correctOptionIndex))),
    explanationEn: typeof explanationEn === 'string' ? explanationEn.trim() : '',
    explanationFr: typeof explanationFr === 'string' ? explanationFr.trim() : '',
    isActive: true,
  };
  store.quizQuestions.unshift(question);
  res.status(201).json({ question });
});

apiRouter.delete('/admin/questions/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);
  store.quizQuestions = store.quizQuestions.filter((q) => q.id !== id);
  res.json({ ok: true });
});

apiRouter.post('/admin/daily-challenge', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { gameSlug, difficulty, titleEn, titleFr, descriptionEn, descriptionFr, targetScore, xpReward } =
    req.body || {};
  const today = store.ensureTodayChallenge();
  if (gameSlug) today.gameSlug = gameSlug;
  if (difficulty) today.difficulty = difficulty;
  if (titleEn) today.titleEn = String(titleEn);
  if (titleFr) today.titleFr = String(titleFr);
  if (descriptionEn) today.descriptionEn = String(descriptionEn);
  if (descriptionFr) today.descriptionFr = String(descriptionFr);
  if (typeof targetScore === 'number') today.targetScore = Math.max(50, targetScore);
  if (typeof xpReward === 'number') today.xpReward = Math.max(25, xpReward);
  res.json({ challenge: today });
});

apiRouter.patch('/admin/plans/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const plan = store.subscriptionPlans.find((p) => p.id === String(req.params.id));
  if (!plan) {
    res.status(404).json({ error: 'Plan not found' });
    return;
  }
  const { priceCents, currency, providerProductId, descriptionEn, descriptionFr } = req.body || {};
  if (typeof priceCents === 'number') {
    if (!Number.isInteger(priceCents) || priceCents < 0) {
      res.status(400).json({ error: 'priceCents must be a non-negative integer' });
      return;
    }
    plan.priceCents = priceCents;
  }
  if (typeof currency === 'string' && currency.trim().length === 3) {
    plan.currency = currency.trim().toUpperCase();
  }
  if (typeof providerProductId === 'string') {
    plan.providerProductId = providerProductId.trim() || null;
  }
  if (typeof descriptionEn === 'string') plan.descriptionEn = descriptionEn.trim();
  if (typeof descriptionFr === 'string') plan.descriptionFr = descriptionFr.trim();
  res.json({ plan });
});

apiRouter.get('/admin/payments', requireAuth, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const payments = Array.from(store.payments.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => ({
      ...p,
      username: store.users.get(p.userId)?.username || 'unknown',
    }));
  const subscriptions = Array.from(store.subscriptions.values()).map((s) => ({
    ...s,
    username: store.users.get(s.userId)?.username || 'unknown',
  }));
  res.json({ payments, subscriptions });
});

apiRouter.get('/admin/reports', requireAuth, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ reports: store.reports });
});

apiRouter.patch('/admin/reports/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const report = store.reports.find((r) => r.id === String(req.params.id));
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }
  const { status, resolutionNote, suspendReported } = req.body || {};
  if (status === 'reviewing' || status === 'resolved' || status === 'dismissed') {
    report.status = status;
  }
  if (typeof resolutionNote === 'string') {
    report.resolutionNote = resolutionNote.trim();
  }
  if (suspendReported === true) {
    const target = store.users.get(report.reportedUserId);
    if (target) target.isSuspended = true;
  }
  res.json({ report });
});
