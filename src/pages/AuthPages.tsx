import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { PublicLayout } from '../layouts/PublicLayout.tsx';
import { ApiError, apiRequest } from '../lib/api.ts';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@') || password.length < 6) {
      setError(
        language === 'fr'
          ? 'Veuillez saisir une adresse e-mail et un mot de passe valides.'
          : 'Please enter a valid email address and password.'
      );
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed';
      setError(
        msg === 'INVALID_CREDENTIALS'
          ? language === 'fr'
            ? 'E-mail ou mot de passe incorrect.'
            : 'Invalid email or password.'
          : msg === 'ACCOUNT_SUSPENDED'
            ? language === 'fr'
              ? 'Ce compte a été suspendu.'
              : 'This account has been suspended.'
            : msg
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-[#F8FAFC]">
            {language === 'fr' ? 'Connexion à PLAYROOM' : 'Sign in to PLAYROOM'}
          </h1>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            {language === 'fr'
              ? 'Accédez à votre profil, vos amis et vos salons multijoueurs.'
              : 'Access your XP progression, friends, and multiplayer rooms.'}
          </p>

          {error && (
            <div role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2.5 text-sm text-[#F8FAFC] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-xs font-medium text-[#9CA3AF]">
                  {language === 'fr' ? 'Mot de passe' : 'Password'}
                </label>
                <Link to="/forgot-password" className="text-xs text-[#A855F7] hover:text-white">
                  {language === 'fr' ? 'Mot de passe oublié ?' : 'Forgot password?'}
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2.5 text-sm text-[#F8FAFC] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#8B5CF6] py-2.5 text-sm font-semibold text-white hover:bg-[#7C3AED] disabled:opacity-60 transition-colors"
            >
              {submitting ? t.common.loading : t.nav.login}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#9CA3AF]">
            {language === 'fr' ? 'Pas encore de compte ?' : 'New to PLAYROOM?'}{' '}
            <Link to="/register" className="font-medium text-[#A855F7] hover:text-white">
              {t.nav.getStarted}
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
};

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username.trim())) {
      setError(
        language === 'fr'
          ? 'Le nom d’utilisateur doit contenir 3 à 24 caractères (lettres, chiffres, _).'
          : 'Username must be 3–24 characters using letters, numbers, or underscores.'
      );
      return;
    }
    if (password.length < 8) {
      setError(
        language === 'fr'
          ? 'Le mot de passe doit contenir au moins 8 caractères.'
          : 'Password must be at least 8 characters.'
      );
      return;
    }
    setSubmitting(true);
    try {
      await register({
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
        email: email.trim(),
        password,
        preferredLanguage: language,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed';
      setError(
        msg === 'EMAIL_EXISTS'
          ? language === 'fr'
            ? 'Cette adresse e-mail est déjà utilisée.'
            : 'An account with this email already exists.'
          : msg === 'USERNAME_EXISTS'
            ? language === 'fr'
              ? 'Ce nom d’utilisateur est déjà pris.'
              : 'This username is already taken.'
            : msg
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-[#F8FAFC]">
            {language === 'fr' ? 'Créer un compte PLAYROOM' : 'Create your PLAYROOM account'}
          </h1>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            {language === 'fr'
              ? 'Commencez gratuitement, gagnez de l’XP et défiez vos amis.'
              : 'Start free, earn XP, and challenge friends in live rooms.'}
          </p>

          {error && (
            <div role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="reg-username" className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                {language === 'fr' ? 'Nom d’utilisateur' : 'Username'}
              </label>
              <input
                id="reg-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alex_nova"
                className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2.5 text-sm text-[#F8FAFC] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-display" className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                {language === 'fr' ? 'Nom affiché' : 'Display name'}
              </label>
              <input
                id="reg-display"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Nova"
                className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2.5 text-sm text-[#F8FAFC] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2.5 text-sm text-[#F8FAFC] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                {language === 'fr' ? 'Mot de passe (8+ caractères)' : 'Password (8+ characters)'}
              </label>
              <input
                id="reg-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2.5 text-sm text-[#F8FAFC] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#8B5CF6] py-2.5 text-sm font-semibold text-white hover:bg-[#7C3AED] disabled:opacity-60 transition-colors"
            >
              {submitting ? t.common.loading : t.nav.getStarted}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#9CA3AF]">
            {language === 'fr' ? 'Déjà inscrit ?' : 'Already have an account?'}{' '}
            <Link to="/login" className="font-medium text-[#A855F7] hover:text-white">
              {t.nav.login}
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
};

export const ForgotPasswordPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [sentMessage, setSentMessage] = useState('');
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiRequest<{ ok: boolean; message: string; previewResetToken?: string }>(
        '/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
        }
      );
      setSentMessage(res.message);
      if (res.previewResetToken) setPreviewToken(res.previewResetToken);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-[#F8FAFC]">
            {language === 'fr' ? 'Réinitialiser le mot de passe' : 'Reset password'}
          </h1>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            {language === 'fr'
              ? 'Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.'
              : 'Enter your email address to request a password reset.'}
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
              {error}
            </div>
          )}

          {sentMessage ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
                {sentMessage}
              </div>
              {previewToken && (
                <Link
                  to={`/reset-password?token=${encodeURIComponent(previewToken)}`}
                  className="inline-flex w-full justify-center rounded-lg bg-[#8B5CF6] py-2.5 text-sm font-semibold text-white"
                >
                  {language === 'fr' ? 'Continuer vers la réinitialisation' : 'Proceed to reset password'}
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2.5 text-sm text-[#F8FAFC]"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-[#8B5CF6] py-2.5 text-sm font-semibold text-white hover:bg-[#7C3AED]"
              >
                {t.common.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [token, setToken] = useState(params.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      setDone(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-[#F8FAFC]">
            {language === 'fr' ? 'Nouveau mot de passe' : 'Set new password'}
          </h1>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
              {error}
            </div>
          )}

          {done ? (
            <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {language === 'fr'
                ? 'Mot de passe mis à jour. Redirection vers la connexion...'
                : 'Password updated. Redirecting to login...'}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Reset token</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2.5 text-sm font-mono text-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">
                  {language === 'fr' ? 'Nouveau mot de passe (8+ caractères)' : 'New password (8+ characters)'}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2.5 text-sm text-[#F8FAFC]"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#8B5CF6] py-2.5 text-sm font-semibold text-white hover:bg-[#7C3AED]"
              >
                {t.common.save}
              </button>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};
