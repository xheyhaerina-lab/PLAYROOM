import crypto from 'crypto';
import { envConfig } from './config.ts';
import {
  BRAIN_PUZZLES,
  GAME_CATALOG,
  INITIAL_MYSTERY_SCENARIOS,
  INITIAL_QUIZ_QUESTIONS,
  WORD_BANK,
  type BrainPuzzleAdmin,
  type MysteryScenarioAdmin,
  type WordEntry,
} from './gameData.ts';
import type {
  AchievementItem,
  AdminRole,
  AppNotification,
  BrainPuzzlePublic,
  DailyChallengeItem,
  Difficulty,
  FriendRequestItem,
  GameHistoryRecord,
  GameSlug,
  Language,
  LeaderboardEntry,
  ModerationReport,
  MysteryScenarioPublic,
  PaymentRecord,
  PublicProfile,
  QuizCategory,
  QuizQuestionAdmin,
  QuizQuestionPublic,
  Room,
  SubscriptionPlan,
  SubscriptionRecord,
  UserProfile,
  WordPuzzlePublic,
} from '../src/types/playroom.ts';
import {
  calculateBrainTestScore,
  calculateMysteryScore,
  calculateQuizRoundPoints,
  calculateWordChallengeScore,
  computeLevelFromXp,
} from '../src/utils/progression.ts';

interface StoredUser extends UserProfile {
  passwordHash: string;
  passwordSalt: string;
  emailVerified: boolean;
  verificationToken: string | null;
  resetToken: string | null;
  resetTokenExpiresAt: number | null;
}

interface StoredAchievement {
  id: string;
  code: string;
  titleEn: string;
  titleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  xpReward: number;
  isPlusExclusive: boolean;
  iconName: string;
}

interface StoredDailyChallenge {
  id: string;
  challengeDate: string;
  gameSlug: GameSlug;
  difficulty: Difficulty;
  titleEn: string;
  titleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  targetScore: number;
  xpReward: number;
  isPlusOnly: boolean;
}

interface ActiveSoloSession {
  id: string;
  userId: string;
  gameSlug: GameSlug;
  mode: 'solo' | 'daily';
  difficulty: Difficulty;
  language: Language;
  startedAt: number;
  completedAt: string | null;
  score: number;
  xpEarned: number;
  // Game-specific authoritative payload
  quizQuestionIds?: string[];
  quizSubmittedRounds?: Set<number>;
  quizResults?: { roundIndex: number; isCorrect: boolean; points: number }[];
  wordEntryId?: string;
  wordTarget?: string;
  wordAttempts?: string[];
  wordHintsUsed?: number;
  wordSolved?: boolean;
  brainPuzzleIds?: string[];
  brainSubmittedIndices?: Set<number>;
  brainCorrectCount?: number;
  brainHintsUsed?: number;
  mysteryScenarioId?: string;
  mysteryUnlockedClues?: Set<string>;
}

interface LeaderboardScoreRecord {
  userId: string;
  gameSlug: string;
  periodType: 'daily' | 'weekly' | 'monthly' | 'all_time';
  periodKey: string;
  score: number;
  wins: number;
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, usedSalt, 64).toString('hex');
  return { hash: derived, salt: usedSalt };
}

function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function getUtcPeriodKeys(date = new Date()): {
  daily: string;
  weekly: string;
  monthly: string;
  all_time: string;
} {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const startOfYear = new Date(Date.UTC(y, 0, 1));
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = String(Math.ceil((dayOfYear + startOfYear.getUTCDay() + 1) / 7)).padStart(2, '0');
  return {
    daily: `${y}-${m}-${d}`,
    weekly: `${y}-W${weekNum}`,
    monthly: `${y}-${m}`,
    all_time: 'all',
  };
}

class PlayroomStore {
  users = new Map<string, StoredUser>();
  emailIndex = new Map<string, string>();
  usernameIndex = new Map<string, string>();
  revokedTokens = new Set<string>();

  quizQuestions: QuizQuestionAdmin[] = [...INITIAL_QUIZ_QUESTIONS];
  wordBank: WordEntry[] = [...WORD_BANK];
  brainPuzzles: BrainPuzzleAdmin[] = [...BRAIN_PUZZLES];
  mysteryScenarios: MysteryScenarioAdmin[] = [...INITIAL_MYSTERY_SCENARIOS];

  soloSessions = new Map<string, ActiveSoloSession>();
  gameHistory: (GameHistoryRecord & { userId: string })[] = [];

  rooms = new Map<string, Room>();
  roomCodeIndex = new Map<string, string>();
  dailyPrivateRoomsCreated = new Map<string, number>();

  friendRequests = new Map<string, { id: string; senderId: string; receiverId: string; status: 'pending' | 'accepted' | 'rejected'; createdAt: string }>();
  friendPairs = new Set<string>(); // `${smallerId}:${largerId}`

  achievements: StoredAchievement[] = [
    {
      id: 'ach-first-game',
      code: 'first_game',
      titleEn: 'First Spark',
      titleFr: 'Première Étincelle',
      descriptionEn: 'Complete your very first game on PLAYROOM.',
      descriptionFr: 'Terminez votre toute première partie sur PLAYROOM.',
      xpReward: 50,
      isPlusExclusive: false,
      iconName: 'Play',
    },
    {
      id: 'ach-first-victory',
      code: 'first_victory',
      titleEn: 'First Victory',
      titleFr: 'Première Victoire',
      descriptionEn: 'Win your first competitive or high-score match.',
      descriptionFr: 'Remportez votre première victoire.',
      xpReward: 75,
      isPlusExclusive: false,
      iconName: 'Trophy',
    },
    {
      id: 'ach-ten-games',
      code: 'ten_games',
      titleEn: 'Seasoned Contender',
      titleFr: 'Joueur Aguerri',
      descriptionEn: 'Complete 10 games across any game mode.',
      descriptionFr: 'Terminez 10 parties dans n’importe quel mode.',
      xpReward: 150,
      isPlusExclusive: false,
      iconName: 'Flame',
    },
    {
      id: 'ach-daily-master',
      code: 'daily_master',
      titleEn: 'Daily Challenger',
      titleFr: 'Fidèle au Poste',
      descriptionEn: 'Complete a Daily Challenge.',
      descriptionFr: 'Terminez un Défi Quotidien.',
      xpReward: 100,
      isPlusExclusive: false,
      iconName: 'CalendarCheck',
    },
    {
      id: 'ach-multiplayer',
      code: 'multiplayer_champion',
      titleEn: 'Room Champion',
      titleFr: 'Champion du Salon',
      descriptionEn: 'Win a multiplayer room match against other players.',
      descriptionFr: 'Gagnez une partie multijoueur contre d’autres joueurs.',
      xpReward: 200,
      isPlusExclusive: false,
      iconName: 'Crown',
    },
    {
      id: 'ach-puzzle-master',
      code: 'puzzle_master',
      titleEn: 'Puzzle Architect',
      titleFr: 'Maître Logicien',
      descriptionEn: 'Score 85%+ accuracy in Brain Test or Mystery Room.',
      descriptionFr: 'Obtenez au moins 85 % de réussite dans Test Cérébral ou Chambre Mystère.',
      xpReward: 180,
      isPlusExclusive: false,
      iconName: 'Brain',
    },
    {
      id: 'ach-plus-elite',
      code: 'plus_elite',
      titleEn: 'PLAYROOM PLUS Vanguard',
      titleFr: 'Avant-Garde PLUS',
      descriptionEn: 'Activate PLAYROOM PLUS and complete a premium challenge.',
      descriptionFr: 'Activez PLAYROOM PLUS et terminez un défi premium.',
      xpReward: 250,
      isPlusExclusive: true,
      iconName: 'Sparkles',
    },
  ];
  userAchievements = new Map<string, Map<string, string>>(); // userId -> Map<achievementId, unlockedAt>

