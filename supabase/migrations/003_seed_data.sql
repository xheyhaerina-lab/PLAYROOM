-- ==============================================================================
-- PLAYROOM — Migration 003: Seed Games, Plans, Achievements & Starter Content
-- ==============================================================================

-- Games Catalog
INSERT INTO public.games (slug, title_en, title_fr, description_en, description_fr, category, supports_multiplayer, is_plus_only, base_xp)
VALUES
  ('quiz-battle', 'Quiz Battle', 'Quiz Battle', 'Fast-paced competitive trivia across 7 curated knowledge domains.', 'Quiz compétitif rapide couvrant 7 domaines de connaissances.', 'Trivia', TRUE, FALSE, 60),
  ('word-challenge', 'Word Challenge', 'Défi des Mots', 'Decode daily and timed vocabulary grids with strategic letter clues.', 'Déchiffrez des mots quotidiens et chronométrés avec des indices ciblés.', 'Vocabulary', TRUE, FALSE, 55),
  ('brain-test', 'Brain Test', 'Test Cérébral', 'Progressive logic sequences, pattern recognition, and memory drills.', 'Suites logiques progressives, reconnaissance de motifs et mémoire.', 'Logic', TRUE, FALSE, 65),
  ('mystery-room', 'Mystery Room', 'Chambre Mystère', 'Investigate evidence dossiers, cross-examine alibis, and solve cases.', 'Analysez les indices, comparez les alibis et résolvez l''enquête.', 'Deduction', FALSE, FALSE, 85)
ON CONFLICT (slug) DO NOTHING;

-- Subscription Plans (Configurable USD pricing stored in integer cents)
-- FREE: $0/month (0 cents) | PLUS Monthly: $4.99/month (499 cents) | PLUS Yearly: $39.99/year (3999 cents)
INSERT INTO public.subscription_plans (code, name_en, name_fr, description_en, description_fr, price_cents, currency, interval_unit, features_en, features_fr)
VALUES
  (
    'free',
    'FREE',
    'GRATUIT',
    'Essential solo and social play to get started.',
    'L''essentiel pour jouer en solo et entre amis.',
    0,
    'USD',
    'lifetime',
    '["Access to all 4 core games", "Solo mode & daily challenges", "Up to 2 private rooms per day", "Standard XP & global leaderboards"]'::jsonb,
    '["Accès aux 4 jeux principaux", "Mode solo et défis quotidiens", "Jusqu''à 2 salons privés par jour", "Progression XP et classements globaux"]'::jsonb
  ),
  (
    'plus_monthly',
    'PLAYROOM PLUS',
    'PLAYROOM PLUS',
    'Unlimited rooms, advanced analytics, exclusive mysteries & themes.',
    'Salons illimités, statistiques avancées, enquêtes et thèmes exclusifs.',
    499,
    'USD',
    'month',
    '["Unlimited private & custom rooms (up to 12 players)", "All Mystery Room case files & Hard challenges", "Advanced performance & category analytics", "Exclusive dark-violet profile badges & achievements", "Priority matchmaking & rematch lobbies"]'::jsonb,
    '["Salons privés illimités (jusqu''à 12 joueurs)", "Toutes les enquêtes Chambre Mystère et défis Difficiles", "Statistiques avancées par catégorie", "Badges et succès exclusifs PLAYROOM PLUS", "Matchmaking prioritaire et revanches instantanées"]'::jsonb
  ),
  (
    'plus_annual',
    'PLAYROOM PLUS YEARLY',
    'PLAYROOM PLUS ANNUEL',
    'Full PLAYROOM PLUS membership billed annually with 33% savings.',
    'Accès complet PLAYROOM PLUS facturé à l''année avec 33 % d''économie.',
    3999,
    'USD',
    'year',
    '["Everything in PLAYROOM PLUS Monthly", "Annual billing discount (33% savings vs monthly)", "Unlimited private & custom rooms (up to 12 players)", "All Mystery Room case files & Hard challenges", "Exclusive annual supporter badge & priority lobbies"]'::jsonb,
    '["Tout le contenu de PLAYROOM PLUS Mensuel", "Tarif annuel avantageux (33 % d''économie)", "Salons privés illimités (jusqu''à 12 joueurs)", "Toutes les enquêtes Chambre Mystère et défis Difficiles", "Badge annuel exclusif & revanches instantanées"]'::jsonb
  )
ON CONFLICT (code) DO NOTHING;

-- Achievements
INSERT INTO public.achievements (code, title_en, title_fr, description_en, description_fr, xp_reward, is_plus_exclusive, icon_name)
VALUES
  ('first_game', 'First Spark', 'Première Étincelle', 'Complete your very first game on PLAYROOM.', 'Terminez votre toute première partie sur PLAYROOM.', 50, FALSE, 'Play'),
  ('first_victory', 'First Victory', 'Première Victoire', 'Win your first competitive or high-score match.', 'Remportez votre première victoire.', 75, FALSE, 'Trophy'),
  ('ten_games', 'Seasoned Contender', 'Joueur Aguerri', 'Complete 10 games across any game mode.', 'Terminez 10 parties dans n''importe quel mode.', 150, FALSE, 'Flame'),
  ('daily_master', 'Daily Challenger', 'Fidèle au Poste', 'Complete a Daily Challenge.', 'Terminez un Défi Quotidien.', 100, FALSE, 'CalendarCheck'),
  ('multiplayer_champion', 'Room Champion', 'Champion du Salon', 'Win a multiplayer room match against other players.', 'Gagnez une partie multijoueur contre d''autres joueurs.', 200, FALSE, 'Crown'),
  ('puzzle_master', 'Puzzle Architect', 'Maître Logicien', 'Score 85%+ accuracy in Brain Test or Mystery Room.', 'Obtenez au moins 85% de réussite dans Test Cérébral ou Chambre Mystère.', 180, FALSE, 'Brain'),
  ('plus_elite', 'PLAYROOM PLUS Vanguard', 'Avant-Garde PLUS', 'Activate PLAYROOM PLUS and complete a premium challenge.', 'Activez PLAYROOM PLUS et terminez un défi premium.', 250, TRUE, 'Sparkles')
ON CONFLICT (code) DO NOTHING;

-- Today's initial Daily Challenge
INSERT INTO public.daily_challenges (challenge_date, game_slug, difficulty, title_en, title_fr, description_en, description_fr, target_score, xp_reward, is_plus_only)
VALUES
  (CURRENT_DATE, 'quiz-battle', 'medium', 'Global Knowledge Sprint', 'Sprint Culture Générale', 'Score at least 300 points in a 5-round mixed Quiz Battle.', 'Obtenez au moins 300 points dans un Quiz Battle en 5 manches.', 300, 150, FALSE)
ON CONFLICT (challenge_date) DO NOTHING;
