export type Language = 'en' | 'fr';

export type GameSlug = 'quiz-battle' | 'word-challenge' | 'brain-test' | 'mystery-room';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type SubscriptionStatus = 'free' | 'plus' | 'cancelled' | 'expired' | 'past_due';
export type BillingInterval = 'month' | 'year';
export type AdminRole = 'moderator' | 'admin' | 'super_admin';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  totalGamesPlayed: number;
  wins: number;
  subscriptionStatus: SubscriptionStatus;
  preferredLanguage: Language;
  isPublicProfile: boolean;
  isSuspended: boolean;
  role: AdminRole | null;
  lastActiveAt: string;
  createdAt: string;
}

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  totalGamesPlayed: number;
  wins: number;
  subscriptionStatus: SubscriptionStatus;
  isOnline?: boolean;
  createdAt: string;
}

export interface GameCatalogItem {
  slug: GameSlug;
  titleEn: string;
  titleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  category: string;
  supportsMultiplayer: boolean;
  isPlusOnly: boolean;
  baseXp: number;
  imageUrl: string;
}

export type QuizCategory =
  | 'general'
  | 'science'
  | 'technology'
  | 'geography'
  | 'history'
  | 'entertainment'
  | 'logic';

export interface QuizQuestionPublic {
  id: string;
  category: QuizCategory;
  difficulty: Difficulty;
  promptEn: string;
  promptFr: string;
  optionsEn: [string, string, string, string];
  optionsFr: [string, string, string, string];
}

export interface QuizQuestionAdmin extends QuizQuestionPublic {
  correctOptionIndex: number;
  explanationEn: string;
  explanationFr: string;
  isActive: boolean;
}

export interface WordPuzzlePublic {
  id: string;
  difficulty: Difficulty;
  length: number;
  maxAttempts: number;
  categoryEn: string;
  categoryFr: string;
  hintEn: string;
  hintFr: string;
  firstLetter: string;
  isDaily?: boolean;
}

export interface BrainPuzzlePublic {
  id: string;
  type: 'sequence' | 'pattern' | 'math' | 'memory' | 'logic';
  difficulty: Difficulty;
  promptEn: string;
  promptFr: string;
  visualData?: {
    sequence?: (number | string)[];
    grid?: string[];
    memorySequence?: string[];
    memoryRevealMs?: number;
  };
  options: string[];
  hintEn: string;
  hintFr: string;
}

export interface MysteryClue {
  id: string;
  labelEn: string;
  labelFr: string;
  detailEn: string;
  detailFr: string;
  unlockedByDefault?: boolean;
}

export interface MysterySuspect {
  id: string;
  name: string;
  roleEn: string;
  roleFr: string;
  alibiEn: string;
  alibiFr: string;
}

export interface MysteryQuestion {
  id: string;
  promptEn: string;
  promptFr: string;
  optionsEn: string[];
  optionsFr: string[];
}

export interface MysteryScenarioPublic {
  id: string;
  slug: string;
  difficulty: Difficulty;
  titleEn: string;
  titleFr: string;
  introEn: string;
  introFr: string;
  locationEn: string;
  locationFr: string;
  isPlusOnly: boolean;
  clues: MysteryClue[];
  suspects: MysterySuspect[];
  questions: MysteryQuestion[];
}

export interface RoomPlayer {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  isReady: boolean;
  isConnected: boolean;
  score: number;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  gameSlug: GameSlug;
  difficulty: Difficulty;
  maxPlayers: number;
  isPrivate: boolean;
  status: 'lobby' | 'in_progress' | 'completed' | 'closed';
  players: RoomPlayer[];
  currentSessionId: string | null;
  createdAt: string;
}

export interface FriendRequestItem {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  peer: PublicProfile;
}

export interface AchievementItem {
  id: string;
  code: string;
  titleEn: string;
  titleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  xpReward: number;
  isPlusExclusive: boolean;
  iconName: string;
  unlockedAt: string | null;
}

export interface DailyChallengeItem {
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
  bestScore: number;
  completedAt: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  subscriptionStatus: SubscriptionStatus;
  score: number;
  wins: number;
}

export interface SubscriptionPlan {
  id: string;
  code: 'free' | 'plus_monthly' | 'plus_annual';
  nameEn: string;
  nameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  priceCents: number;
  currency: string;
  intervalUnit: 'month' | 'year' | 'lifetime';
  providerProductId: string | null;
  featuresEn: string[];
  featuresFr: string[];
  isActive: boolean;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planId: string;
  planCode: 'free' | 'plus_monthly' | 'plus_annual' | string;
  billingInterval: BillingInterval;
  amountCents: number;
  currency: string;
  provider: string;
  providerSubscriptionId: string | null;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  startedAt: string;
  expiresAt: string | null;
  renewsAt: string | null;
  cancelledAt: string | null;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  planId: string;
  subscriptionId: string | null;
  provider: string;
  reference: string;
  providerTransactionId: string | null;
  providerCheckoutSessionId: string | null;
  providerSubscriptionId: string | null;
  amountCents: number;
  currency: string;
  billingInterval: BillingInterval;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  checkoutUrl: string | null;
  failureReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'system' | 'friend_request' | 'room_invite' | 'level_up' | 'achievement' | 'payment';
  titleEn: string;
  titleFr: string;
  bodyEn: string;
  bodyFr: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  reporterUsername: string;
  reportedUserId: string;
  reportedUsername: string;
  reason: string;
  details: string | null;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  resolutionNote: string | null;
  createdAt: string;
}

export interface GameHistoryRecord {
  sessionId: string;
  gameSlug: GameSlug;
  mode: 'solo' | 'multiplayer' | 'daily';
  difficulty: Difficulty;
  score: number;
  xpEarned: number;
  isWinner: boolean;
  completedAt: string;
}
