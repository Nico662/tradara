import { Flame, Zap, Skull, Scroll, Swords, Medal, LineChart, Briefcase, GraduationCap, Lightbulb, TrendingUp, Gem, Star, Trophy, Crown } from 'lucide-react';

export const ModeIcon = ({ id, size = 22, ...props }) => {
  const icons = {
    game: <LineChart size={size} strokeWidth={2} aria-hidden {...props} />,
    daily: <Zap size={size} strokeWidth={2} aria-hidden {...props} />,
    survival: <Skull size={size} strokeWidth={2} aria-hidden {...props} />,
    historical: <Scroll size={size} strokeWidth={2} aria-hidden {...props} />,
    arena: <Swords size={size} strokeWidth={2} aria-hidden {...props} />,
    tournament: <Trophy size={size} strokeWidth={2} aria-hidden {...props} />,
    portfolio: <Briefcase size={size} strokeWidth={2} aria-hidden {...props} />,
  };
  return icons[id] || null;
};

export const StreakIcon = ({ size = 16, ...props }) => (
  <Flame size={size} strokeWidth={2} aria-hidden {...props} />
);

export const ProIcon = ({ size = 16, ...props }) => (
  <Zap size={size} strokeWidth={2} aria-hidden {...props} />
);

export const AcademyIcon = ({ size = 22, ...props }) => (
  <GraduationCap size={size} strokeWidth={2} aria-hidden {...props} />
);

export const TodayCardIcon = ({ size = 22, ...props }) => (
  <Lightbulb size={size} strokeWidth={2} aria-hidden {...props} />
);

export const LevelIcon = ({ id, size = 16, ...props }) => {
  const icons = {
    rookie: <Star size={size} strokeWidth={2} aria-hidden {...props} />,
    trader: <TrendingUp size={size} strokeWidth={2} aria-hidden {...props} />,
    pro: <Zap size={size} strokeWidth={2} aria-hidden {...props} />,
    expert: <Gem size={size} strokeWidth={2} aria-hidden {...props} />,
    legend: <Crown size={size} strokeWidth={2} aria-hidden {...props} />,
  };
  return icons[id] || null;
};