  dailyChallenges: StoredDailyChallenge[] = [];
  userChallengeProgress = new Map<string, { bestScore: number; completedAt: string | null }>(); // `${userId}:${challengeId}`

  leaderboardScores = new Map<string, LeaderboardScoreRecord>();

  subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'plan-free',
      code: 'free',
      nameEn: 'FREE',
      nameFr: 'GRATUIT',
      descriptionEn: 'Essential solo and social play to get started.',
      descriptionFr: 'L’essentiel pour jouer en solo et entre amis.',
      priceCents: 0,
      currency: envConfig.defaultBillingCurrency || 'USD',
      intervalUnit: 'lifetime',
      providerProductId: null,
      featuresEn: [
        'Access to all 4 core games',
        'Solo mode & daily challenges',
        'Up to 2 private rooms per day',
        'Standard XP & global leaderboards',
      ],
      featuresFr: [
        'Accès aux 4 jeux principaux',
        'Mode solo et défis quotidiens',
        'Jusqu’à 2 salons privés par jour',
        'Progression XP et classements globaux',
      ],
      isActive: true,
    },
    {
      id: 'plan-plus-monthly',
      code: 'plus_monthly',
      nameEn: 'PLAYROOM PLUS',
      nameFr: 'PLAYROOM PLUS',
      descriptionEn: 'Unlimited rooms, advanced analytics, exclusive mysteries & themes.',
      descriptionFr: 'Salons illimités, statistiques avancées, enquêtes et thèmes exclusifs.',
      priceCents: 499,
      currency: envConfig.defaultBillingCurrency || 'USD',
      intervalUnit: 'month',
      providerProductId: envConfig.dodoProductPlusMonthlyId || null,
      featuresEn: [
        'Unlimited private & custom rooms (up to 12 players)',
        'All Mystery Room case files & Hard challenges',
        'Advanced performance & category analytics',
        'Exclusive dark-violet profile badges & achievements',
        'Priority rematch lobbies',
      ],
      featuresFr: [
        'Salons privés illimités (jusqu’à 12 joueurs)',
        'Toutes les enquêtes Chambre Mystère et défis Difficiles',
        'Statistiques avancées par catégorie',
        'Badges et succès exclusifs PLAYROOM PLUS',
        'Revanches instantanées en salon',
      ],
      isActive: true,
    },
    {
      id: 'plan-plus-annual',
      code: 'plus_annual',
      nameEn: 'PLAYROOM PLUS YEARLY',
      nameFr: 'PLAYROOM PLUS ANNUEL',
      descriptionEn: 'Full PLAYROOM PLUS membership billed annually with 33% savings.',
      descriptionFr: 'Accès complet PLAYROOM PLUS facturé à l’année avec 33 % d’économie.',
      priceCents: 3999,
      currency: envConfig.defaultBillingCurrency || 'USD',
      intervalUnit: 'year',
      providerProductId: envConfig.dodoProductPlusAnnualId || null,
      featuresEn: [
        'Everything in PLAYROOM PLUS Monthly',
        'Annual billing discount (33% savings vs monthly)',
        'Unlimited private & custom rooms (up to 12 players)',
        'All Mystery Room case files & Hard challenges',
        'Exclusive annual supporter badge & priority lobbies',
      ],
      featuresFr: [
        'Tout le contenu de PLAYROOM PLUS Mensuel',
        'Tarif annuel avantageux (33 % d’économie)',
        'Salons privés illimités (jusqu’à 12 joueurs)',
        'Toutes les enquêtes Chambre Mystère et défis Difficiles',
        'Badge annuel exclusif & revanches instantanées',
      ],
      isActive: true,
    },
  ];
  subscriptions = new Map<string, SubscriptionRecord>();
  payments = new Map<string, PaymentRecord>();
  processedWebhookEvents = new Set<string>();

  notifications = new Map<string, AppNotification[]>();
  reports: ModerationReport[] = [];

  constructor() {
    this.ensureTodayChallenge();
  }

  ensureTodayChallenge(): StoredDailyChallenge {
    const { daily } = getUtcPeriodKeys();
    const existing = this.dailyChallenges.find((c) => c.challengeDate === daily);
    if (existing) return existing;

    const games: GameSlug[] = ['quiz-battle', 'word-challenge', 'brain-test', 'mystery-room'];
    const daySeed = Number(daily.replace(/-/g, '')) % games.length;
    const gameSlug = games[daySeed];
    const challenge: StoredDailyChallenge = {
      id: `daily-${daily}`,
      challengeDate: daily,
      gameSlug,
      difficulty: 'medium',
      titleEn:
        gameSlug === 'quiz-battle'
          ? 'Global Knowledge Sprint'
          : gameSlug === 'word-challenge'
            ? 'Daily Lexicon Decode'
            : gameSlug === 'brain-test'
              ? 'Cognitive Precision Drill'
              : 'Midnight Case Briefing',
      titleFr:
        gameSlug === 'quiz-battle'
          ? 'Sprint Culture Générale'
          : gameSlug === 'word-challenge'
            ? 'Décodage Lexical du Jour'
            : gameSlug === 'brain-test'
              ? 'Exercice de Précision Logique'
              : 'Enquête Nocturne du Jour',
      descriptionEn: 'Complete today’s featured challenge and hit the target score before 00:00 UTC.',
      descriptionFr: 'Terminez le défi du jour et atteignez le score cible avant 00h00 UTC.',
      targetScore: gameSlug === 'word-challenge' ? 160 : 280,
      xpReward: 150,
      isPlusOnly: false,
    };
    this.dailyChallenges.unshift(challenge);
    return challenge;
  }

  // ============================================================================
  // AUTH & USERS
  // ============================================================================
  signToken(userId: string): string {
    const payload = Buffer.from(
      JSON.stringify({
        sub: userId,
        iat: Date.now(),
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        jti: crypto.randomUUID(),
      })
    ).toString('base64url');
    const sig = crypto.createHmac('sha256', envConfig.sessionSecret).update(payload).digest('base64url');
    return `${payload}.${sig}`;
  }

  verifyToken(token: string): string | null {
    if (!token || this.revokedTokens.has(token)) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, sigB64] = parts;
    const expectedSig = crypto
      .createHmac('sha256', envConfig.sessionSecret)
      .update(payloadB64)
      .digest('base64url');

    const a = Buffer.from(sigB64, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    try {
      const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
        sub?: string;
        exp?: number;
      };
      if (!decoded.sub || !decoded.exp || decoded.exp < Date.now()) {
        return null;
      }
      const user = this.users.get(decoded.sub);
      if (!user || user.isSuspended) return null;
      return decoded.sub;
    } catch {
      return null;
    }
  }

  sanitizeOwnUser(u: StoredUser): UserProfile {
    return {
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      email: u.email,
      avatarUrl: u.avatarUrl,
      xp: u.xp,
      level: u.level,
      totalGamesPlayed: u.totalGamesPlayed,
      wins: u.wins,
      subscriptionStatus: u.subscriptionStatus,
      preferredLanguage: u.preferredLanguage,
      isPublicProfile: u.isPublicProfile,
      isSuspended: u.isSuspended,
      role: u.role,
      lastActiveAt: u.lastActiveAt,
      createdAt: u.createdAt,
    };
  }

  sanitizePublicProfile(u: StoredUser): PublicProfile {
    const activeRecently = Date.now() - new Date(u.lastActiveAt).getTime() < 5 * 60 * 1000;
    return {
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      xp: u.xp,
      level: u.level,
      totalGamesPlayed: u.totalGamesPlayed,
      wins: u.wins,
      subscriptionStatus: u.subscriptionStatus,
      isOnline: activeRecently,
      createdAt: u.createdAt,
    };
  }

  registerUser(input: {
    username: string;
    displayName: string;
    email: string;
    password: string;
    preferredLanguage?: Language;
  }): { user: UserProfile; token: string; verificationToken: string } {
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedUsername = input.username.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
      throw new Error('USERNAME_INVALID');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('EMAIL_INVALID');
    }
    if (input.password.length < 8) {
      throw new Error('PASSWORD_TOO_SHORT');
    }
    if (this.emailIndex.has(normalizedEmail)) {
      throw new Error('EMAIL_EXISTS');
    }
    if (this.usernameIndex.has(normalizedUsername)) {
      throw new Error('USERNAME_EXISTS');
    }

    const id = crypto.randomUUID();
    const { hash, salt } = hashPassword(input.password);
    const now = new Date().toISOString();
    const verificationToken = crypto.randomBytes(20).toString('hex');

    const user: StoredUser = {
      id,
      username: normalizedUsername,
      displayName: input.displayName.trim().slice(0, 48) || normalizedUsername,
      email: normalizedEmail,
      avatarUrl: null,
      xp: 0,
      level: 1,
      totalGamesPlayed: 0,
      wins: 0,
      subscriptionStatus: 'free',
      preferredLanguage: input.preferredLanguage === 'fr' ? 'fr' : 'en',
      isPublicProfile: true,
      isSuspended: false,
      role: null,
      lastActiveAt: now,
      createdAt: now,
      passwordHash: hash,
      passwordSalt: salt,
      emailVerified: false,
      verificationToken,
      resetToken: null,
      resetTokenExpiresAt: null,
    };

    this.users.set(id, user);
    this.emailIndex.set(normalizedEmail, id);
    this.usernameIndex.set(normalizedUsername, id);

    this.pushNotification(id, {
      type: 'system',
      titleEn: 'Welcome to PLAYROOM',
      titleFr: 'Bienvenue sur PLAYROOM',
      bodyEn: 'Your profile is ready. Play your first match or join a multiplayer room.',
      bodyFr: 'Votre profil est prêt. Lancez une première partie ou rejoignez un salon multijoueur.',
      actionUrl: '/games',
    });

    return {
      user: this.sanitizeOwnUser(user),
      token: this.signToken(id),
      verificationToken,
    };
  }

  loginUser(email: string, password: string): { user: UserProfile; token: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const userId = this.emailIndex.get(normalizedEmail);
    if (!userId) {
      throw new Error('INVALID_CREDENTIALS');
    }
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }
    if (user.isSuspended) {
      throw new Error('ACCOUNT_SUSPENDED');
    }
    if (!verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      throw new Error('INVALID_CREDENTIALS');
    }
    user.lastActiveAt = new Date().toISOString();
    return {
      user: this.sanitizeOwnUser(user),
      token: this.signToken(user.id),
    };
  }

  requestPasswordReset(email: string): { resetToken: string | null } {
    const userId = this.emailIndex.get(email.trim().toLowerCase());
    if (!userId) return { resetToken: null };
    const user = this.users.get(userId);
    if (!user) return { resetToken: null };
    const token = crypto.randomBytes(24).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiresAt = Date.now() + 30 * 60 * 1000;
    return { resetToken: token };
  }

  resetPassword(token: string, newPassword: string): boolean {
    if (newPassword.length < 8) {
      throw new Error('PASSWORD_TOO_SHORT');
    }
    for (const user of this.users.values()) {
      if (user.resetToken === token && user.resetTokenExpiresAt && user.resetTokenExpiresAt > Date.now()) {
        const { hash, salt } = hashPassword(newPassword);
        user.passwordHash = hash;
        user.passwordSalt = salt;
        user.resetToken = null;
        user.resetTokenExpiresAt = null;
        return true;
      }
    }
    return false;
  }

  hasAnyAdmin(): boolean {
    for (const user of this.users.values()) {
      if (user.role === 'admin' || user.role === 'super_admin') return true;
    }
    return false;
  }

  claimAdminRole(userId: string, passcode?: string): UserProfile {
    const user = this.users.get(userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    if (envConfig.adminClaimPasscode) {
      if (!passcode || passcode !== envConfig.adminClaimPasscode) {
        throw new Error('INVALID_ADMIN_PASSCODE');
      }
      user.role = 'super_admin';
      return this.sanitizeOwnUser(user);
    }

    if (this.hasAnyAdmin()) {
      throw new Error('ADMIN_ALREADY_CLAIMED');
    }
    user.role = 'super_admin';
    return this.sanitizeOwnUser(user);
  }

  // ============================================================================
  // XP, LEVELS, ACHIEVEMENTS, CHALLENGES & LEADERBOARDS
  // ============================================================================
  awardMatchOutcome(params: {
    userId: string;
    gameSlug: GameSlug;
    mode: 'solo' | 'multiplayer' | 'daily';
    difficulty: Difficulty;
    sessionId: string;
    score: number;
    isWinner: boolean;
    accuracyRatio?: number;
  }): { xpEarned: number; newLevel: number; leveledUp: boolean; unlockedAchievements: string[] } {
    const user = this.users.get(params.userId);
    if (!user) {
      return { xpEarned: 0, newLevel: 1, leveledUp: false, unlockedAchievements: [] };
    }

    const game = GAME_CATALOG.find((g) => g.slug === params.gameSlug);
    const baseXp = game?.baseXp ?? 50;
    const scoreXp = Math.round(params.score / 10);
    const winBonus = params.isWinner ? 35 : 0;
    const xpEarned = Math.max(15, baseXp + scoreXp + winBonus);

    const prevLevel = user.level;
    user.xp += xpEarned;
    user.level = computeLevelFromXp(user.xp);
    user.totalGamesPlayed += 1;
    if (params.isWinner) user.wins += 1;
    user.lastActiveAt = new Date().toISOString();

    const leveledUp = user.level > prevLevel;
    if (leveledUp) {
      this.pushNotification(user.id, {
        type: 'level_up',
        titleEn: `Level ${user.level} Reached`,
        titleFr: `Niveau ${user.level} atteint`,
        bodyEn: `You advanced to Level ${user.level} with ${user.xp} total XP.`,
        bodyFr: `Vous avez atteint le niveau ${user.level} avec ${user.xp} XP.`,
        actionUrl: '/profile',
      });
    }

    // Record history
    this.gameHistory.unshift({
      userId: user.id,
      sessionId: params.sessionId,
      gameSlug: params.gameSlug,
      mode: params.mode,
      difficulty: params.difficulty,
      score: params.score,
      xpEarned,
      isWinner: params.isWinner,
      completedAt: new Date().toISOString(),
    });

    // Update leaderboards across all periods
    const periods = getUtcPeriodKeys();
    (['daily', 'weekly', 'monthly', 'all_time'] as const).forEach((periodType) => {
      const periodKey = periods[periodType];
      for (const slugKey of ['all', params.gameSlug]) {
        const key = `${user.id}:${slugKey}:${periodType}:${periodKey}`;
        const existing = this.leaderboardScores.get(key);
        if (existing) {
          existing.score += params.score;
          existing.wins += params.isWinner ? 1 : 0;
        } else {
          this.leaderboardScores.set(key, {
            userId: user.id,
            gameSlug: slugKey,
            periodType,
            periodKey,
            score: params.score,
            wins: params.isWinner ? 1 : 0,
          });
        }
      }
    });

    // Update today's Daily Challenge if applicable
    const todayChallenge = this.ensureTodayChallenge();
    let completedDaily = false;
    if (
      todayChallenge.gameSlug === params.gameSlug &&
      (params.mode === 'daily' || params.score >= todayChallenge.targetScore)
    ) {
      const chKey = `${user.id}:${todayChallenge.id}`;
      const prev = this.userChallengeProgress.get(chKey) || { bestScore: 0, completedAt: null };
      const bestScore = Math.max(prev.bestScore, params.score);
      const justCompleted = !prev.completedAt && params.score >= todayChallenge.targetScore;
      const completedAt = prev.completedAt || (justCompleted ? new Date().toISOString() : null);
      this.userChallengeProgress.set(chKey, { bestScore, completedAt });
      if (justCompleted) {
        completedDaily = true;
        user.xp += todayChallenge.xpReward;
        user.level = computeLevelFromXp(user.xp);
      }
    }

    // Check Achievements
    const unlockedAchievements: string[] = [];
    const tryUnlock = (code: string) => {
      const ach = this.achievements.find((a) => a.code === code);
      if (!ach) return;
      if (ach.isPlusExclusive && user.subscriptionStatus !== 'plus') return;
      let userMap = this.userAchievements.get(user.id);
      if (!userMap) {
        userMap = new Map();
        this.userAchievements.set(user.id, userMap);
      }
      if (!userMap.has(ach.id)) {
        userMap.set(ach.id, new Date().toISOString());
        user.xp += ach.xpReward;
        user.level = computeLevelFromXp(user.xp);
        unlockedAchievements.push(ach.titleEn);
        this.pushNotification(user.id, {
          type: 'achievement',
          titleEn: `Achievement Unlocked: ${ach.titleEn}`,
          titleFr: `Succès débloqué : ${ach.titleFr}`,
          bodyEn: `${ach.descriptionEn} (+${ach.xpReward} XP)`,
          bodyFr: `${ach.descriptionFr} (+${ach.xpReward} XP)`,
          actionUrl: '/achievements',
        });
      }
    };

    if (user.totalGamesPlayed >= 1) tryUnlock('first_game');
    if (user.wins >= 1) tryUnlock('first_victory');
    if (user.totalGamesPlayed >= 10) tryUnlock('ten_games');
    if (completedDaily) tryUnlock('daily_master');
    if (params.mode === 'multiplayer' && params.isWinner) tryUnlock('multiplayer_champion');
    if (
      (params.gameSlug === 'brain-test' || params.gameSlug === 'mystery-room') &&
      (params.accuracyRatio ?? 0) >= 0.85
    ) {
      tryUnlock('puzzle_master');
    }
    if (user.subscriptionStatus === 'plus' && params.difficulty === 'hard' && params.isWinner) {
      tryUnlock('plus_elite');
    }

    return {
      xpEarned,
      newLevel: user.level,
      leveledUp,
      unlockedAchievements,
    };
  }

  getLeaderboard(periodType: 'daily' | 'weekly' | 'monthly' | 'all_time', gameSlug = 'all'): LeaderboardEntry[] {
    const periods = getUtcPeriodKeys();
    const targetKey = periods[periodType];
    const items: LeaderboardEntry[] = [];

    for (const rec of this.leaderboardScores.values()) {
      if (rec.periodType === periodType && rec.periodKey === targetKey && rec.gameSlug === gameSlug) {
        const user = this.users.get(rec.userId);
        if (!user || user.isSuspended || !user.isPublicProfile) continue;
        items.push({
          rank: 0,
          userId: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          level: user.level,
          subscriptionStatus: user.subscriptionStatus,
          score: rec.score,
          wins: rec.wins,
        });
      }
    }

    items.sort((a, b) => b.score - a.score || b.wins - a.wins);
    return items.slice(0, 50).map((item, idx) => ({ ...item, rank: idx + 1 }));
  }

  getUserAchievements(userId: string): AchievementItem[] {
    const unlockedMap = this.userAchievements.get(userId);
    return this.achievements.map((a) => ({
      ...a,
      unlockedAt: unlockedMap?.get(a.id) ?? null,
    }));
  }

  getDailyChallengeForUser(userId: string): DailyChallengeItem {
    const c = this.ensureTodayChallenge();
    const prog = this.userChallengeProgress.get(`${userId}:${c.id}`);
    return {
      ...c,
      bestScore: prog?.bestScore ?? 0,
      completedAt: prog?.completedAt ?? null,
    };
  }

  // ============================================================================
  // SOLO GAME ENGINES (SERVER-AUTHORITATIVE)
  // ============================================================================
  startQuizSession(params: {
    userId: string;
    category?: QuizCategory | 'mixed';
    difficulty: Difficulty;
    mode?: 'solo' | 'daily';
  }): { sessionId: string; questions: QuizQuestionPublic[]; timePerQuestionSec: number } {
    const pool = this.quizQuestions.filter((q) => {
      if (!q.isActive) return false;
      const catMatch = !params.category || params.category === 'mixed' || q.category === params.category;
      const diffMatch = q.difficulty === params.difficulty;
      return catMatch && diffMatch;
    });

    const fallbackPool =
      pool.length >= 5
        ? pool
        : this.quizQuestions.filter(
            (q) =>
              q.isActive &&
              (!params.category || params.category === 'mixed' || q.category === params.category)
          );

    const selected = [...(fallbackPool.length >= 5 ? fallbackPool : this.quizQuestions.filter((q) => q.isActive))]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    const sessionId = crypto.randomUUID();
    this.soloSessions.set(sessionId, {
      id: sessionId,
      userId: params.userId,
      gameSlug: 'quiz-battle',
      mode: params.mode || 'solo',
      difficulty: params.difficulty,
      language: 'en',
      startedAt: Date.now(),
      completedAt: null,
      score: 0,
      xpEarned: 0,
      quizQuestionIds: selected.map((q) => q.id),
      quizSubmittedRounds: new Set(),
      quizResults: [],
    });

    // Sanitize: never send correctOptionIndex or explanation beforehand
    const publicQuestions: QuizQuestionPublic[] = selected.map((q) => ({
      id: q.id,
      category: q.category,
      difficulty: q.difficulty,
      promptEn: q.promptEn,
      promptFr: q.promptFr,
      optionsEn: q.optionsEn,
      optionsFr: q.optionsFr,
    }));

    return {
      sessionId,
      questions: publicQuestions,
      timePerQuestionSec: params.difficulty === 'hard' ? 15 : params.difficulty === 'medium' ? 20 : 25,
    };
  }

  submitQuizAnswer(params: {
    sessionId: string;
    userId: string;
    roundIndex: number;
    selectedIndex: number;
    responseMs: number;
  }): {
    isCorrect: boolean;
    correctOptionIndex: number;
    explanationEn: string;
    explanationFr: string;
    pointsAwarded: number;
    totalScore: number;
    isComplete: boolean;
    outcome?: { xpEarned: number; newLevel: number; leveledUp: boolean; unlockedAchievements: string[] };
  } {
    const session = this.soloSessions.get(params.sessionId);
    if (!session || session.userId !== params.userId || session.gameSlug !== 'quiz-battle') {
      throw new Error('SESSION_NOT_FOUND');
    }
    if (!session.quizQuestionIds || !session.quizSubmittedRounds || !session.quizResults) {
      throw new Error('INVALID_SESSION_STATE');
    }
    if (params.roundIndex < 0 || params.roundIndex >= session.quizQuestionIds.length) {
      throw new Error('INVALID_ROUND');
    }
    if (session.quizSubmittedRounds.has(params.roundIndex)) {
      throw new Error('DUPLICATE_SUBMISSION');
    }

    const qId = session.quizQuestionIds[params.roundIndex];
    const question = this.quizQuestions.find((q) => q.id === qId);
    if (!question) throw new Error('QUESTION_NOT_FOUND');

    session.quizSubmittedRounds.add(params.roundIndex);
    const isCorrect = params.selectedIndex === question.correctOptionIndex;
    const maxTimeMs = (session.difficulty === 'hard' ? 15 : session.difficulty === 'medium' ? 20 : 25) * 1000;
    const pointsAwarded = calculateQuizRoundPoints({
      isCorrect,
      difficulty: session.difficulty,
      responseMs: params.responseMs,
      maxTimeMs,
    });

    session.score += pointsAwarded;
    session.quizResults.push({ roundIndex: params.roundIndex, isCorrect, points: pointsAwarded });

    const isComplete = session.quizSubmittedRounds.size >= session.quizQuestionIds.length;
    let outcome;
    if (isComplete && !session.completedAt) {
      session.completedAt = new Date().toISOString();
      const correctCount = session.quizResults.filter((r) => r.isCorrect).length;
      outcome = this.awardMatchOutcome({
        userId: params.userId,
        gameSlug: 'quiz-battle',
        mode: session.mode,
        difficulty: session.difficulty,
        sessionId: session.id,
        score: session.score,
        isWinner: correctCount >= 3,
        accuracyRatio: correctCount / session.quizQuestionIds.length,
      });
      session.xpEarned = outcome.xpEarned;
    }

    return {
      isCorrect,
      correctOptionIndex: question.correctOptionIndex,
      explanationEn: question.explanationEn,
      explanationFr: question.explanationFr,
      pointsAwarded,
      totalScore: session.score,
      isComplete,
      outcome,
    };
  }

  // WORD CHALLENGE
  startWordSession(params: {
    userId: string;
    difficulty: Difficulty;
    language: Language;
    isDaily?: boolean;
  }): { sessionId: string; puzzle: WordPuzzlePublic } {
    const candidates = this.wordBank.filter((w) => w.difficulty === params.difficulty);
    const pool = candidates.length > 0 ? candidates : this.wordBank;

    let entry: WordEntry;
    if (params.isDaily) {
      const { daily } = getUtcPeriodKeys();
      const idx = Number(daily.replace(/-/g, '')) % this.wordBank.length;
      entry = this.wordBank[idx];
    } else {
      entry = pool[Math.floor(Math.random() * pool.length)];
    }

    const target = (params.language === 'fr' ? entry.wordFr : entry.wordEn).toUpperCase();
    const sessionId = crypto.randomUUID();
    this.soloSessions.set(sessionId, {
      id: sessionId,
      userId: params.userId,
      gameSlug: 'word-challenge',
      mode: params.isDaily ? 'daily' : 'solo',
      difficulty: entry.difficulty,
      language: params.language,
      startedAt: Date.now(),
      completedAt: null,
      score: 0,
      xpEarned: 0,
      wordEntryId: entry.id,
      wordTarget: target,
      wordAttempts: [],
      wordHintsUsed: 0,
      wordSolved: false,
    });

    return {
      sessionId,
      puzzle: {
        id: entry.id,
        difficulty: entry.difficulty,
        length: target.length,
        maxAttempts: 6,
        categoryEn: entry.categoryEn,
        categoryFr: entry.categoryFr,
        hintEn: entry.hintEn,
        hintFr: entry.hintFr,
        firstLetter: target[0],
        isDaily: params.isDaily,
      },
    };
  }

  submitWordGuess(params: {
    sessionId: string;
    userId: string;
    guess: string;
    hintsUsed?: number;
  }): {
    feedback: ('correct' | 'present' | 'absent')[];
    solved: boolean;
    gameOver: boolean;
    targetWord?: string;
    score: number;
    outcome?: { xpEarned: number; newLevel: number; leveledUp: boolean; unlockedAchievements: string[] };
  } {
    const session = this.soloSessions.get(params.sessionId);
    if (!session || session.userId !== params.userId || session.gameSlug !== 'word-challenge' || !session.wordTarget) {
      throw new Error('SESSION_NOT_FOUND');
    }
    if (session.completedAt) {
      throw new Error('SESSION_ALREADY_COMPLETED');
    }

    const target = session.wordTarget;
    const guess = params.guess.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (guess.length !== target.length) {
      throw new Error('INVALID_GUESS_LENGTH');
    }

    session.wordAttempts = session.wordAttempts || [];
    session.wordAttempts.push(guess);
    session.wordHintsUsed = Math.max(session.wordHintsUsed || 0, params.hintsUsed || 0);

    // Evaluate Wordle-style exact + present counts accurately
    const feedback: ('correct' | 'present' | 'absent')[] = new Array(target.length).fill('absent');
    const remainingCounts: Record<string, number> = {};

    for (let i = 0; i < target.length; i++) {
      if (guess[i] === target[i]) {
        feedback[i] = 'correct';
      } else {
        remainingCounts[target[i]] = (remainingCounts[target[i]] || 0) + 1;
      }
    }
    for (let i = 0; i < target.length; i++) {
      if (feedback[i] !== 'correct' && (remainingCounts[guess[i]] || 0) > 0) {
        feedback[i] = 'present';
        remainingCounts[guess[i]] -= 1;
      }
    }

    const solved = guess === target;
    const maxAttempts = 6;
    const gameOver = solved || session.wordAttempts.length >= maxAttempts;

    let outcome;
    if (gameOver) {
      session.wordSolved = solved;
      session.completedAt = new Date().toISOString();
      const elapsedSeconds = Math.round((Date.now() - session.startedAt) / 1000);
      session.score = calculateWordChallengeScore({
        solved,
        attemptsUsed: session.wordAttempts.length,
        maxAttempts,
        hintsUsed: session.wordHintsUsed,
        elapsedSeconds,
        difficulty: session.difficulty,
      });
      outcome = this.awardMatchOutcome({
        userId: params.userId,
        gameSlug: 'word-challenge',
        mode: session.mode,
        difficulty: session.difficulty,
        sessionId: session.id,
        score: session.score,
        isWinner: solved,
        accuracyRatio: solved ? 1 : 0,
      });
      session.xpEarned = outcome.xpEarned;
    }

    return {
      feedback,
      solved,
      gameOver,
      targetWord: gameOver ? target : undefined,
      score: session.score,
      outcome,
    };
  }

  // BRAIN TEST
  startBrainSession(params: {
    userId: string;
    difficulty: Difficulty;
  }): { sessionId: string; puzzles: BrainPuzzlePublic[] } {
    const pool = this.brainPuzzles.filter((p) => p.difficulty === params.difficulty);
    const selected = [...(pool.length >= 5 ? pool : this.brainPuzzles)]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    const sessionId = crypto.randomUUID();
    this.soloSessions.set(sessionId, {
      id: sessionId,
      userId: params.userId,
      gameSlug: 'brain-test',
      mode: 'solo',
      difficulty: params.difficulty,
      language: 'en',
      startedAt: Date.now(),
      completedAt: null,
      score: 0,
      xpEarned: 0,
      brainPuzzleIds: selected.map((p) => p.id),
      brainSubmittedIndices: new Set(),
      brainCorrectCount: 0,
      brainHintsUsed: 0,
    });

    const publicPuzzles: BrainPuzzlePublic[] = selected.map((p) => ({
      id: p.id,
      type: p.type,
      difficulty: p.difficulty,
      promptEn: p.promptEn,
      promptFr: p.promptFr,
      visualData: p.visualData,
      options: p.options,
      hintEn: p.hintEn,
      hintFr: p.hintFr,
    }));

    return { sessionId, puzzles: publicPuzzles };
  }

  submitBrainAnswer(params: {
    sessionId: string;
    userId: string;
    puzzleIndex: number;
    selectedIndex: number;
    usedHint?: boolean;
  }): {
    isCorrect: boolean;
    correctIndex: number;
    isComplete: boolean;
    score: number;
    correctCount: number;
    outcome?: { xpEarned: number; newLevel: number; leveledUp: boolean; unlockedAchievements: string[] };
  } {
    const session = this.soloSessions.get(params.sessionId);
    if (!session || session.userId !== params.userId || session.gameSlug !== 'brain-test') {
      throw new Error('SESSION_NOT_FOUND');
    }
    if (!session.brainPuzzleIds || !session.brainSubmittedIndices) {
      throw new Error('INVALID_SESSION_STATE');
    }
    if (params.puzzleIndex < 0 || params.puzzleIndex >= session.brainPuzzleIds.length) {
      throw new Error('INVALID_ROUND');
    }
    if (session.brainSubmittedIndices.has(params.puzzleIndex)) {
      throw new Error('DUPLICATE_SUBMISSION');
    }

    const puzzle = this.brainPuzzles.find((p) => p.id === session.brainPuzzleIds![params.puzzleIndex]);
    if (!puzzle) throw new Error('PUZZLE_NOT_FOUND');

    session.brainSubmittedIndices.add(params.puzzleIndex);
    if (params.usedHint) session.brainHintsUsed = (session.brainHintsUsed || 0) + 1;
    const isCorrect = params.selectedIndex === puzzle.correctIndex;
    if (isCorrect) session.brainCorrectCount = (session.brainCorrectCount || 0) + 1;

    const isComplete = session.brainSubmittedIndices.size >= session.brainPuzzleIds.length;
    let outcome;
    if (isComplete && !session.completedAt) {
      session.completedAt = new Date().toISOString();
      const elapsedSeconds = Math.round((Date.now() - session.startedAt) / 1000);
      session.score = calculateBrainTestScore({
        correctCount: session.brainCorrectCount || 0,
        totalCount: session.brainPuzzleIds.length,
        hintsUsed: session.brainHintsUsed || 0,
        elapsedSeconds,
        difficulty: session.difficulty,
      });
      const accuracy = (session.brainCorrectCount || 0) / session.brainPuzzleIds.length;
      outcome = this.awardMatchOutcome({
        userId: params.userId,
        gameSlug: 'brain-test',
        mode: 'solo',
        difficulty: session.difficulty,
        sessionId: session.id,
        score: session.score,
        isWinner: accuracy >= 0.6,
        accuracyRatio: accuracy,
      });
      session.xpEarned = outcome.xpEarned;
    }

    return {
      isCorrect,
      correctIndex: puzzle.correctIndex,
      isComplete,
      score: session.score,
      correctCount: session.brainCorrectCount || 0,
      outcome,
    };
  }

  // MYSTERY ROOM
  listMysteryScenarios(): MysteryScenarioPublic[] {
    return this.mysteryScenarios.map((s) => ({
      id: s.id,
      slug: s.slug,
      difficulty: s.difficulty,
      titleEn: s.titleEn,
      titleFr: s.titleFr,
      introEn: s.introEn,
      introFr: s.introFr,
      locationEn: s.locationEn,
      locationFr: s.locationFr,
      isPlusOnly: s.isPlusOnly,
      clues: s.clues.map((c) => ({
        ...c,
        detailEn: c.unlockedByDefault ? c.detailEn : '',
        detailFr: c.unlockedByDefault ? c.detailFr : '',
      })),
      suspects: s.suspects,
      questions: s.questions.map((q) => ({
        id: q.id,
        promptEn: q.promptEn,
        promptFr: q.promptFr,
        optionsEn: q.optionsEn,
        optionsFr: q.optionsFr,
      })),
    }));
  }

  startMysterySession(params: { userId: string; scenarioId: string }): {
    sessionId: string;
    scenario: MysteryScenarioPublic;
  } {
    const scenario = this.mysteryScenarios.find((s) => s.id === params.scenarioId);
    if (!scenario) throw new Error('SCENARIO_NOT_FOUND');

    const user = this.users.get(params.userId);
    if (scenario.isPlusOnly && user?.subscriptionStatus !== 'plus') {
      throw new Error('PLUS_REQUIRED');
    }

    const unlocked = new Set<string>();
    scenario.clues.forEach((c) => {
      if (c.unlockedByDefault) unlocked.add(c.id);
    });

    const sessionId = crypto.randomUUID();
    this.soloSessions.set(sessionId, {
      id: sessionId,
      userId: params.userId,
      gameSlug: 'mystery-room',
      mode: 'solo',
      difficulty: scenario.difficulty,
      language: 'en',
      startedAt: Date.now(),
      completedAt: null,
      score: 0,
      xpEarned: 0,
      mysteryScenarioId: scenario.id,
      mysteryUnlockedClues: unlocked,
    });

    const sanitized: MysteryScenarioPublic = {
      id: scenario.id,
      slug: scenario.slug,
      difficulty: scenario.difficulty,
      titleEn: scenario.titleEn,
      titleFr: scenario.titleFr,
      introEn: scenario.introEn,
      introFr: scenario.introFr,
      locationEn: scenario.locationEn,
      locationFr: scenario.locationFr,
      isPlusOnly: scenario.isPlusOnly,
      clues: scenario.clues.map((c) => ({
        ...c,
        detailEn: unlocked.has(c.id) ? c.detailEn : '',
        detailFr: unlocked.has(c.id) ? c.detailFr : '',
      })),
      suspects: scenario.suspects,
      questions: scenario.questions.map((q) => ({
        id: q.id,
        promptEn: q.promptEn,
        promptFr: q.promptFr,
        optionsEn: q.optionsEn,
        optionsFr: q.optionsFr,
      })),
    };

    return { sessionId, scenario: sanitized };
  }

  inspectMysteryClue(params: { sessionId: string; userId: string; clueId: string }): {
    clueId: string;
    detailEn: string;
    detailFr: string;
  } {
    const session = this.soloSessions.get(params.sessionId);
    if (!session || session.userId !== params.userId || !session.mysteryScenarioId) {
      throw new Error('SESSION_NOT_FOUND');
    }
    const scenario = this.mysteryScenarios.find((s) => s.id === session.mysteryScenarioId);
    const clue = scenario?.clues.find((c) => c.id === params.clueId);
    if (!clue) throw new Error('CLUE_NOT_FOUND');
    session.mysteryUnlockedClues?.add(clue.id);
    return { clueId: clue.id, detailEn: clue.detailEn, detailFr: clue.detailFr };
  }

  submitMysterySolution(params: {
    sessionId: string;
    userId: string;
    questionAnswers: Record<string, number>;
    accusedSuspectId: string;
  }): {
    solvedCulprit: boolean;
    culpritId: string;
    correctDeductions: number;
    totalQuestions: number;
    resolutionEn: string;
    resolutionFr: string;
    score: number;
    outcome: { xpEarned: number; newLevel: number; leveledUp: boolean; unlockedAchievements: string[] };
  } {
    const session = this.soloSessions.get(params.sessionId);
    if (!session || session.userId !== params.userId || !session.mysteryScenarioId) {
      throw new Error('SESSION_NOT_FOUND');
    }
    if (session.completedAt) {
      throw new Error('SESSION_ALREADY_COMPLETED');
    }
    const scenario = this.mysteryScenarios.find((s) => s.id === session.mysteryScenarioId);
    if (!scenario) throw new Error('SCENARIO_NOT_FOUND');

    let correctDeductions = 0;
    for (const q of scenario.questions) {
      if (params.questionAnswers[q.id] === q.correctIndex) {
        correctDeductions += 1;
      }
    }
    const solvedCulprit = params.accusedSuspectId === scenario.culpritId;
    const cluesInspected = session.mysteryUnlockedClues?.size || 1;
    const score = calculateMysteryScore({
      correctDeductions,
      totalQuestions: scenario.questions.length,
      solvedCulprit,
      cluesInspected,
      difficulty: scenario.difficulty,
    });

    session.score = score;
    session.completedAt = new Date().toISOString();
    const accuracyRatio =
      (correctDeductions + (solvedCulprit ? 1 : 0)) / (scenario.questions.length + 1);

    const outcome = this.awardMatchOutcome({
      userId: params.userId,
      gameSlug: 'mystery-room',
      mode: 'solo',
      difficulty: scenario.difficulty,
      sessionId: session.id,
      score,
      isWinner: solvedCulprit,
      accuracyRatio,
    });
    session.xpEarned = outcome.xpEarned;

    return {
      solvedCulprit,
      culpritId: scenario.culpritId,
      correctDeductions,
      totalQuestions: scenario.questions.length,
      resolutionEn: scenario.resolutionEn,
      resolutionFr: scenario.resolutionFr,
      score,
      outcome,
    };
  }

  // ============================================================================
  // MULTIPLAYER ROOMS
  // ============================================================================
  createRoom(params: {
    hostId: string;
    gameSlug: GameSlug;
    difficulty: Difficulty;
    maxPlayers: number;
    isPrivate: boolean;
  }): Room {
    const host = this.users.get(params.hostId);
    if (!host) throw new Error('USER_NOT_FOUND');

    const { daily } = getUtcPeriodKeys();
    const dailyKey = `${host.id}:${daily}`;
    const createdToday = this.dailyPrivateRoomsCreated.get(dailyKey) || 0;

    // Subscription restriction: FREE users limited to 2 private rooms/day and max 4 players
    if (host.subscriptionStatus !== 'plus') {
      if (params.isPrivate && createdToday >= 2) {
        throw new Error('FREE_PRIVATE_ROOM_LIMIT');
      }
      if (params.maxPlayers > 4) {
        throw new Error('PLUS_REQUIRED_MAX_PLAYERS');
      }
    }

    if (params.isPrivate) {
      this.dailyPrivateRoomsCreated.set(dailyKey, createdToday + 1);
    }

    let code = '';
    do {
      code = crypto.randomBytes(3).toString('hex').toUpperCase();
    } while (this.roomCodeIndex.has(code));

    const room: Room = {
      id: crypto.randomUUID(),
      code,
      hostId: host.id,
      gameSlug: params.gameSlug,
      difficulty: params.difficulty,
      maxPlayers: Math.min(12, Math.max(2, params.maxPlayers)),
      isPrivate: params.isPrivate,
      status: 'lobby',
      players: [
        {
          userId: host.id,
          username: host.username,
          displayName: host.displayName,
          avatarUrl: host.avatarUrl,
          level: host.level,
          isReady: true,
          isConnected: true,
          score: 0,
        },
      ],
      currentSessionId: null,
      createdAt: new Date().toISOString(),
    };

    this.rooms.set(room.id, room);
    this.roomCodeIndex.set(room.code, room.id);
    return room;
  }

  getRoomByCode(code: string): Room | null {
    const roomId = this.roomCodeIndex.get(code.trim().toUpperCase());
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }

  joinRoomByCode(code: string, userId: string): Room {
    const room = this.getRoomByCode(code);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.status === 'closed') throw new Error('ROOM_CLOSED');
    const user = this.users.get(userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    const existing = room.players.find((p) => p.userId === userId);
    if (existing) {
      existing.isConnected = true;
      return room;
    }

    if (room.status !== 'lobby') throw new Error('ROOM_ALREADY_STARTED');
    if (room.players.length >= room.maxPlayers) throw new Error('ROOM_FULL');

    room.players.push({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      level: user.level,
      isReady: false,
      isConnected: true,
      score: 0,
    });
    return room;
  }

  leaveRoom(code: string, userId: string): Room | null {
    const room = this.getRoomByCode(code);
    if (!room) return null;
    room.players = room.players.filter((p) => p.userId !== userId);
    if (room.players.length === 0) {
      room.status = 'closed';
      return room;
    }
    if (room.hostId === userId) {
      room.hostId = room.players[0].userId;
      room.players[0].isReady = true;
    }
    return room;
  }

  // ============================================================================
  // SOCIAL, FRIENDS & NOTIFICATIONS
  // ============================================================================
  pushNotification(
    userId: string,
    input: Omit<AppNotification, 'id' | 'userId' | 'isRead' | 'createdAt'>
  ): AppNotification {
    const notif: AppNotification = {
      id: crypto.randomUUID(),
      userId,
      ...input,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const list = this.notifications.get(userId) || [];
    list.unshift(notif);
    this.notifications.set(userId, list.slice(0, 50));
    return notif;
  }

  getFriendPairKey(a: string, b: string): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  getFriendsList(userId: string): PublicProfile[] {
    const friends: PublicProfile[] = [];
    for (const pair of this.friendPairs) {
      const [a, b] = pair.split(':');
      if (a === userId || b === userId) {
        const peerId = a === userId ? b : a;
        const peer = this.users.get(peerId);
        if (peer && !peer.isSuspended) {
          friends.push(this.sanitizePublicProfile(peer));
        }
      }
    }
    return friends;
  }

  getFriendRequestsForUser(userId: string): { incoming: FriendRequestItem[]; outgoing: FriendRequestItem[] } {
    const incoming: FriendRequestItem[] = [];
    const outgoing: FriendRequestItem[] = [];
    for (const req of this.friendRequests.values()) {
      if (req.status !== 'pending') continue;
      if (req.receiverId === userId) {
        const sender = this.users.get(req.senderId);
        if (sender) incoming.push({ ...req, peer: this.sanitizePublicProfile(sender) });
      } else if (req.senderId === userId) {
        const receiver = this.users.get(req.receiverId);
        if (receiver) outgoing.push({ ...req, peer: this.sanitizePublicProfile(receiver) });
      }
    }
    return { incoming, outgoing };
  }

  // ============================================================================
  // SUBSCRIPTIONS & PAYMENTS (USD INTEGER CENTS, SERVER-VERIFIED ONLY)
  // ============================================================================
  syncSubscriptionExpiration(userId: string): SubscriptionRecord | null {
    const sub = this.subscriptions.get(userId);
    const user = this.users.get(userId);
    if (!sub || !user) return null;

    if (
      sub.expiresAt &&
      sub.status !== 'expired' &&
      new Date(sub.expiresAt).getTime() <= Date.now()
    ) {
      sub.status = 'expired';
      sub.renewsAt = null;
      user.subscriptionStatus = 'expired';
    }
    return sub;
  }

  activatePlusSubscription(
    userId: string,
    planId: string,
    options?: {
      provider?: string;
      providerSubscriptionId?: string | null;
      renewsAt?: string | null;
      paymentReference?: string;
    }
  ): SubscriptionRecord {
    const user = this.users.get(userId);
    const plan = this.subscriptionPlans.find((p) => p.id === planId);
    if (!user || !plan) throw new Error('SUBSCRIPTION_TARGET_NOT_FOUND');

    const billingInterval = plan.intervalUnit === 'year' ? 'year' : 'month';
    const durationDays = billingInterval === 'year' ? 365 : 30;
    const now = new Date();
    const defaultNextBilling = new Date(
      now.getTime() + durationDays * 24 * 60 * 60 * 1000
    ).toISOString();
    const nextBilling = options?.renewsAt || defaultNextBilling;

    const existing = this.subscriptions.get(userId);
    const record: SubscriptionRecord = {
      id: existing?.id || crypto.randomUUID(),
      userId,
      planId: plan.id,
      planCode: plan.code,
      billingInterval,
      amountCents: plan.priceCents,
      currency: plan.currency,
      provider: options?.provider || envConfig.paymentProvider,
      providerSubscriptionId:
        options?.providerSubscriptionId || existing?.providerSubscriptionId || null,
      status: 'active',
      startedAt: existing?.startedAt || now.toISOString(),
      expiresAt: nextBilling,
      renewsAt: nextBilling,
      cancelledAt: null,
    };
    this.subscriptions.set(userId, record);
    user.subscriptionStatus = 'plus';

    if (options?.paymentReference) {
      const payment = this.payments.get(options.paymentReference);
      if (payment) {
        payment.subscriptionId = record.id;
      }
    }

    this.pushNotification(userId, {
      type: 'payment',
      titleEn: 'PLAYROOM PLUS Activated',
      titleFr: 'PLAYROOM PLUS activé',
      bodyEn:
        billingInterval === 'year'
          ? 'Your verified annual PLAYROOM PLUS membership is now active.'
          : 'Your verified monthly PLAYROOM PLUS membership is now active.',
      bodyFr:
        billingInterval === 'year'
          ? 'Votre abonnement annuel vérifié PLAYROOM PLUS est maintenant actif.'
          : 'Votre abonnement mensuel vérifié PLAYROOM PLUS est maintenant actif.',
      actionUrl: '/subscription',
    });

    return record;
  }

  findSubscriptionByProviderId(providerSubscriptionId: string): SubscriptionRecord | null {
    for (const sub of this.subscriptions.values()) {
      if (sub.providerSubscriptionId === providerSubscriptionId) {
        return sub;
      }
    }
    return null;
  }

  handlePaymentFailure(params: {
    reference?: string | null;
    providerSubscriptionId?: string | null;
    failureReason?: string | null;
  }): void {
    let targetUserId: string | null = null;

    if (params.reference) {
      const payment = this.payments.get(params.reference);
      if (payment) {
        payment.status = 'failed';
        payment.failureReason = params.failureReason || 'Payment declined or incomplete';
        targetUserId = payment.userId;
      }
    }

    if (params.providerSubscriptionId) {
      const sub = this.findSubscriptionByProviderId(params.providerSubscriptionId);
      if (sub) {
        sub.status = 'past_due';
        const user = this.users.get(sub.userId);
        if (user) {
          user.subscriptionStatus = 'past_due';
        }
        targetUserId = sub.userId;
      }
    }

    if (targetUserId) {
      this.pushNotification(targetUserId, {
        type: 'payment',
        titleEn: 'Payment Action Required',
        titleFr: 'Échec de paiement',
        bodyEn:
          params.failureReason ||
          'We could not process your recent subscription payment. Please check your billing details.',
        bodyFr:
          params.failureReason ||
          'Votre paiement d’abonnement n’a pas pu être validé. Veuillez vérifier votre moyen de paiement.',
        actionUrl: '/subscription',
      });
    }
  }

  cancelUserSubscription(userId: string, cancelledAt?: string | null): SubscriptionRecord | null {
    const sub = this.subscriptions.get(userId);
    const user = this.users.get(userId);
    if (!sub || !user) return null;

    sub.status = 'cancelled';
    sub.cancelledAt = cancelledAt || new Date().toISOString();
    sub.renewsAt = null;
    user.subscriptionStatus = 'cancelled';

    this.pushNotification(userId, {
      type: 'payment',
      titleEn: 'Subscription Cancelled',
      titleFr: 'Abonnement annulé',
      bodyEn: 'Your PLAYROOM PLUS auto-renewal has been cancelled.',
      bodyFr: 'Le renouvellement automatique de PLAYROOM PLUS a été annulé.',
      actionUrl: '/subscription',
    });

    return sub;
  }

  expireUserSubscription(userId: string): SubscriptionRecord | null {
    const sub = this.subscriptions.get(userId);
    const user = this.users.get(userId);
    if (!sub || !user) return null;

    sub.status = 'expired';
    sub.renewsAt = null;
    sub.expiresAt = new Date().toISOString();
    user.subscriptionStatus = 'expired';
    return sub;
  }
}

export const store = new PlayroomStore();
