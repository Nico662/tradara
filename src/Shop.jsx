import { useState } from 'react';
import { useLang } from './LangContext.jsx';
import { useAuth } from './AuthContext.jsx';

const SHOP_ITEMS = {
  frames: [
    { id: 'frame_gold',     name: 'Gold Frame',     desc: { en: 'Exclusive gold border',     es: 'Borde dorado exclusivo',      de: 'Exklusiver Goldrahmen'     }, price: 2.99, emoji: '🥇', color: '#f5c842' },
    { id: 'frame_neon',     name: 'Neon Frame',     desc: { en: 'Glowing neon border',       es: 'Borde neón brillante',        de: 'Leuchtender Neonrahmen'    }, price: 1.99, emoji: '💚', color: '#22d3a5' },
    { id: 'frame_fire',     name: 'Fire Frame',     desc: { en: 'Animated fire border',      es: 'Borde de fuego animado',      de: 'Animierter Feuerrahmen'    }, price: 3.99, emoji: '🔥', color: '#f05454' },
    { id: 'frame_diamond',  name: 'Diamond Frame',  desc: { en: 'Diamond pattern border',    es: 'Borde con patrón de diamante',de: 'Diamantmuster-Rahmen'      }, price: 4.99, emoji: '💎', color: '#8899b0' },
  ],
  themes: [
    { id: 'theme_matrix',   name: 'Matrix',         desc: { en: 'Green on black',            es: 'Verde sobre negro',           de: 'Grün auf Schwarz'          }, price: 1.99, emoji: '🟩', color: '#22d3a5' },
    { id: 'theme_blood',    name: 'Blood Market',   desc: { en: 'Red dark theme',            es: 'Tema oscuro rojo',            de: 'Rotes dunkles Theme'       }, price: 1.99, emoji: '🩸', color: '#f05454' },
    { id: 'theme_gold',     name: 'Gold Rush',      desc: { en: 'Gold and black theme',      es: 'Tema dorado y negro',         de: 'Gold und Schwarz Theme'    }, price: 2.99, emoji: '✨', color: '#f5c842' },
    { id: 'theme_midnight', name: 'Midnight',       desc: { en: 'Deep blue dark theme',      es: 'Tema azul oscuro profundo',   de: 'Tiefblaues dunkles Theme'  }, price: 1.99, emoji: '🌙', color: '#6b7a8d' },
  ],
  avatars: [
    { id: 'avatar_bull',    name: 'Bull',           desc: { en: 'Bullish trader avatar',     es: 'Avatar de trader alcista',    de: 'Bullen-Trader Avatar'      }, price: 0.99, emoji: '🐂', color: '#22d3a5' },
    { id: 'avatar_bear',    name: 'Bear',           desc: { en: 'Bearish trader avatar',     es: 'Avatar de trader bajista',    de: 'Bären-Trader Avatar'       }, price: 0.99, emoji: '🐻', color: '#f05454' },
    { id: 'avatar_whale',   name: 'Whale',          desc: { en: 'Big money avatar',          es: 'Avatar de gran inversor',     de: 'Großinvestor Avatar'       }, price: 1.99, emoji: '🐋', color: '#8899b0' },
    { id: 'avatar_robot',   name: 'AlgoBot',        desc: { en: 'Algorithm trader avatar',   es: 'Avatar de trader algorítmico',de: 'Algorithmus-Trader Avatar' }, price: 1.99, emoji: '🤖', color: '#f5c842' },
  ],
  effects: [
    { id: 'effect_confetti',  name: 'Confetti',     desc: { en: 'Confetti on correct answer',es: 'Confeti al acertar',          de: 'Konfetti bei richtiger Antwort'}, price: 1.99, emoji: '🎉', color: '#f5c842' },
    { id: 'effect_lightning', name: 'Lightning',    desc: { en: 'Lightning bolt on streak',  es: 'Rayo en racha',               de: 'Blitz bei Serie'           }, price: 2.99, emoji: '⚡', color: '#22d3a5' },
    { id: 'effect_explosion', name: 'Explosion',    desc: { en: 'Explosion on big win',      es: 'Explosión en gran victoria',  de: 'Explosion bei großem Gewinn'}, price: 2.99, emoji: '💥', color: '#f05454' },
    { id: 'effect_stars',     name: 'Stars',        desc: { en: 'Stars rain on win',         es: 'Lluvia de estrellas al ganar',de: 'Sternregen beim Gewinn'    }, price: 1.99, emoji: '⭐', color: '#f5c842' },
  ],
};
const CATEGORY_TYPES = {
  frames: 'frame',
  themes: 'theme',
  avatars: 'avatar',
  effects: 'effect',
};

