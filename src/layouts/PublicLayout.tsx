import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { OfflineIndicator, PWAInstallButton } from '../components/PWAComponents.tsx';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLanding = location.pathname === '/';

  const scrollOrLink = (hash: string) => {
    setMobileMenuOpen(false);
    if (isLanding) {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080810] text-[#F8FAFC]">
      <header className="sticky top-0 z-40 border-b border-[#8B5CF6]/15 bg-[#080810]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 h-16">
          {/* Zone 1: Single-line brand wordmark */}
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-[#F8FAFC] whitespace-nowrap shrink-0"
          >
            PLAYROOM
          </Link>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#9CA3AF]">
            <Link
              to="/"
              className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0"
            >
              {t.nav.home}
            </Link>
            {isLanding ? (
              <a
                href="#games"
                onClick={(e) => {
                  e.preventDefault();
                  scrollOrLink('games');
                }}
                className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.games}
              </a>
            ) : (
              <Link
                to="/#games"
                className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.games}
              </Link>
            )}
            {isLanding ? (
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  scrollOrLink('how-it-works');
                }}
                className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.howItWorks}
              </a>
            ) : (
              <Link
                to="/#how-it-works"
                className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.howItWorks}
              </Link>
            )}
            <Link
              to="/pricing"
              className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0"
            >
              {t.nav.pricing}
            </Link>
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
              aria-label="Switch language"
              className="inline-flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language.toUpperCase()}</span>
            </button>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.login}
              </Link>
            )}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="hidden sm:inline-flex items-center justify-center rounded-lg bg-[#8B5CF6] px-4 py-2 text-sm font-medium text-white hover:bg-[#7C3AED] transition-colors whitespace-nowrap shrink-0"
            >
              {isAuthenticated ? t.nav.dashboard : t.nav.getStarted}
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="lg:hidden inline-flex items-center justify-center rounded-lg border border-[#8B5CF6]/20 p-2 text-[#F8FAFC] hover:bg-[#151522]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#8B5CF6]/15 bg-[#10101C] px-4 py-4 space-y-3">
            <div className="flex flex-col space-y-2 text-sm font-medium text-[#9CA3AF]">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#F8FAFC]">
                {t.nav.home}
              </Link>
              <Link to="/#games" onClick={() => scrollOrLink('games')} className="py-2 hover:text-white">
                {t.nav.games}
              </Link>
              <Link to="/#how-it-works" onClick={() => scrollOrLink('how-it-works')} className="py-2 hover:text-white">
                {t.nav.howItWorks}
              </Link>
              <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-white">
                {t.nav.pricing}
              </Link>
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
                className="flex items-center gap-2 py-2 text-left hover:text-white"
              >
                <Globe className="w-4 h-4" />
                <span>{language === 'en' ? 'Français (FR)' : 'English (EN)'}</span>
              </button>
              {!isAuthenticated ? (
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg border border-[#8B5CF6]/30 py-2.5 text-center text-[#F8FAFC]"
                  >
                    {t.nav.login}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg bg-[#8B5CF6] py-2.5 text-center text-white"
                  >
                    {t.nav.getStarted}
                  </Link>
                </div>
              ) : (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-[#8B5CF6] py-2.5 text-center text-white"
                >
                  {t.nav.dashboard}
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#8B5CF6]/15 bg-[#080810] py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <span className="font-display text-base font-bold text-[#F8FAFC]">PLAYROOM</span>
            <p className="mt-2 text-xs text-[#9CA3AF] max-w-sm">
              {language === 'fr'
                ? 'Plateforme de jeux sociaux, défis logiques et salons multijoueurs en temps réel.'
                : 'Social gaming platform for competitive brain games and real-time multiplayer rooms.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#9CA3AF]">
            <Link to="/pricing" className="hover:text-[#F8FAFC] transition-colors">
              {t.nav.pricing}
            </Link>
            <Link to="/terms" className="hover:text-[#F8FAFC] transition-colors">
              {language === 'fr' ? 'Conditions d’utilisation' : 'Terms of Service'}
            </Link>
            <Link to="/privacy" className="hover:text-[#F8FAFC] transition-colors">
              {language === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy'}
            </Link>
            <PWAInstallButton />
          </div>
        </div>
        <div className="mx-auto max-w-7xl mt-8 pt-6 border-t border-[#8B5CF6]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9CA3AF]">
          <span>© {new Date().getFullYear()} PLAYROOM.</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={language === 'en' ? 'text-[#F8FAFC] font-medium' : 'hover:text-[#F8FAFC]'}
            >
              English
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setLanguage('fr')}
              className={language === 'fr' ? 'text-[#F8FAFC] font-medium' : 'hover:text-[#F8FAFC]'}
            >
              Français
            </button>
          </div>
        </div>
      </footer>

      <OfflineIndicator />
    </div>
  );
};
