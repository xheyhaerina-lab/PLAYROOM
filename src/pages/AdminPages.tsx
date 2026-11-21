import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { AppLayout } from '../layouts/AppLayout.tsx';
import { apiRequest } from '../lib/api.ts';
import { formatMoneyCents } from '../utils/currency.ts';
import type {
  Difficulty,
  ModerationReport,
  PaymentRecord,
  QuizCategory,
  QuizQuestionAdmin,
  SubscriptionPlan,
  UserProfile,
} from '../types/playroom.ts';

type AdminTab = 'overview' | 'users' | 'games' | 'subscriptions' | 'reports';

export const AdminDashboardPage: React.FC = () => {
  const { language } = useLanguage();
  const [tab, setTab] = useState<AdminTab>('overview');

  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    totalGamesPlayed: number;
    activeSubscriptions: number;
    verifiedRevenueCents: number;
    currency: string;
    openReports: number;
  } | null>(null);
  const [recentActivity, setRecentActivity] = useState<
    { sessionId: string; username: string; gameSlug: string; score: number; completedAt: string }[]
  >([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [questions, setQuestions] = useState<QuizQuestionAdmin[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [payments, setPayments] = useState<(PaymentRecord & { username: string })[]>([]);
  const [reports, setReports] = useState<ModerationReport[]>([]);

  // New Question Form
  const [newQPromptEn, setNewQPromptEn] = useState('');
  const [newQPromptFr, setNewQPromptFr] = useState('');
  const [newQCategory, setNewQCategory] = useState<QuizCategory>('general');
  const [newQDifficulty, setNewQDifficulty] = useState<Difficulty>('medium');
  const [newQOptions, setNewQOptions] = useState<[string, string, string, string]>(['', '', '', '']);
  const [newQCorrect, setNewQCorrect] = useState(0);

  // Plan price edit
  const [editingPrice, setEditingPrice] = useState<Record<string, number>>({});

  const loadAll = () => {
    apiRequest<{ stats: typeof stats; recentActivity: typeof recentActivity }>('/admin/overview')
      .then((res) => {
        setStats(res.stats);
        setRecentActivity(res.recentActivity);
      })
      .catch(() => {});
    apiRequest<{ users: UserProfile[] }>(`/admin/users?q=${encodeURIComponent(userSearch)}`)
      .then((res) => setUsers(res.users))
      .catch(() => {});
    apiRequest<{ questions: QuizQuestionAdmin[] }>('/admin/questions')
      .then((res) => setQuestions(res.questions))
      .catch(() => {});
    apiRequest<{ plans: SubscriptionPlan[] }>('/plans')
      .then((res) => {
        setPlans(res.plans);
        const map: Record<string, number> = {};
        res.plans.forEach((p) => {
          map[p.id] = p.priceCents;
        });
        setEditingPrice(map);
      })
      .catch(() => {});
    apiRequest<{ payments: (PaymentRecord & { username: string })[] }>('/admin/payments')
      .then((res) => setPayments(res.payments))
      .catch(() => {});
    apiRequest<{ reports: ModerationReport[] }>('/admin/reports')
      .then((res) => setReports(res.reports))
      .catch(() => {});
  };

  useEffect(() => {
    loadAll();
  }, []);

  const toggleSuspend = async (u: UserProfile) => {
    await apiRequest(`/admin/users/${u.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isSuspended: !u.isSuspended }),
    });
    loadAll();
  };

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiRequest('/admin/questions', {
      method: 'POST',
      body: JSON.stringify({
        category: newQCategory,
        difficulty: newQDifficulty,
        promptEn: newQPromptEn,
        promptFr: newQPromptFr || newQPromptEn,
        optionsEn: newQOptions,
        optionsFr: newQOptions,
        correctOptionIndex: newQCorrect,
      }),
    });
    setNewQPromptEn('');
    setNewQPromptFr('');
    setNewQOptions(['', '', '', '']);
    loadAll();
  };

  const deleteQuestion = async (id: string) => {
    await apiRequest(`/admin/questions/${id}`, { method: 'DELETE' });
    loadAll();
  };

  const savePlanPrice = async (planId: string) => {
    const cents = Math.max(0, Math.trunc(Number(editingPrice[planId] ?? 0)));
    await apiRequest(`/admin/plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify({ priceCents: cents }),
    });
    loadAll();
  };

  const updateReport = async (id: string, status: 'resolved' | 'dismissed', suspendReported = false) => {
    await apiRequest(`/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, suspendReported }),
    });
    loadAll();
  };

  return (
    <AppLayout title={language === 'fr' ? 'Administration PLAYROOM' : 'PLAYROOM Administration'}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-1 rounded-lg border border-[#8B5CF6]/20 bg-[#10101C] p-1 w-fit">
          {(
            [
              { id: 'overview', en: 'Overview', fr: 'Vue générale' },
              { id: 'users', en: 'Users', fr: 'Utilisateurs' },
              { id: 'games', en: 'Games & Questions', fr: 'Jeux & Questions' },
              { id: 'subscriptions', en: 'Subscriptions & Payments', fr: 'Abonnements & Paiements' },
              { id: 'reports', en: 'Reports', fr: 'Signalements' },
            ] as const
          ).map((tItem) => (
            <button
              key={tItem.id}
              type="button"
              onClick={() => setTab(tItem.id)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                tab === tItem.id ? 'bg-[#8B5CF6] text-white' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              {language === 'fr' ? tItem.fr : tItem.en}
            </button>
          ))}
        </div>

        {tab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-4">
                <div className="text-xs text-[#9CA3AF]">Total Users</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#F8FAFC]">
                  {stats.totalUsers}
                </div>
              </div>
              <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-4">
                <div className="text-xs text-[#9CA3AF]">Active (24h)</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#F8FAFC]">
                  {stats.activeUsers}
                </div>
              </div>
              <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-4">
                <div className="text-xs text-[#9CA3AF]">Games Played</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#F8FAFC]">
                  {stats.totalGamesPlayed}
                </div>
              </div>
              <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-4">
                <div className="text-xs text-[#9CA3AF]">Active PLUS</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#A855F7]">
                  {stats.activeSubscriptions}
                </div>
              </div>
              <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-4">
                <div className="text-xs text-[#9CA3AF]">Verified Revenue ({stats.currency})</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-400">
                  {formatMoneyCents(stats.verifiedRevenueCents, stats.currency, { locale: language })}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6">
              <h3 className="font-display text-base font-bold text-[#F8FAFC] mb-4">
                {language === 'fr' ? 'Activité récente' : 'Recent Platform Activity'}
              </h3>
              {recentActivity.length === 0 ? (
                <p className="text-xs text-[#9CA3AF]">No matches recorded yet.</p>
              ) : (
                <div className="divide-y divide-[#8B5CF6]/10 text-xs">
                  {recentActivity.map((act) => (
                    <div key={act.sessionId} className="flex items-center justify-between py-2.5">
                      <span>
                        <strong className="text-[#F8FAFC]">@{act.username}</strong> · {act.gameSlug}
                      </span>
                      <span className="font-mono tabular-nums text-[#A855F7]">{act.score} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search username or email..."
                className="flex-1 rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2 text-sm text-[#F8FAFC]"
              />
              <button
                type="button"
                onClick={loadAll}
                className="rounded-lg bg-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white"
              >
                Search
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#8B5CF6]/15 text-[#9CA3AF]">
                  <tr>
                    <th className="py-2 pr-4">Username</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Tier</th>
                    <th className="py-2 pr-4">XP</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8B5CF6]/10">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2.5 pr-4 font-medium text-[#F8FAFC]">@{u.username}</td>
                      <td className="py-2.5 pr-4 text-[#9CA3AF]">{u.email}</td>
                      <td className="py-2.5 pr-4 uppercase text-[#A855F7]">{u.subscriptionStatus}</td>
                      <td className="py-2.5 pr-4 font-mono tabular-nums">{u.xp}</td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => toggleSuspend(u)}
                          className={`rounded px-2.5 py-1 text-xs ${
                            u.isSuspended
                              ? 'bg-emerald-600 text-white'
                              : 'border border-red-500/30 text-red-300'
                          }`}
                        >
                          {u.isSuspended ? 'Restore' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'games' && (
          <div className="space-y-6">
            <form
              onSubmit={addQuestion}
              className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-4"
            >
              <h3 className="font-display text-base font-bold text-[#F8FAFC]">Add Quiz Battle Question</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={newQCategory}
                  onChange={(e) => setNewQCategory(e.target.value as QuizCategory)}
                  className="rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3 py-2 text-xs text-[#F8FAFC]"
                >
                  <option value="general">General</option>
                  <option value="science">Science</option>
                  <option value="technology">Technology</option>
                  <option value="geography">Geography</option>
                  <option value="history">History</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="logic">Logic</option>
                </select>
                <select
                  value={newQDifficulty}
                  onChange={(e) => setNewQDifficulty(e.target.value as Difficulty)}
                  className="rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3 py-2 text-xs text-[#F8FAFC]"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <input
                type="text"
                required
                value={newQPromptEn}
                onChange={(e) => setNewQPromptEn(e.target.value)}
                placeholder="Question prompt (English)"
                className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2 text-sm text-[#F8FAFC]"
              />
              <input
                type="text"
                value={newQPromptFr}
                onChange={(e) => setNewQPromptFr(e.target.value)}
                placeholder="Question prompt (Français)"
                className="w-full rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3.5 py-2 text-sm text-[#F8FAFC]"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {newQOptions.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => {
                      const copy = [...newQOptions] as [string, string, string, string];
                      copy[idx] = e.target.value;
                      setNewQOptions(copy);
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3 py-2 text-xs text-[#F8FAFC]"
                  />
                ))}
              </div>
              <div className="flex items-center justify-between gap-4">
                <select
                  value={newQCorrect}
                  onChange={(e) => setNewQCorrect(Number(e.target.value))}
                  className="rounded-lg border border-[#8B5CF6]/25 bg-[#10101C] px-3 py-2 text-xs text-[#F8FAFC]"
                >
                  <option value={0}>Correct: Option 1</option>
                  <option value={1}>Correct: Option 2</option>
                  <option value={2}>Correct: Option 3</option>
                  <option value={3}>Correct: Option 4</option>
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white"
                >
                  Add Question
                </button>
              </div>
            </form>

            <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-3">
              <h3 className="font-display text-base font-bold text-[#F8FAFC]">
                Question Bank ({questions.length})
              </h3>
              <div className="divide-y divide-[#8B5CF6]/10 text-xs max-h-96 overflow-y-auto">
                {questions.map((q) => (
                  <div key={q.id} className="flex items-center justify-between gap-4 py-2.5">
                    <div>
                      <div className="text-[#F8FAFC] font-medium">{q.promptEn}</div>
                      <div className="text-[#9CA3AF] capitalize">
                        {q.category} · {q.difficulty}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteQuestion(q.id)}
                      aria-label="Delete question"
                      className="rounded p-1.5 text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-4">
              <h3 className="font-display text-base font-bold text-[#F8FAFC]">
                Configurable Plan Pricing (Integer Cents · USD)
              </h3>
              <div className="space-y-3">
                {plans.map((p) => {
                  const previewCents = editingPrice[p.id] ?? p.priceCents;
                  return (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-[#10101C] p-4 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#F8FAFC]">{p.nameEn}</div>
                        <div className="text-[#9CA3AF]">
                          {p.code} · {p.currency} ({p.intervalUnit}) · Preview:{' '}
                          <span className="font-mono text-[#A855F7]">
                            {formatMoneyCents(previewCents, p.currency, { locale: language })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[#9CA3AF]">Cents:</label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={previewCents}
                          onChange={(e) =>
                            setEditingPrice((prev) => ({
                              ...prev,
                              [p.id]: Math.max(0, Math.trunc(Number(e.target.value) || 0)),
                            }))
                          }
                          className="w-28 rounded border border-[#8B5CF6]/30 bg-[#151522] px-2.5 py-1.5 font-mono text-xs text-[#F8FAFC]"
                        />
                        <button
                          type="button"
                          onClick={() => savePlanPrice(p.id)}
                          className="rounded bg-[#8B5CF6] px-3 py-1.5 font-semibold text-white"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-3">
              <h3 className="font-display text-base font-bold text-[#F8FAFC]">Payment History</h3>
              {payments.length === 0 ? (
                <p className="text-xs text-[#9CA3AF]">No payment transactions yet.</p>
              ) : (
                <div className="divide-y divide-[#8B5CF6]/10 text-xs">
                  {payments.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <span>
                        <strong className="font-mono text-[#F8FAFC]">{p.reference}</strong> · @
                        {p.username} · <span className="text-[#9CA3AF]">{p.provider}</span>
                      </span>
                      <span className="font-mono text-[#A855F7]">
                        {formatMoneyCents(p.amountCents, p.currency, { locale: language })}{' '}
                        {p.currency} ({p.billingInterval}) · {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] p-6 space-y-3">
            <h3 className="font-display text-base font-bold text-[#F8FAFC]">Moderation Queue</h3>
            {reports.length === 0 ? (
              <p className="text-xs text-[#9CA3AF]">No open player reports.</p>
            ) : (
              <div className="divide-y divide-[#8B5CF6]/10 text-xs">
                {reports.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                    <div>
                      <div className="font-semibold text-[#F8FAFC]">
                        @{r.reportedUsername} reported by @{r.reporterUsername}
                      </div>
                      <div className="text-[#9CA3AF]">
                        {r.reason} · Status: {r.status}
                      </div>
                    </div>
                    {r.status === 'open' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateReport(r.id, 'resolved', true)}
                          className="rounded bg-red-600 px-3 py-1 text-white"
                        >
                          Suspend & Resolve
                        </button>
                        <button
                          type="button"
                          onClick={() => updateReport(r.id, 'dismissed', false)}
                          className="rounded border border-[#8B5CF6]/30 px-3 py-1 text-[#9CA3AF]"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
