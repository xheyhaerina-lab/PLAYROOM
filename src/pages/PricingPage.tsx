import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { PublicLayout } from '../layouts/PublicLayout.tsx';
import { apiRequest } from '../lib/api.ts';
import type { SubscriptionPlan } from '../types/playroom.ts';
import { formatMoneyCents } from '../utils/currency.ts';

export const PricingPage: React.FC = () => {
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ plans: SubscriptionPlan[] }>('/plans')
      .then((res) => setPlans(res.plans))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F8FAFC]">
            {language === 'fr' ? 'Des offres internationales en USD' : 'Simple, international USD membership tiers'}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#9CA3AF]">
            {language === 'fr'
              ? 'Commencez gratuitement et passez à PLAYROOM PLUS (mensuel ou annuel) pour débloquer les salons illimités et les enquêtes avancées.'
              : 'Play for free with friends or upgrade to PLAYROOM PLUS monthly or yearly for unlimited custom rooms and exclusive content.'}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-80 rounded-xl bg-[#151522] animate-pulse" />
            <div className="h-80 rounded-xl bg-[#151522] animate-pulse" />
            <div className="h-80 rounded-xl bg-[#151522] animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => {
              const isPlus = plan.code !== 'free';
              const isAnnual = plan.code === 'plus_annual';
              const features = language === 'fr' ? plan.featuresFr : plan.featuresEn;
              const intervalLabel =
                plan.intervalUnit === 'year'
                  ? language === 'fr'
                    ? 'an'
                    : 'year'
                  : language === 'fr'
                    ? 'mois'
                    : 'month';

              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-7 flex flex-col justify-between bg-[#151522] ${
                    isAnnual
                      ? 'border-[#A855F7]/70'
                      : isPlus
                        ? 'border-[#8B5CF6]/45'
                        : 'border-[#8B5CF6]/15'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display text-xl font-bold text-[#F8FAFC]">
                        {language === 'fr' ? plan.nameFr : plan.nameEn}
                      </h2>
                      {isPlus && <Crown className="w-5 h-5 text-[#A855F7] shrink-0" />}
                    </div>
                    <p className="mt-2 text-sm text-[#9CA3AF]">
                      {language === 'fr' ? plan.descriptionFr : plan.descriptionEn}
                    </p>
                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="font-display text-4xl font-bold tabular-nums text-[#F8FAFC]">
                        {formatMoneyCents(plan.priceCents, plan.currency, {
                          compactZero: true,
                          locale: language,
                        })}
                      </span>
                      <span className="text-xs text-[#9CA3AF]">
                        / {intervalLabel} {plan.currency}
                      </span>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-sm text-[#F8FAFC]">
                          <Check className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8">
                    <Link
                      to={
                        isAuthenticated
                          ? isPlus
                            ? `/subscription?plan=${plan.code}`
                            : '/dashboard'
                          : '/register'
                      }
                      className={`inline-flex w-full items-center justify-center rounded-lg py-3 text-sm font-semibold transition-colors ${
                        isPlus
                          ? 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
                          : 'border border-[#8B5CF6]/30 text-[#F8FAFC] hover:border-[#8B5CF6]/60'
                      }`}
                    >
                      {isAnnual
                        ? language === 'fr'
                          ? 'Choisir l’offre annuelle'
                          : 'Choose Yearly Plan'
                        : isPlus
                          ? language === 'fr'
                            ? 'Passer à PLAYROOM PLUS'
                            : 'Choose Monthly Plan'
                          : language === 'fr'
                            ? 'Commencer gratuitement'
                            : 'Get started free'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};
