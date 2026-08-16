export const LEVELS = [
  { id: 'rookie',      name: 'Rookie',      xp: 0      },
  { id: 'trader',      name: 'Trader',      xp: 1000   },
  { id: 'pro',         name: 'Pro',         xp: 5000   },
  { id: 'expert',      name: 'Expert',      xp: 15000  },
  { id: 'legend',      name: 'Legend',      xp: 40000  },
  { id: 'legend_2',    name: 'Legend II',   xp: 75000  },
  { id: 'legend_3',    name: 'Legend III',  xp: 120000 },
  { id: 'master',      name: 'Master',      xp: 200000 },
  { id: 'grandmaster', name: 'Grandmaster', xp: 350000 },
  { id: 'goat',        name: 'G.O.A.T',     xp: 500000 },
];

export function getXP() {
  return parseInt(localStorage.getItem('tradaria_xp') || '0');
}

export function addXP(amount) {
  const current = getXP();
  const newXP   = current + amount;
  localStorage.setItem('tradaria_xp', String(newXP));
  return newXP;
}

export function getLevel(xp) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xp) level = l;
  }
  return level;
}

export function getNextLevel(xp) {
  for (const l of LEVELS) {
    if (xp < l.xp) return l;
  }
  return null; // ya es legend
}

export function getProgress(xp) {
  const current = getLevel(xp);
  const next    = getNextLevel(xp);
  if (!next) return 100;
  const range = next.xp - current.xp;
  const done  = xp - current.xp;
  return Math.round((done / range) * 100);
}