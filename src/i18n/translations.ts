import type { Language } from '../types/playroom.ts';

export interface TranslationDictionary {
  nav: {
    home: string;
    games: string;
    howItWorks: string;
    pricing: string;
    login: string;
    getStarted: string;
    dashboard: string;
    multiplayer: string;
    leaderboards: string;
    challenges: string;
    friends: string;
    achievements: string;
    subscription: string;
    settings: string;
    notifications: string;
    admin: string;
    logout: string;
    profile: string;
  };
  hero: {
    headline: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  };
  landing: {
    featuredTitle: string;
    featuredSub: string;
    howTitle: string;
    howStep1Title: string;
    howStep1Desc: string;
    howStep2Title: string;
    howStep2Desc: string;
    howStep3Title: string;
    howStep3Desc: string;
    multiplayerTitle: string;
    multiplayerDesc: string;
    dailyTitle: string;
    dailyDesc: string;
    leaderboardTitle: string;
    leaderboardDesc: string;
    plusTitle: string;
    plusDesc: string;
    faqTitle: string;
    playSolo: string;
    createRoom: string;
    upgradePlus: string;
  };
  common: {
    loading: string;
    save: string;
    cancel: string;
    submit: string;
    replay: string;
    back: string;
    search: string;
    easy: string;
    medium: string;
    hard: string;
    score: string;
    xp: string;
    level: string;
    wins: string;
    gamesPlayed: string;
    free: string;
    plus: string;
    installApp: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  en: {
    nav: {
      home: 'Home',
      games: 'Games',
      howItWorks: 'How it works',
      pricing: 'Pricing',
      login: 'Login',
      getStarted: 'Get started',
      dashboard: 'Dashboard',
      multiplayer: 'Multiplayer',
      leaderboards: 'Leaderboards',
      challenges: 'Daily Challenges',
      friends: 'Friends',
      achievements: 'Achievements',
      subscription: 'PLAYROOM PLUS',
      settings: 'Settings',
      notifications: 'Notifications',
      admin: 'Admin',
      logout: 'Sign out',
      profile: 'Profile',
    },
    hero: {
      headline: 'Your world. Your games. Your PLAYROOM.',
      subtitle: 'Challenge your mind, compete with friends and discover a new way to play.',
      primaryCta: 'Start Playing',
      secondaryCta: 'Explore Games',
    },
    landing: {
      featuredTitle: 'Four original games built for focus and competition',
      featuredSub: 'Play solo to sharpen your skills or launch a private multiplayer room in seconds.',
      howTitle: 'How PLAYROOM works',
      howStep1Title: '01. Choose a game mode',
      howStep1Desc: 'Pick Quiz Battle, Word Challenge, Brain Test, or Mystery Room across three difficulty tiers.',
      howStep2Title: '02. Play solo or open a room',
      howStep2Desc: 'Generate a room code, invite friends, and compete with live server-verified scoring.',
      howStep3Title: '03. Earn XP and climb ranks',
      howStep3Desc: 'Complete UTC daily challenges, unlock achievements, and track progress across global leaderboards.',
      multiplayerTitle: 'Real-time private & public rooms',
      multiplayerDesc: 'Create a custom lobby in one click, manage ready states, and race against friends with synchronized timers and anti-cheat scoring.',
      dailyTitle: 'Daily UTC challenges',
      dailyDesc: 'A fresh objective resets every day at 00:00 UTC with bonus XP rewards and completion tracking.',
      leaderboardTitle: 'Verified global leaderboards',
      leaderboardDesc: 'Filter real player rankings across Daily, Weekly, Monthly, and All-Time standings.',
      plusTitle: 'PLAYROOM PLUS',
      plusDesc: 'Unlock unlimited private rooms up to 12 players, exclusive mystery dossiers, advanced stats, and custom profile recognition.',
      faqTitle: 'Frequently asked questions',
      playSolo: 'Play now',
      createRoom: 'Create room',
      upgradePlus: 'View plans',
    },
    common: {
      loading: 'Loading...',
      save: 'Save changes',
      cancel: 'Cancel',
      submit: 'Submit',
      replay: 'Play again',
      back: 'Back',
      search: 'Search',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      score: 'Score',
      xp: 'XP',
      level: 'Level',
      wins: 'Wins',
      gamesPlayed: 'Games played',
      free: 'Free',
      plus: 'PLUS',
      installApp: 'Install App',
    },
  },
  fr: {
    nav: {
      home: 'Accueil',
      games: 'Jeux',
      howItWorks: 'Fonctionnement',
      pricing: 'Tarifs',
      login: 'Connexion',
      getStarted: 'Commencer',
      dashboard: 'Tableau de bord',
      multiplayer: 'Multijoueur',
      leaderboards: 'Classements',
      challenges: 'Défis du jour',
      friends: 'Amis',
      achievements: 'Succès',
      subscription: 'PLAYROOM PLUS',
      settings: 'Paramètres',
      notifications: 'Notifications',
      admin: 'Administration',
      logout: 'Déconnexion',
      profile: 'Profil',
    },
    hero: {
      headline: 'Your world. Your games. Your PLAYROOM.',
      subtitle: 'Stimulez votre esprit, défiez vos amis et découvrez une nouvelle façon de jouer.',
      primaryCta: 'Commencer à jouer',
      secondaryCta: 'Explorer les jeux',
    },
    landing: {
      featuredTitle: 'Quatre jeux originaux conçus pour la réflexion et la compétition',
      featuredSub: 'Jouez en solo pour progresser ou créez un salon multijoueur privé en quelques secondes.',
      howTitle: 'Comment fonctionne PLAYROOM',
      howStep1Title: '01. Choisissez un mode de jeu',
      howStep1Desc: 'Sélectionnez Quiz Battle, Défi des Mots, Test Cérébral ou Chambre Mystère sur trois niveaux.',
      howStep2Title: '02. Jouez en solo ou en salon',
      howStep2Desc: 'Générez un code de salon, invitez vos amis et affrontez-vous avec un calcul de score côté serveur.',
      howStep3Title: '03. Gagnez de l’XP et progressez',
      howStep3Desc: 'Relevez les défis quotidiens UTC, débloquez des succès et grimpez dans les classements.',
      multiplayerTitle: 'Salons privés et publics en temps réel',
      multiplayerDesc: 'Créez un lobby en un clic, gérez l’état prêt des joueurs et jouez avec chronomètre synchronisé.',
      dailyTitle: 'Défis quotidiens UTC',
      dailyDesc: 'Un nouvel objectif est réinitialisé chaque jour à 00h00 UTC avec des bonus d’XP.',
      leaderboardTitle: 'Classements mondiaux vérifiés',
      leaderboardDesc: 'Consultez les classements réels par jour, semaine, mois et historique global.',
      plusTitle: 'PLAYROOM PLUS',
      plusDesc: 'Débloquez les salons privés illimités jusqu’à 12 joueurs, les enquêtes exclusives et les statistiques avancées.',
      faqTitle: 'Questions fréquentes',
      playSolo: 'Jouer',
      createRoom: 'Créer un salon',
      upgradePlus: 'Voir les offres',
    },
    common: {
      loading: 'Chargement...',
      save: 'Enregistrer',
      cancel: 'Annuler',
      submit: 'Valider',
      replay: 'Rejouer',
      back: 'Retour',
      search: 'Rechercher',
      easy: 'Facile',
      medium: 'Moyen',
      hard: 'Difficile',
      score: 'Score',
      xp: 'XP',
      level: 'Niveau',
      wins: 'Victoires',
      gamesPlayed: 'Parties jouées',
      free: 'Gratuit',
      plus: 'PLUS',
      installApp: 'Installer l’app',
    },
  },
};
