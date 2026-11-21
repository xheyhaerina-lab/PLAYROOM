import crypto from 'crypto';
import { describe, expect, it } from 'vitest';
import { paymentProvider } from '../server/payments/index.ts';
import { DodoPaymentsAdapter } from '../server/payments/dodo.ts';
import { store } from '../server/store.ts';
import { formatMoneyCents, formatUsdCents } from '../src/utils/currency.ts';
import {
  calculateBrainTestScore,
  calculateMysteryScore,
  calculateQuizRoundPoints,
  calculateWordChallengeScore,
  computeLevelFromXp,
  getLevelProgress,
} from '../src/utils/progression.ts';

describe('PLAYROOM Progression & Scoring Logic', () => {
  it('computes levels and XP progress accurately', () => {
    expect(computeLevelFromXp(0)).toBe(1);
    expect(computeLevelFromXp(149)).toBe(1);
    expect(computeLevelFromXp(150)).toBe(2);
    expect(computeLevelFromXp(450)).toBe(3);

    const prog = getLevelProgress(200);
    expect(prog.level).toBe(2);
    expect(prog.xpIntoLevel).toBe(50);
    expect(prog.percent).toBeGreaterThan(0);
    expect(prog.percent).toBeLessThanOrEqual(100);
  });

  it('calculates quiz, word, brain, and mystery scores deterministically', () => {
    const fastQuiz = calculateQuizRoundPoints({
      isCorrect: true,
      difficulty: 'hard',
      responseMs: 1000,
      maxTimeMs: 15000,
    });
    const wrongQuiz = calculateQuizRoundPoints({
      isCorrect: false,
      difficulty: 'hard',
      responseMs: 1000,
      maxTimeMs: 15000,
    });
    expect(fastQuiz).toBeGreaterThan(160);
    expect(wrongQuiz).toBe(0);

    const wordScore = calculateWordChallengeScore({
      solved: true,
      attemptsUsed: 2,
      maxAttempts: 6,
      hintsUsed: 0,
      elapsedSeconds: 20,
      difficulty: 'medium',
    });
    expect(wordScore).toBeGreaterThan(300);

    const brainScore = calculateBrainTestScore({
      correctCount: 5,
      totalCount: 5,
      hintsUsed: 0,
      elapsedSeconds: 45,
      difficulty: 'medium',
    });
    expect(brainScore).toBeGreaterThan(500);

    const mysteryScore = calculateMysteryScore({
      correctDeductions: 2,
      totalQuestions: 2,
      solvedCulprit: true,
      cluesInspected: 3,
      difficulty: 'easy',
    });
    expect(mysteryScore).toBe(425);
  });

  it('formats USD integer cents accurately without floating-point arithmetic', () => {
    expect(formatUsdCents(0, { compactZero: true })).toBe('$0');
    expect(formatUsdCents(0)).toBe('$0.00');
    expect(formatUsdCents(499)).toBe('$4.99');
    expect(formatUsdCents(3999)).toBe('$39.99');
    expect(formatMoneyCents(499, 'USD')).toBe('$4.99');
  });
});

