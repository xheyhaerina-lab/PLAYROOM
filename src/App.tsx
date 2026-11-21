import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { AdminRoute, ProtectedRoute } from './components/RouteGuards.tsx';
import { BrainTestPage } from './features/games/BrainTestPage.tsx';
import { MysteryRoomPage } from './features/games/MysteryRoomPage.tsx';
import { QuizBattlePage } from './features/games/QuizBattlePage.tsx';
import { WordChallengePage } from './features/games/WordChallengePage.tsx';
import {
  CreateRoomPage,
  JoinRoomPage,
  MultiplayerLobbyPage,
  RoomSessionPage,
} from './features/multiplayer/MultiplayerPages.tsx';
import {
  ProfilePage,
  SettingsPage,
  SubscriptionPage,
} from './pages/AccountAndSubscriptionPages.tsx';
import { AdminDashboardPage } from './pages/AdminPages.tsx';
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
} from './pages/AuthPages.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { GameLibraryPage } from './pages/GameLibraryPage.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { PrivacyPage, TermsPage } from './pages/LegalPages.tsx';
import { PricingPage } from './pages/PricingPage.tsx';
import {
  AchievementsPage,
  DailyChallengesPage,
  FriendsPage,
  LeaderboardsPage,
  NotificationsPage,
} from './pages/SocialAndProgressionPages.tsx';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Authenticated Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games"
              element={
                <ProtectedRoute>
                  <GameLibraryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/quiz-battle"
              element={
                <ProtectedRoute>
                  <QuizBattlePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/word-challenge"
              element={
                <ProtectedRoute>
                  <WordChallengePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/brain-test"
              element={
                <ProtectedRoute>
                  <BrainTestPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/mystery-room"
              element={
                <ProtectedRoute>
                  <MysteryRoomPage />
                </ProtectedRoute>
              }
            />

            {/* Multiplayer */}
            <Route
              path="/multiplayer"
              element={
                <ProtectedRoute>
                  <MultiplayerLobbyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/multiplayer/create"
              element={
                <ProtectedRoute>
                  <CreateRoomPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/multiplayer/join"
              element={
                <ProtectedRoute>
                  <JoinRoomPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/multiplayer/room/:code"
              element={
                <ProtectedRoute>
                  <RoomSessionPage />
                </ProtectedRoute>
              }
            />

            {/* Social, Progression & Account */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:username"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/friends"
              element={
                <ProtectedRoute>
                  <FriendsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboards"
              element={
                <ProtectedRoute>
                  <LeaderboardsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/achievements"
              element={
                <ProtectedRoute>
                  <AchievementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/challenges"
              element={
                <ProtectedRoute>
                  <DailyChallengesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscription"
              element={
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
