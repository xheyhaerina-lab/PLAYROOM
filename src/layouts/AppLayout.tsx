import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Award,
  Bell,
  CalendarCheck,
  Crown,
  Gamepad2,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Trophy,
  User,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { apiRequest } from '../lib/api.ts';
import type { AppNotification } from '../types/playroom.ts';
import { OfflineIndicator, PWAInstallButton } from '../components/PWAComponents.tsx';

export const AppLayout: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  const { user, isAdmin, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    apiRequest<{ notifications: AppNotification[] }>('/notifications')
      .then((res) => {
        if (active) {
          setUnreadCount(res.notifications.filter((n) => !n.isRead).length);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [title]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navGroups = [
    {
      label: language === 'fr' ? 'Jouer' : 'Play',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, text: t.nav.dashboard },
        { to: '/games', icon: Gamepad2, text: t.nav.games },
        { to: '/multiplayer', icon: UsersRound, text: t.nav.multiplayer },
        { to: '/challenges', icon: CalendarCheck, text: t.nav.challenges },
      ],
    },
    {
      label: language === 'fr' ? 'Compétition & Social' : 'Compete & Social',
      items: [
        { to: '/leaderboards', icon: Trophy, text: t.nav.leaderboards },
        { to: '/achievements', icon: Award, text: t.nav.achievements },
        { to: '/friends', icon: Users, text: t.nav.friends },
        { to: '/notifications', icon: Bell, text: t.nav.notifications, badge: unreadCount },
      ],
    },
    {
      label: language === 'fr' ? 'Compte' : 'Account',
      items: [
        { to: '/profile', icon: User, text: t.nav.profile },
        { to: '/subscription', icon: Crown, text: t.nav.subscription },
        { to: '/settings', icon: Settings, text: t.nav.settings },
      ],
    },
  ];

  const renderNavContent = () => (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2 pt-1">
          <Link to="/dashboard" className="font-display text-lg font-bold tracking-tight text-[#F8FAFC]">
            PLAYROOM
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden rounded-lg p-1.5 text-[#9CA3AF] hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 mb-1.5 text-xs font-medium text-[#9CA3AF]">{group.label}</div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                          isActive
                            ? 'bg-[#8B5CF6]/15 text-[#F8FAFC]'
                            : 'text-[#9CA3AF] hover:bg-[#151522] hover:text-[#F8FAFC]'
                        }`
                      }
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.text}</span>
                      </span>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="font-mono text-xs tabular-nums text-[#A855F7]">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          {isAdmin && (
            <div>
              <div className="px-3 mb-1.5 text-xs font-medium text-[#9CA3AF]">
                {language === 'fr' ? 'Administration' : 'Administration'}
              </div>
              <NavLink
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#8B5CF6]/15 text-[#F8FAFC]'
                      : 'text-[#9CA3AF] hover:bg-[#151522] hover:text-[#F8FAFC]'
                  }`
                }
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>{t.nav.admin}</span>
              </NavLink>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 border-t border-[#8B5CF6]/15 pt-4">
        <PWAInstallButton variant="full" />
        <div className="flex items-center justify-between px-2 text-xs text-[#9CA3AF]">
          <span className="truncate font-medium text-[#F8FAFC]">{user?.displayName}</span>
          <span className="font-mono tabular-nums">Lv.{user?.level ?? 1}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#9CA3AF] hover:bg-[#151522] hover:text-[#F8FAFC] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.nav.logout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#080810] text-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[#8B5CF6]/15 bg-[#10101C]">
        <div className="sticky top-0 h-screen overflow-y-auto">{renderNavContent()}</div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 bg-[#10101C] border-r border-[#8B5CF6]/15 h-full overflow-y-auto">
            {renderNavContent()}
          </div>
          <div
            className="flex-1 bg-black/70"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-[#8B5CF6]/15 bg-[#080810]/90 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#151522] hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-display text-sm sm:text-base font-semibold text-[#F8FAFC] truncate">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9CA3AF] hover:text-[#F8FAFC] transition-colors whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language.toUpperCase()}</span>
            </button>

            <Link
              to="/subscription"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-[#A855F7] hover:text-[#F8FAFC] transition-colors whitespace-nowrap"
            >
              <span>{user?.subscriptionStatus === 'plus' ? 'PLAYROOM PLUS' : t.common.free}</span>
            </Link>

            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-lg border border-[#8B5CF6]/20 bg-[#151522] px-3 py-1.5 text-xs font-medium text-[#F8FAFC] hover:border-[#8B5CF6]/50 transition-colors whitespace-nowrap"
            >
              <span className="font-mono tabular-nums text-[#8B5CF6]">{user?.xp ?? 0} XP</span>
              <span aria-hidden="true" className="text-[#9CA3AF]">·</span>
              <span className="max-w-[100px] truncate">{user?.username}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      <OfflineIndicator />
    </div>
  );
};
