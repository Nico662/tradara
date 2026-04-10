export const BADGES = [
  // Habilidad
  { id: 'sniper',        icon: '🎯', name: 'Sniper',        desc: '5 correct in a row',           secret: false },
  { id: 'on_fire',       icon: '🔥', name: 'On Fire',       desc: '10 correct in a row',           secret: false },
  { id: 'big_brain',     icon: '🧠', name: 'Big Brain',     desc: '90%+ accuracy in a game',       secret: false },
  { id: 'diamond_hands', icon: '💎', name: 'Diamond Hands', desc: '3 correct No Trades in a row',  secret: false },

  // Activos
  { id: 'bitcoin_maxi',  icon: '₿',  name: 'Bitcoin Maxi',  desc: 'Correct on BTC 10 times',       secret: false },
  { id: 'forex_king',    icon: '💱', name: 'Forex King',    desc: '5 forex correct in a row',      secret: false },
  { id: 'all_rounder',   icon: '🌍', name: 'All Rounder',   desc: 'Correct in every category',     secret: false },

  // Constancia
  { id: 'consistent',    icon: '📅', name: 'Consistent',    desc: '3 day streak',                  secret: false },
  { id: 'dedicated',     icon: '🗓️', name: 'Dedicated',     desc: '7 day streak',                  secret: false },
  { id: 'legend',        icon: '👑', name: 'Legend',        desc: '30 day streak',                 secret: false },

  // Arena
  { id: 'first_blood',   icon: '⚔️', name: 'First Blood',   desc: 'First Arena win',               secret: false },
  { id: 'dominator',     icon: '👹', name: 'Dominator',     desc: 'Win 5 Arena matches',           secret: false },
  { id: 'unbeatable',    icon: '🤝', name: 'Unbeatable',    desc: 'Win Arena without missing',     secret: false },

  { id: 'daily_streak_3',  icon: '📅', name: 'Daily Grinder',  desc: 'Complete daily challenge 3 days in a row',  secret: false },
  { id: 'daily_streak_7',  icon: '🗓️', name: 'Week Warrior',   desc: 'Complete daily challenge 7 days in a row',  secret: false },
  { id: 'daily_streak_30', icon: '👑', name: 'Market Oracle',  desc: 'Complete daily challenge 30 days in a row', secret: false },
];

export function getUnlocked() {
  try {
    return JSON.parse(localStorage.getItem('tradara_badges') || '[]');
  } catch { return []; }
}

export function unlockBadge(id) {
  const unlocked = getUnlocked();
  if (unlocked.includes(id)) return false; // ya tiene el badge
  unlocked.push(id);
  localStorage.setItem('tradara_badges', JSON.stringify(unlocked));
  return true; // badge nuevo
}