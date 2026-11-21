import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { PublicLayout } from '../layouts/PublicLayout.tsx';

export const TermsPage: React.FC = () => {
  const { language } = useLanguage();
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 space-y-6">
        <h1 className="font-display text-3xl font-bold text-[#F8FAFC]">
          {language === 'fr' ? 'Conditions Générales d’Utilisation' : 'Terms of Service'}
        </h1>
        <p className="text-sm text-[#9CA3AF] leading-relaxed">
          {language === 'fr'
            ? 'En accédant à PLAYROOM, vous acceptez de respecter les règles de fair-play, de ne pas tenter de manipuler les scores côté client et de respecter les autres joueurs dans les salons multijoueurs.'
            : 'By using PLAYROOM, you agree to compete fairly, refrain from automated score tampering or exploitation, and maintain respectful conduct across public and private multiplayer rooms.'}
        </p>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#F8FAFC]">
            {language === 'fr' ? '1. Comptes et intégrité' : '1. Accounts & Fair Play'}
          </h2>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            {language === 'fr'
              ? 'Tous les calculs de scores, points XP et récompenses de défis quotidiens sont validés côté serveur. Les comptes impliqués dans des abus peuvent être suspendus par la modération.'
              : 'All match scores, XP rewards, and daily challenge completions are validated server-side. Accounts engaging in abuse or automated tampering may be suspended by moderation.'}
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#F8FAFC]">
            {language === 'fr' ? '2. Abonnements PLAYROOM PLUS' : '2. PLAYROOM PLUS Subscriptions'}
          </h2>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            {language === 'fr'
              ? 'Les offres PLAYROOM PLUS sont facturées en USD et ne sont activées qu’après vérification cryptographique côté serveur auprès de notre prestataire Merchant of Record. Vous pouvez annuler le renouvellement à tout moment depuis votre espace abonnement.'
              : 'PLAYROOM PLUS memberships are billed in USD and granted only after verified server-side confirmation from our Merchant of Record payment provider. You can cancel future renewals at any time from your Subscription Management panel.'}
          </p>
        </section>
      </div>
    </PublicLayout>
  );
};

export const PrivacyPage: React.FC = () => {
  const { language } = useLanguage();
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 space-y-6">
        <h1 className="font-display text-3xl font-bold text-[#F8FAFC]">
          {language === 'fr' ? 'Politique de Confidentialité' : 'Privacy Policy'}
        </h1>
        <p className="text-sm text-[#9CA3AF] leading-relaxed">
          {language === 'fr'
            ? 'PLAYROOM protège vos données personnelles. Votre adresse e-mail et votre historique de paiement ne sont jamais exposés aux autres joueurs.'
            : 'PLAYROOM protects your account data. Private email addresses and billing transaction logs are never exposed to other players or public profile views.'}
        </p>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#F8FAFC]">
            {language === 'fr' ? '1. Visibilité du profil' : '1. Profile Visibility'}
          </h2>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            {language === 'fr'
              ? 'Vous pouvez basculer la visibilité de votre profil public dans les Paramètres à tout moment.'
              : 'You can toggle whether your profile appears in player search and public leaderboards at any time in Settings.'}
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[#F8FAFC]">
            {language === 'fr' ? '2. Sécurité des paiements' : '2. Payment Security'}
          </h2>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            {language === 'fr'
              ? 'PLAYROOM ne stocke aucun numéro de carte bancaire ou identifiant sensible de paiement sur ses serveurs. Seules les références de transaction et factures USD vérifiées sont conservées.'
              : 'PLAYROOM never stores raw credit card numbers or sensitive payment credentials on application servers. Only verified USD transaction identifiers and subscription statuses are retained.'}
          </p>
        </section>
      </div>
    </PublicLayout>
  );
};