const CATEGORIES = [
  { id: 'frames',  label: 'Frames',  emoji: '🖼️' },
  { id: 'themes',  label: 'Themes',  emoji: '🎨' },
  { id: 'avatars', label: 'Avatars', emoji: '👤' },
  { id: 'effects', label: 'Effects', emoji: '✨' },
];

export default function Shop({ onBack }) {
  const { lang } = useLang();
  const { purchases, activeCosmetics, equipCosmetic, unequipCosmetic } = useAuth();
  const [activeCategory, setActiveCategory] = useState('frames');
  const [loading, setLoading] = useState(null);

  const items = SHOP_ITEMS[activeCategory];
  const cosmeticType = CATEGORY_TYPES[activeCategory];

  async function handleBuy(itemId) {
    const token = localStorage.getItem('tradara_token');
    if (!token) {
      alert(lang === 'es' ? 'Inicia sesión para comprar' : lang === 'de' ? 'Anmelden zum Kaufen' : 'Sign in to purchase');
      return;
    }
    setLoading(itemId);
    try {
      const res = await fetch('https://tradara-production.up.railway.app/shop/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  function handleEquip(item) {
    if (activeCosmetics[cosmeticType] === item.id) {
      unequipCosmetic(cosmeticType);
    } else {
      equipCosmetic(cosmeticType, item.id);
    }
  }

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
            🛍️ {t.home.shop}
          </div>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '6px', padding: '16px 20px', overflowX: 'auto' }}>
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
          {items.map(item => {
            const owned = purchases.includes(item.id);
            const equipped = activeCosmetics[cosmeticType] === item.id;

            return (
              <div key={item.id} style={{
                background: '#0f141b',
                border: `1px solid ${equipped ? item.color : '#1e2530'}`,
                borderRadius: '10px',
                padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => { if (!equipped) e.currentTarget.style.borderColor = item.color; }}
                onMouseLeave={e => { if (!equipped) e.currentTarget.style.borderColor = '#1e2530'; }}
              >
                <div style={{ fontSize: '32px', textAlign: 'center' }}>{item.emoji}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '12px', color: item.color, textAlign: 'center' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '9px', color: '#4a5568', textAlign: 'center', letterSpacing: '0.04em' }}>
                   {item.desc[lang] || item.desc.en}
                </div>

                {owned ? (
                  <button onClick={() => handleEquip(item)} style={{
                    width: '100%', padding: '8px', marginTop: '4px',
                    background: equipped ? item.color : 'transparent',
                    border: `1px solid ${item.color}`,
                    borderRadius: '6px',
                    color: equipped ? '#0a0c0f' : item.color,
                    fontFamily: "'Space Mono', monospace", fontSize: '10px',
                    fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                    {equipped
                      ? (lang === 'es' ? '✓ Equipado' : lang === 'de' ? '✓ Ausgerüstet' : '✓ Equipped')
                      : (lang === 'es' ? 'Equipar' : lang === 'de' ? 'Ausrüsten' : 'Equip')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(item.id)}
                    disabled={loading === item.id}
                    style={{
                      width: '100%', padding: '8px', marginTop: '4px',
                      background: loading === item.id ? '#1a2030' : 'rgba(34,211,165,0.08)',
                      border: `1px solid ${loading === item.id ? '#2a3345' : item.color}`,
                      borderRadius: '6px',
                      color: loading === item.id ? '#4a5568' : item.color,
                      fontFamily: "'Space Mono', monospace", fontSize: '10px',
                      fontWeight: 700, letterSpacing: '0.06em', cursor: loading === item.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                    }}>
                    {loading === item.id ? '...' : `€${item.price}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}