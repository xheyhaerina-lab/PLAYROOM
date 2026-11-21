import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Crown, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { AppLayout } from '../layouts/AppLayout.tsx';
import { ApiError, apiRequest } from '../lib/api.ts';
import type {
  AchievementItem,
  GameHistoryRecord,
  PaymentRecord,
  PublicProfile,
  SubscriptionPlan,
  SubscriptionRecord,
} from '../types/playroom.ts';
import { formatMoneyCents } from '../utils/currency.ts';
import { getLevelProgress } from '../utils/progression.ts';
import { PWAInstallButton } from '../components/PWAComponents.tsx';
import { isSoundEnabled, setSoundEnabled } from '../utils/sound.ts';

// 1. PROFILE PAGE (Own or Public by username)
export const ProfilePage: React.FC = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [history, setHistory] = useState<GameHistoryRecord[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (!username && user) {
      setProfile({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        xp: user.xp,
        level: user.level,
        totalGamesPlayed: user.totalGamesPlayed,
        wins: user.wins,
        subscriptionStatus: user.subscriptionStatus,
        createdAt: user.createdAt,
      });
      apiRequest<{ history: GameHistoryRecord[] }>('/history')
        .then((res) => setHistory(res.history.slice(0, 10)))
        .catch(() => {});
      apiRequest<{ achievements: AchievementItem[] }>('/achievements')
        .then((res) => setAchievements(res.achievements.filter((a) => a.unlockedAt !== null)))
        .catch(() => {});
    } else if (username) {
      apiRequest<{
        profile: PublicProfile;
        history: GameHistoryRecord[];
        achievements: AchievementItem[];
      }>(`/players/${encodeURIComponent(username)}`)
        .then((res) => {
          setProfile(res.profile);
          setHistory(res.history);
          setAchievements(res.achievements);
        })
        .catch((err) => setError((err as Error).message));
    }
  }, [username, user]);

  const prog = getLevelProgress(profile?.xp ?? 0);

  return (
    <AppLayout title={profile ? `@${profile.username}` : t.nav.profile}>
      <div className="mx-auto max-w-4xl space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-[#151522] p-6 text-sm text-red-200">
            {error}
          </div>
        ) : profile ? (
          <>
            <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center font-mono text-lg font-bold text-[#F8FAFC]">
                    <User className="w-6 h-6 text-[#A855F7]" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">
                      {profile.displayName}
                    </h2>
                    <div className="text-xs text-[#9CA3AF]">
                      @{profile.username} · {profile.subscriptionStatus === 'plus' ? 'PLAYROOM PLUS' : 'FREE'}
                    </div>
                  </div>
                </div>
                <div className="font-mono text-sm tabular-nums text-[#A855F7]">
                  Lv.{prog.level} · {profile.xp} XP
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-[#10101C]">
                <div
                  className="h-full rounded-full bg-[#8B5CF6]"
                  style={{ width: `${prog.percent}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="rounded-lg border border-[#8B5CF6]/15 bg-[#10101C] p-3.5">
                  <div className="text-xs text-[#9CA3AF]">{t.common.gamesPlayed}</div>
                  <div className="mt-1 font-mono text-xl font-bold tabular-nums text-[#F8FAFC]">
                    {profile.totalGamesPlayed}
                  </div>
                </div>
                <div className="rounded-lg border border-[#8B5CF6]/15 bg-[#10101C] p-3.5">
                  <div className="text-xs text-[#9CA3AF]">{t.common.wins}</div>
                  <div className="mt-1 font-mono text-xl font-bold tabular-nums text-[#F8FAFC]">
                    {profile.wins}
                  </div>
                </div>
                <div className="rounded-lg border border-[#8B5CF6]/15 bg-[#10101C] p-3.5">
                  <div className="text-xs text-[#9CA3AF]">{t.nav.achievements}</div>
                  <div className="mt-1 font-mono text-xl font-bold tabular-nums text-[#A855F7]">
                    {achievements.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-3">
              <h3 className="font-display text-base font-bold text-[#F8FAFC]">
                {language === 'fr' ? 'Historique récent' : 'Recent Matches'}
              </h3>
              {history.length === 0 ? (
                <p className="text-xs text-[#9CA3AF]">
                  {language === 'fr' ? 'Aucune partie récente.' : 'No recent matches.'}
                </p>
              ) : (
                <div className="divide-y divide-[#8B5CF6]/10 text-xs">
                  {history.map((h) => (
                    <div key={h.sessionId} className="flex items-center justify-between py-2.5">
                      <span className="capitalize text-[#F8FAFC]">
                        {h.gameSlug.replace('-', ' ')} · {h.difficulty}
                      </span>
                      <span className="font-mono tabular-nums text-[#A855F7]">
                        {h.score} pts · +{h.xpEarned} XP
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
};

// 2. SUBSCRIPTION & PROVIDER-INDEPENDENT USD CHECKOUT MANAGEMENT
export const SubscriptionPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentConfigured, setPaymentConfigured] = useState(false);
  const [providerName, setProviderName] = useState('Dodo Payments');
  const [selectedPlanCode, setSelectedPlanCode] = useState<'plus_monthly' | 'plus_annual'>(() =>
    searchParams.get('plan') === 'plus_annual' ? 'plus_annual' : 'plus_monthly'
  );
  const [checkoutError, setCheckoutError] = useState('');
  const [verificationMsg, setVerificationMsg] = useState('');
  const [missingConfig, setMissingConfig] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  const loadData = () => {
    apiRequest<{
      plans: SubscriptionPlan[];
      paymentConfigured: boolean;
      paymentProviderName?: string;
    }>('/plans')
      .then((res) => {
        setPlans(res.plans);
        setPaymentConfigured(res.paymentConfigured);
        if (res.paymentProviderName) setProviderName(res.paymentProviderName);
      })
      .catch(() => {});
    apiRequest<{
      subscription: SubscriptionRecord | null;
      payments: PaymentRecord[];
      paymentConfigured: boolean;
      paymentProviderName?: string;
    }>('/subscription')
      .then((res) => {
        setSubscription(res.subscription);
        setPayments(res.payments);
        setPaymentConfigured(res.paymentConfigured);
        if (res.paymentProviderName) setProviderName(res.paymentProviderName);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
    const ref = searchParams.get('ref');
    if (ref) {
      apiRequest<{ verified: boolean; message?: string }>(
        `/payments/verify/${encodeURIComponent(ref)}`
      )
        .then(async (res) => {
          if (res.verified) {
            setVerificationMsg(
              language === 'fr'
                ? 'Paiement vérifié par le serveur : PLAYROOM PLUS est activé.'
                : 'Server verification succeeded: PLAYROOM PLUS is now active.'
            );
            await refreshProfile();
          } else {
            setVerificationMsg(
              res.message ||
                (language === 'fr'
                  ? 'Paiement en attente de confirmation webhook vérifiée.'
                  : 'Payment is awaiting verified server webhook confirmation.')
            );
          }
          loadData();
        })
        .catch(() => {});
    }
  }, [searchParams]);

  const startCheckout = async (planCode: 'plus_monthly' | 'plus_annual') => {
    setCheckoutError('');
    setMissingConfig([]);
    setProcessing(true);
    try {
      const res = await apiRequest<{ checkoutUrl: string }>('/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({ planCode }),
      });
      if (res.checkoutUrl) {
        window.location.assign(res.checkoutUrl);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setCheckoutError(err.message);
        if (Array.isArray(err.data.missingConfiguration)) {
          setMissingConfig(err.data.missingConfiguration.map(String));
        }
      } else {
        setCheckoutError('Checkout initiation failed.');
      }
      loadData();
    } finally {
      setProcessing(false);
    }
  };

  const cancelSubscription = async () => {
    setCheckoutError('');
    try {
      await apiRequest('/subscription/cancel', { method: 'POST' });
      await refreshProfile();
      loadData();
    } catch (err) {
      setCheckoutError((err as Error).message);
    }
  };

  const paidPlans = plans.filter((p) => p.code === 'plus_monthly' || p.code === 'plus_annual');
  const activeSelectedPlan =
    paidPlans.find((p) => p.code === selectedPlanCode) || paidPlans[0];

  return (
    <AppLayout title="PLAYROOM PLUS">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-xl border border-[#8B5CF6]/25 bg-[#151522] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-[#A855F7] font-medium flex items-center gap-1.5">
                <Crown className="w-4 h-4" />
                <span>{language === 'fr' ? 'Statut actuel' : 'Current Tier'}</span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold text-[#F8FAFC]">
                {user?.subscriptionStatus === 'plus' ? 'PLAYROOM PLUS' : 'FREE'}
              </h2>
              {subscription && (
                <p className="mt-1 text-xs text-[#9CA3AF] font-mono">
                  Status: {subscription.status} · Interval: {subscription.billingInterval} ·{' '}
                  {formatMoneyCents(subscription.amountCents, subscription.currency, {
                    locale: language,
                  })}{' '}
                  {subscription.currency}
                  {subscription.renewsAt &&
                    ` · Renews: ${new Date(subscription.renewsAt).toLocaleDateString()}`}
                  {subscription.cancelledAt &&
                    ` · Cancelled: ${new Date(subscription.cancelledAt).toLocaleDateString()}`}
                  {subscription.expiresAt &&
                    ` · Access until: ${new Date(subscription.expiresAt).toLocaleDateString()}`}
                </p>
              )}
            </div>

            {subscription?.status === 'active' && (
              <button
                type="button"
                onClick={cancelSubscription}
                className="rounded-lg border border-red-500/30 px-4 py-2 text-xs font-medium text-red-300 hover:bg-red-500/10"
              >
                {language === 'fr' ? 'Annuler le renouvellement' : 'Cancel Renewal'}
              </button>
            )}
          </div>

          {subscription?.status !== 'active' && paidPlans.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-[#8B5CF6]/15">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paidPlans.map((plan) => {
                  const selected = plan.code === selectedPlanCode;
                  const formatted = formatMoneyCents(plan.priceCents, plan.currency, {
                    locale: language,
                  });
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() =>
                        setSelectedPlanCode(plan.code as 'plus_monthly' | 'plus_annual')
                      }
                      className={`text-left rounded-xl border p-4 transition-colors ${
                        selected
                          ? 'border-[#8B5CF6] bg-[#10101C]'
                          : 'border-[#8B5CF6]/20 bg-[#10101C]/50 hover:border-[#8B5CF6]/45'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm font-bold text-[#F8FAFC]">
                          {language === 'fr' ? plan.nameFr : plan.nameEn}
                        </span>
                        <span className="font-mono text-xs text-[#A855F7]">
                          {plan.intervalUnit === 'year'
                            ? language === 'fr'
                              ? 'Annuel (-33%)'
                              : 'Yearly (Save 33%)'
                            : language === 'fr'
                              ? 'Mensuel'
                              : 'Monthly'}
                        </span>
                      </div>
                      <div className="mt-2 font-display text-2xl font-bold tabular-nums text-[#F8FAFC]">
                        {formatted}{' '}
                        <span className="text-xs font-normal text-[#9CA3AF]">
                          / {plan.intervalUnit === 'year' ? (language === 'fr' ? 'an' : 'year') : language === 'fr' ? 'mois' : 'month'} ({plan.currency})
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {activeSelectedPlan && (
                <button
                  type="button"
                  disabled={processing}
                  onClick={() =>
                    startCheckout(activeSelectedPlan.code as 'plus_monthly' | 'plus_annual')
                  }
                  className="rounded-lg bg-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7C3AED] disabled:opacity-60"
                >
                  {language === 'fr'
                    ? `Passer à ${activeSelectedPlan.nameFr} (${formatMoneyCents(
                        activeSelectedPlan.priceCents,
                        activeSelectedPlan.currency,
                        { locale: language }
                      )})`
                    : `Continue to Checkout (${formatMoneyCents(
                        activeSelectedPlan.priceCents,
                        activeSelectedPlan.currency,
                        { locale: language }
                      )} ${activeSelectedPlan.currency})`}
                </button>
              )}
            </div>
          )}

          {verificationMsg && (
            <div className="rounded-lg border border-[#8B5CF6]/35 bg-[#10101C] p-4 text-xs text-[#F8FAFC]">
              {verificationMsg}
            </div>
          )}

          {!paymentConfigured && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <div className="font-semibold">
                  {language === 'fr'
                    ? `Passerelle ${providerName} en attente de configuration serveur`
                    : `${providerName} billing awaiting server configuration`}
                </div>
                <p className="mt-1 opacity-90">
                  {language === 'fr'
                    ? 'Aucun accès premium n’est activé sans vérification cryptographique côté serveur. Configurez les variables serveur du prestataire Merchant of Record (DODO_PAYMENTS_API_KEY, DODO_PAYMENTS_WEBHOOK_SECRET, DODO_PRODUCT_PLUS_MONTHLY_ID, DODO_PRODUCT_PLUS_ANNUAL_ID) après validation du compte.'
                    : 'Premium access is never granted from client redirects. Configure server-side Merchant of Record credentials (DODO_PAYMENTS_API_KEY, DODO_PAYMENTS_WEBHOOK_SECRET, DODO_PRODUCT_PLUS_MONTHLY_ID, DODO_PRODUCT_PLUS_ANNUAL_ID) once merchant onboarding is approved.'}
                </p>
              </div>
            </div>
          )}

          {checkoutError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-200 space-y-1">
              <div className="font-semibold">{checkoutError}</div>
              {missingConfig.length > 0 && (
                <div className="font-mono text-[11px]">
                  Missing server configuration: {missingConfig.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-4">
          <h3 className="font-display text-base font-bold text-[#F8FAFC]">
            {language === 'fr' ? 'Historique des paiements' : 'Payment History'}
          </h3>
          {payments.length === 0 ? (
            <p className="text-xs text-[#9CA3AF]">
              {language === 'fr' ? 'Aucune transaction enregistrée.' : 'No payment transactions recorded yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#8B5CF6]/15 text-[#9CA3AF]">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Reference</th>
                    <th className="py-2 pr-4 font-medium">Transaction ID</th>
                    <th className="py-2 pr-4 font-medium">Amount</th>
                    <th className="py-2 pr-4 font-medium">Interval</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8B5CF6]/10">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 pr-4 font-mono text-[#F8FAFC]">{p.reference}</td>
                      <td className="py-2.5 pr-4 font-mono text-[#9CA3AF]">
                        {p.providerTransactionId || '—'}
                      </td>
                      <td className="py-2.5 pr-4 font-mono tabular-nums text-[#F8FAFC]">
                        {formatMoneyCents(p.amountCents, p.currency, { locale: language })} {p.currency}
                      </td>
                      <td className="py-2.5 pr-4 capitalize text-[#9CA3AF]">{p.billingInterval}</td>
                      <td className="py-2.5 pr-4 capitalize text-[#A855F7]">
                        {p.status}
                        {p.failureReason ? ` (${p.failureReason})` : ''}
                      </td>
                      <td className="py-2.5 text-right font-mono text-[#9CA3AF]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

// 3. SETTINGS PAGE (Includes Profile Preferences, Sound, PWA Install, and First-Run Admin Claim)
export const SettingsPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [prefLang, setPrefLang] = useState<'en' | 'fr'>(user?.preferredLanguage || language);
  const [isPublic, setIsPublic] = useState(user?.isPublicProfile ?? true);
  const [sound, setSound] = useState(isSoundEnabled());
  const [savedMsg, setSavedMsg] = useState('');

  // Admin bootstrap status
  const [bootstrap, setBootstrap] = useState<{
    hasAnyAdmin: boolean;
    passcodeConfigured: boolean;
    currentUserIsAdmin: boolean;
  } | null>(null);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    apiRequest<NonNullable<typeof bootstrap>>('/admin/bootstrap-status')
      .then(setBootstrap)
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg('');
    await apiRequest('/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        displayName,
        preferredLanguage: prefLang,
        isPublicProfile: isPublic,
      }),
    });
    setLanguage(prefLang);
    setSoundEnabled(sound);
    await refreshProfile();
    setSavedMsg(language === 'fr' ? 'Paramètres enregistrés.' : 'Settings saved.');
  };

  const claimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    try {
      await apiRequest('/admin/claim', {
        method: 'POST',
        body: JSON.stringify({ passcode: adminPasscode || undefined }),
      });
      await refreshProfile();
      const st = await apiRequest<NonNullable<typeof bootstrap>>('/admin/bootstrap-status');
      setBootstrap(st);
    } catch (err) {
      setAdminError((err as Error).message);
    }
  };

  return (
    <AppLayout title={t.nav.settings}>
      <div className="mx-auto max-w-2xl space-y-6">
        <form
          onSubmit={handleSave}
          className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-5"
        >
          <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
            {language === 'fr' ? 'Préférences du compte' : 'Account Preferences'}
          </h2>

          {savedMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>{savedMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1.5">
              {language === 'fr' ? 'Nom affiché' : 'Display name'}
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2.5 text-sm text-[#F8FAFC]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1.5">
              {language === 'fr' ? 'Langue préférée' : 'Preferred language'}
            </label>
            <select
              value={prefLang}
              onChange={(e) => setPrefLang(e.target.value as 'en' | 'fr')}
              className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2.5 text-sm text-[#F8FAFC]"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-[#F8FAFC] cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <span>
              {language === 'fr'
                ? 'Profil visible dans les classements et la recherche'
                : 'Show profile in player search and public leaderboards'}
            </span>
          </label>

          <label className="flex items-center gap-2.5 text-sm text-[#F8FAFC] cursor-pointer">
            <input
              type="checkbox"
              checked={sound}
              onChange={(e) => setSound(e.target.checked)}
            />
            <span>{language === 'fr' ? 'Effets sonores des jeux' : 'Enable game audio feedback'}</span>
          </label>

          <button
            type="submit"
            className="rounded-lg bg-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7C3AED]"
          >
            {t.common.save}
          </button>
        </form>

        <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-sm font-bold text-[#F8FAFC]">PLAYROOM PWA</h3>
            <p className="text-xs text-[#9CA3AF]">
              {language === 'fr'
                ? 'Installez PLAYROOM sur votre appareil pour un accès rapide.'
                : 'Install PLAYROOM on your desktop or mobile home screen.'}
            </p>
          </div>
          <PWAInstallButton />
        </div>

        {/* First-Run Admin Claim Bootstrap (visible only when unclaimed or passcode is configured) */}
        {bootstrap && !bootstrap.currentUserIsAdmin && (!bootstrap.hasAnyAdmin || bootstrap.passcodeConfigured) && (
          <form
            onSubmit={claimAdmin}
            className="rounded-xl border border-[#8B5CF6]/25 bg-[#151522] p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-[#F8FAFC]">
              <Shield className="w-4 h-4 text-[#A855F7]" />
              <span>
                {language === 'fr' ? 'Configuration Administrateur Initiale' : 'Initial Administrator Setup'}
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF]">
              {bootstrap.passcodeConfigured
                ? language === 'fr'
                  ? 'Saisissez le code administrateur configuré sur le serveur pour activer les droits d’administration.'
                  : 'Enter the server ADMIN_CLAIM_PASSCODE to elevate this account to Administrator.'
                : language === 'fr'
                  ? 'Aucun administrateur n’est encore configuré. Vous pouvez revendiquer le rôle Super Admin pour cette instance (verrouillé ensuite).'
                  : 'No administrator has been claimed on this instance yet. Claim the initial Super Admin role below (permanently locks once claimed).'}
            </p>
            {adminError && <div className="text-xs text-red-300">{adminError}</div>}
            {bootstrap.passcodeConfigured && (
              <input
                type="password"
                required
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="ADMIN_CLAIM_PASSCODE"
                className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2 text-sm text-[#F8FAFC]"
              />
            )}
            <button
              type="submit"
              className="rounded-lg border border-[#8B5CF6]/40 px-4 py-2 text-xs font-semibold text-[#F8FAFC] hover:bg-[#8B5CF6]/15"
            >
              {language === 'fr' ? 'Activer le rôle Administrateur' : 'Claim Administrator Access'}
            </button>
          </form>
        )}
      </div>
    </AppLayout>
  );
};
