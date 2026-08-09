import { Crown } from 'lucide-react';

export const FOUNDER = 'nico_founder';

export function isFounder(username) {
  return username === FOUNDER;
}

export default function FounderBadge({ size = 13 }) {
  return (
    <span
      title="Founder"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: '3px',
        lineHeight: 1,
        verticalAlign: 'middle',
        cursor: 'default',
        flexShrink: 0,
      }}
    >
      <Crown size={Math.max(size, 12)} strokeWidth={2} aria-hidden style={{ filter: 'drop-shadow(0 0 5px rgba(245,158,11,0.7))', color: 'rgb(245,158,11)' }} />
    </span>
  );
}
