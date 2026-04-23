export const BADGES = [
  // Habilidad
  { id: 'sniper',        icon: '🎯', name: 'Sniper',        desc: '5 correct in a row',           secret: false },
  { id: 'on_fire',       icon: '🔥', name: 'On Fire',       desc: '10 correct in a row',           secret: false },
  { id: 'big_brain',     icon: '🧠', name: 'Big Brain',     desc: '90%+ accuracy in a game',       secret: false },
  { id: 'diamond_hands', icon: '💎', name: 'Diamond Hands', desc: '3 correct No Trades in a row',  secret: false },
  { id: 'perfectionist', icon: '🎯', name: 'Perfectionist', desc: 'Finish a 25-round game with 100% accuracy', secret: false },

  // Activos
  { id: 'bitcoin_maxi',  icon: '₿',  name: 'Bitcoin Maxi',  desc: 'Correct on BTC 10 times',       secret: false },
  { id: 'forex_king',    icon: '💱', name: 'Forex King',    desc: '5 forex correct in a row',      secret: false },
  { id: 'all_rounder',   icon: '🌍', name: 'All Rounder',   desc: 'Correct in every category',     secret: false },
  { id: 'whale',         icon: '🐋', name: 'Whale',         desc: 'Correct on 3 assets above $10k in one game', secret: true },

  // Constancia
  { id: 'consistent',    icon: '📅', name: 'Consistent',    desc: '3 day streak',                  secret: false },
  { id: 'dedicated',     icon: '🗓️', name: 'Dedicated',     desc: '7 day streak',                  secret: false },
  { id: 'legend',        icon: '👑', name: 'Legend',        desc: '30 day streak',                 secret: false },
  { id: 'early_bird',    icon: '🌅', name: 'Early Bird',    desc: 'Play daily challenge before 9AM', secret: false },
  { id: 'perfect_week',  icon: '⚡', name: 'Perfect Week',  desc: 'Complete daily challenge all 7 days of a week', secret: false },

  // Daily
  { id: 'daily_streak_3',  icon: '📅', name: 'Daily Grinder',  desc: 'Complete daily challenge 3 days in a row',  secret: false },
  { id: 'daily_streak_7',  icon: '🗓️', name: 'Week Warrior',   desc: 'Complete daily challenge 7 days in a row',  secret: false },
  { id: 'daily_streak_30', icon: '👑', name: 'Market Oracle',  desc: 'Complete daily challenge 30 days in a row', secret: false },

  // Arena
  { id: 'first_blood',   icon: '⚔️', name: 'First Blood',   desc: 'First Arena win',               secret: false },
  { id: 'dominator',     icon: '👹', name: 'Dominator',     desc: 'Win 5 Arena matches',           secret: false },
  { id: 'unbeatable',    icon: '🤝', name: 'Unbeatable',    desc: 'Win Arena without missing',     secret: false },
  { id: 'recruiter',     icon: '📢', name: 'Recruiter',     desc: 'Play Arena in a private room',  secret: false },

  // Social
  { id: 'screenshot_ready', icon: '📸', name: 'Screenshot Ready', desc: 'Share your result 3 times', secret: false },
  { id: 'top_10',           icon: '🏅', name: 'Top 10',           desc: 'Reach top 10 in weekly tournament', secret: false },

  // Histórico
  { id: 'historian',     icon: '📜', name: 'Historian',     desc: 'Complete 10 historical events', secret: false },
  { id: 'time_traveler', icon: '🕰️', name: 'Time Traveler', desc: 'Complete all 50 historical events', secret: false },

  // Secretos
  { id: 'ghost',         icon: '👻', name: '???',           desc: 'Nobody knows...',               secret: true },
  { id: 'rekt',          icon: '💀', name: 'Rekt',          desc: 'Lose 10 rounds in a row',       secret: true },
];

export function getUnlocked() {
  try {
    return JSON.parse(localStorage.getItem('tradara_badges') || '[]');
  } catch { return []; }
}

export function unlockBadge(id) {
  const unlocked = getUnlocked();
  if (unlocked.includes(id)) return false;
  unlocked.push(id);
  localStorage.setItem('tradara_badges', JSON.stringify(unlocked));
  return true;
}