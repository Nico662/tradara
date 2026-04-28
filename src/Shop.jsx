import { useState } from 'react';
import { useLang } from './LangContext.jsx';

const SHOP_ITEMS = {
  frames: [
    { id: 'frame_gold',     name: 'Gold Frame',     desc: 'Exclusive gold border',     price: 2.99, emoji: '🥇', color: '#f5c842' },
    { id: 'frame_neon',     name: 'Neon Frame',     desc: 'Glowing neon border',       price: 1.99, emoji: '💚', color: '#22d3a5' },
    { id: 'frame_fire',     name: 'Fire Frame',     desc: 'Animated fire border',      price: 3.99, emoji: '🔥', color: '#f05454' },
    { id: 'frame_diamond',  name: 'Diamond Frame',  desc: 'Diamond pattern border',    price: 4.99, emoji: '💎', color: '#8899b0' },
  ],
  themes: [
    { id: 'theme_matrix',   name: 'Matrix',         desc: 'Green on black',            price: 1.99, emoji: '🟩', color: '#22d3a5' },
    { id: 'theme_blood',    name: 'Blood Market',   desc: 'Red dark theme',            price: 1.99, emoji: '🩸', color: '#f05454' },
    { id: 'theme_gold',     name: 'Gold Rush',      desc: 'Gold and black theme',      price: 2.99, emoji: '✨', color: '#f5c842' },
    { id: 'theme_midnight', name: 'Midnight',       desc: 'Deep blue dark theme',      price: 1.99, emoji: '🌙', color: '#6b7a8d' },
  ],
  avatars: [
    { id: 'avatar_bull',    name: 'Bull',           desc: 'Bullish trader avatar',     price: 0.99, emoji: '🐂', color: '#22d3a5' },
    { id: 'avatar_bear',    name: 'Bear',           desc: 'Bearish trader avatar',     price: 0.99, emoji: '🐻', color: '#f05454' },
    { id: 'avatar_whale',   name: 'Whale',          desc: 'Big money avatar',          price: 1.99, emoji: '🐋', color: '#8899b0' },
    { id: 'avatar_robot',   name: 'AlgoBot',        desc: 'Algorithm trader avatar',   price: 1.99, emoji: '🤖', color: '#f5c842' },
  ],
  effects: [
    { id: 'effect_confetti', name: 'Confetti',      desc: 'Confetti on correct answer', price: 1.99, emoji: '🎉', color: '#f5c842' },
    { id: 'effect_lightning',name: 'Lightning',     desc: 'Lightning bolt on streak',   price: 2.99, emoji: '⚡', color: '#22d3a5' },
    { id: 'effect_explosion',name: 'Explosion',     desc: 'Explosion on big win',       price: 2.99, emoji: '💥', color: '#f05454' },
    { id: 'effect_stars',    name: 'Stars',         desc: 'Stars rain on win',          price: 1.99, emoji: '⭐', color: '#f5c842' },
  ],
};

const CATEGORIES = [
  { id: 'frames',  label: 'Frames',  emoji: '🖼️' },
  { id: 'themes',  label: 'Themes',  emoji: '🎨' },
  { id: 'avatars', label: 'Avatars', emoji: '👤' },
  { id: 'effects', label: 'Effects', emoji: '✨' },
];

export default function Shop({ onBack }) {
  const { lang } = useLang();
  const [activeCategory, setActiveCategory] = useState('frames');

  const items = SHOP_ITEMS[activeCategory];

  return (
    <div id="gtm-root" style={{ position: 'relative' }}>
      <div className="scanlines" />
      <div style={{ position: 'relative', zIndex: 2 }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e2530', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack}
            style={{ background: 'transparent', border: 'none', color: '#3a4455', fontFamily: "'Space Mono', monospace", fontSize: '11px', cursor: 'pointer', letterSpacing: '0.06em' }}
            onMouseEnter={e => e.target.style.color = '#e2e8f0'}
            onMouseLeave={e => e.target.style.color = '#3a4455'}
          >← {lang === 'es' ? 'volver' : lang === 'de' ? 'zurück' : 'back'}</button>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '14px', color: '#f0f0f0', letterSpacing: '0.06em' }}>
            🛍️ SHOP
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '9px', background: 'rgba(245,200,66,0.1)', border: '1px solid #f5c842', borderRadius: '20px', padding: '3px 10px', color: '#f5c842', fontFamily: "'Space Mono', monospace", letterSpacing: '0.08em' }}>
            COMING SOON
          </div>
        </div>

        {/* Banner */}
        <div style={{ margin: '16px 20px', padding: '16px', background: 'rgba(34,211,165,0.05)', border: '1px solid rgba(34,211,165,0.2)', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', color: '#22d3a5', marginBottom: '4px' }}>
            Cosmetics coming soon
          </div>
          <div style={{ fontSize: '10px', color: '#4a5568', letterSpacing: '0.06em' }}>
            {lang === 'es' ? 'Personaliza tu experiencia de juego' : lang === 'de' ? 'Personalisiere dein Spielerlebnis' : 'Customize your trading experience'}
          </div>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '6px', padding: '0 20px 16px', overflowX: 'auto' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '6px 14px', borderRadius: '20px', whiteSpace: 'nowrap',
                border: `1px solid ${activeCategory === cat.id ? '#22d3a5' : '#2a3345'}`,
                background: activeCategory === cat.id ? 'rgba(34,211,165,0.08)' : 'transparent',
                color: activeCategory === cat.id ? '#22d3a5' : '#4a5568',
                fontFamily: "'Space Mono', monospace", fontSize: '9px', fontWeight: 700,
                letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase',
              }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 20px 40px' }}>
          {items.map(item => (
            <div key={item.id} style={{
              background: '#0f141b', border: '1px solid #1e2530', borderRadius: '10px',
              padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px',
              opacity: 0.7,
            }}>
              <div style={{ fontSize: '32px', textAlign: 'center' }}>{item.emoji}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '12px', color: item.color, textAlign: 'center' }}>
                {item.name}
              </div>
              <div style={{ fontSize: '9px', color: '#4a5568', textAlign: 'center', letterSpacing: '0.04em' }}>
                {item.desc}
              </div>
              <button disabled style={{
                width: '100%', padding: '8px', marginTop: '4px',
                background: '#1a2030', border: '1px solid #2a3345',
                borderRadius: '6px', color: '#3a4455',
                fontFamily: "'Space Mono', monospace", fontSize: '10px',
                fontWeight: 700, letterSpacing: '0.06em', cursor: 'not-allowed',
              }}>
                ${item.price} — Soon
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}