describe('PLAYROOM Auth, Games, Multiplayer & USD Billing Architecture', () => {
  it('registers, authenticates, and rejects invalid credentials', () => {
    const reg = store.registerUser({
      username: 'qa_tester',
      displayName: 'QA Tester',
      email: 'qa@playroom.test',
      password: 'Password123!',
      preferredLanguage: 'en',
    });

    expect(reg.user.username).toBe('qa_tester');
    expect(store.verifyToken(reg.token)).toBe(reg.user.id);

    const login = store.loginUser('qa@playroom.test', 'Password123!');
    expect(login.user.id).toBe(reg.user.id);

    expect(() => store.loginUser('qa@playroom.test', 'WrongPass')).toThrow('INVALID_CREDENTIALS');
  });

  it('runs Quiz Battle server-side without revealing answers early and blocks duplicates', () => {
    const { user } = store.registerUser({
      username: 'quiz_player',
      displayName: 'Quiz Player',
      email: 'quiz@playroom.test',
      password: 'Password123!',
    });

    const started = store.startQuizSession({
      userId: user.id,
      category: 'science',
      difficulty: 'medium',
    });

    expect(started.questions.length).toBe(5);
    expect((started.questions[0] as unknown as Record<string, unknown>).correctOptionIndex).toBeUndefined();

    const ans0 = store.submitQuizAnswer({
      sessionId: started.sessionId,
      userId: user.id,
      roundIndex: 0,
      selectedIndex: 0,
      responseMs: 2500,
    });
    expect(typeof ans0.correctOptionIndex).toBe('number');

    expect(() =>
      store.submitQuizAnswer({
        sessionId: started.sessionId,
        userId: user.id,
        roundIndex: 0,
        selectedIndex: 1,
        responseMs: 3000,
      })
    ).toThrow('DUPLICATE_SUBMISSION');
  });

  it('enforces Free tier room restrictions vs PLAYROOM PLUS and supports monthly/annual USD plans', () => {
    const freePlan = store.subscriptionPlans.find((p) => p.code === 'free');
    const monthlyPlan = store.subscriptionPlans.find((p) => p.code === 'plus_monthly');
    const annualPlan = store.subscriptionPlans.find((p) => p.code === 'plus_annual');

    expect(freePlan?.priceCents).toBe(0);
    expect(freePlan?.currency).toBe('USD');
    expect(monthlyPlan?.priceCents).toBe(499);
    expect(monthlyPlan?.currency).toBe('USD');
    expect(annualPlan?.priceCents).toBe(3999);
    expect(annualPlan?.currency).toBe('USD');

    const { user } = store.registerUser({
      username: 'room_host',
      displayName: 'Room Host',
      email: 'host@playroom.test',
      password: 'Password123!',
    });

    // Free user cannot create room > 4 players
    expect(() =>
      store.createRoom({
        hostId: user.id,
        gameSlug: 'quiz-battle',
        difficulty: 'medium',
        maxPlayers: 8,
        isPrivate: true,
      })
    ).toThrow('PLUS_REQUIRED_MAX_PLAYERS');

    // Free user limited to 2 private rooms/day
    const r1 = store.createRoom({
      hostId: user.id,
      gameSlug: 'quiz-battle',
      difficulty: 'easy',
      maxPlayers: 4,
      isPrivate: true,
    });
    const r2 = store.createRoom({
      hostId: user.id,
      gameSlug: 'word-challenge',
      difficulty: 'easy',
      maxPlayers: 4,
      isPrivate: true,
    });
    expect(r1.code).toHaveLength(6);
    expect(r2.code).toHaveLength(6);

    expect(() =>
      store.createRoom({
        hostId: user.id,
        gameSlug: 'brain-test',
        difficulty: 'easy',
        maxPlayers: 4,
        isPrivate: true,
      })
    ).toThrow('FREE_PRIVATE_ROOM_LIMIT');

    // Activate annual PLUS plan via server lifecycle
    const sub = store.activatePlusSubscription(user.id, 'plan-plus-annual', {
      provider: 'dodo_payments',
      providerSubscriptionId: 'sub_test_annual_1',
    });
    expect(sub.billingInterval).toBe('year');
    expect(sub.amountCents).toBe(3999);
    expect(sub.currency).toBe('USD');

    const rPlus = store.createRoom({
      hostId: user.id,
      gameSlug: 'quiz-battle',
      difficulty: 'hard',
      maxPlayers: 12,
      isPrivate: true,
    });
    expect(rPlus.maxPlayers).toBe(12);

    // Handle failed renewal & cancellation cleanly
    store.handlePaymentFailure({
      providerSubscriptionId: 'sub_test_annual_1',
      failureReason: 'Card declined',
    });
    expect(store.subscriptions.get(user.id)?.status).toBe('past_due');

    const cancelled = store.cancelUserSubscription(user.id);
    expect(cancelled?.status).toBe('cancelled');
    expect(cancelled?.cancelledAt).toBeTruthy();
  });

  it('fails safely when payment provider is unconfigured and verifies Standard Webhooks signatures strictly', async () => {
    const checkout = await paymentProvider.createCheckoutSession({
      reference: 'PR-TEST-USD-1',
      userId: 'user-1',
      planCode: 'plus_monthly',
      billingInterval: 'month',
      amountCents: 499,
      currency: 'USD',
      customerEmail: 'qa@playroom.test',
      customerName: 'QA',
      description: 'PLAYROOM PLUS',
      returnUrl: 'http://localhost:3000/subscription',
    });

    expect(checkout.configured).toBe(false);
    expect(checkout.errorCode).toBe('PAYMENT_PROVIDER_NOT_CONFIGURED');

    // Unconfigured webhook secret must reject signatures
    const adapter = new DodoPaymentsAdapter();
    const rawBody = JSON.stringify({
      type: 'payment.succeeded',
      data: {
        payment_id: 'pay_123',
        subscription_id: 'sub_123',
        total_amount: 499,
        currency: 'USD',
        metadata: { playroom_reference: 'PR-TEST-USD-1' },
      },
    });
    const nowTs = String(Math.floor(Date.now() / 1000));
    const fakeSig = `v1,${crypto.createHmac('sha256', 'wrong').update(`msg_1.${nowTs}.${rawBody}`).digest('base64')}`;

    const verified = adapter.verifyWebhookAndParse(rawBody, {
      'webhook-id': 'msg_1',
      'webhook-timestamp': nowTs,
      'webhook-signature': fakeSig,
    });
    expect(verified.valid).toBe(false);
  });
});
