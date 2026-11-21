import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { AppLayout } from '../layouts/AppLayout.tsx';
import { apiRequest } from '../lib/api.ts';
import type { GameCatalogItem } from '../types/playroom.ts';

export const GameLibraryPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [games, setGames] = useState<GameCatalogItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'multiplayer' | 'solo'>('all');

  useEffect(() => {
    apiRequest<{ games: GameCatalogItem[] }>('/games')
      .then((res) => setGames(res.games))
      .catch(() => {});
  }, []);

  const filtered = games.filter((g) => {
    if (filter === 'multiplayer') return g.supportsMultiplayer;
    if (filter === 'solo') return !g.supportsMultiplayer || true;
    return true;
  });

  return (
    <AppLayout title={t.nav.games}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">
              {language === 'fr' ? 'Bibliothèque de jeux' : 'Game Library'}
            </h2>
            <p className="mt-1 text-sm text-[#9CA3AF]">
              {language === 'fr'
                ? 'Choisissez un jeu pour jouer en solo ou créer un salon avec des amis.'
                : 'Select any title to play solo or launch a real-time multiplayer room.'}
            </p>
          </div>

          <div className="inline-flex items-center gap-1 rounded-lg border border-[#8B5CF6]/20 bg-[#10101C] p-1 self-start">
            {(
              [
                { id: 'all', en: 'All Games', fr: 'Tous' },
                { id: 'multiplayer', en: 'Multiplayer', fr: 'Multijoueur' },
                { id: 'solo', en: 'Solo Ready', fr: 'Solo' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  filter === tab.id ? 'bg-[#8B5CF6] text-white' : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {language === 'fr' ? tab.fr : tab.en}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((game) => (
            <div
              key={game.slug}
              className="rounded-xl border border-[#8B5CF6]/20 bg-[#151522] overflow-hidden flex flex-col sm:flex-row"
            >
              <div className="sm:w-48 aspect-[4/3] sm:aspect-auto bg-[#10101C] shrink-0">
                <img
                  src={game.imageUrl}
                  alt={language === 'fr' ? game.titleFr : game.titleEn}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-[#9CA3AF] mb-1">{game.category}</div>
                  <h3 className="font-display text-xl font-bold text-[#F8FAFC]">
                    {language === 'fr' ? game.titleFr : game.titleEn}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
                    {language === 'fr' ? game.descriptionFr : game.descriptionEn}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#8B5CF6]/10 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono text-xs tabular-nums text-[#A855F7]">
                    +{game.baseXp} Base XP
                  </span>
                  <div className="flex items-center gap-2">
                    {game.supportsMultiplayer && (
                      <Link
                        to="/multiplayer/create"
                        className="rounded-lg border border-[#8B5CF6]/30 px-3 py-1.5 text-xs font-medium text-[#F8FAFC] hover:border-[#8B5CF6]/60"
                      >
                        {language === 'fr' ? 'Salon' : 'Room'}
                      </Link>
                    )}
                    <Link
                      to={`/games/${game.slug}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#8B5CF6] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#7C3AED]"
                    >
                      <span>{t.landing.playSolo}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};
