import { useLang } from './LangContext';
import { LANGS } from './i18n';
import { useState, useEffect } from 'react';
import { getUnlocked } from './badges.js';
export default function Home({ onSelect }) {
  const [online, setOnline] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const { lang, setLang, t } = useLang();
  const [dailyStreak, setDailyStreak] = useState(() => {
  return parseInt(localStorage.getItem('tradara_daily_streak') || '0');
 }); 
 const unlockedCount = getUnlocked().length;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res  = await fetch('https://tradara-production.up.railway.app/stats');
        const data = await res.json();
        setOnline(data.online);
        setGamesPlayed(data.gamesPlayed);
      } catch {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="gtm-root">
      <div className="scanlines" />

      <div style={{ padding: '48px 28px 32px', position: 'relative', zIndex: 2 }}>

        {/* Language selector */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <div className="lang-selector">
            {Object.keys(LANGS).map(l => (
              <button
                key={l}
                className={`lang-btn${lang === l ? ' active' : ''}`}
                onClick={() => setLang(l)}
              >
                {LANGS[l].label}
              </button>
            ))}
          </div>
        </div>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '42px', letterSpacing: '-0.02em', color: '#f0f0f0' }}>
            Tradara
          </div>
          <div style={{ fontSize: '10px', color: '#3a4455', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '6px' }}>
            {t.home.tagline}
          </div>

          {/* Online + games played */}
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22d3a5', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '9px', color: '#22d3a5', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {Math.max(online, 1)} online
              </span>
            </div>
            {gamesPlayed > 0 && (
              <span style={{ fontSize: '9px', color: '#3a4455', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {gamesPlayed} games played
              </span>
            )}
          </div>
        </div>
        {dailyStreak > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
       <span style={{ fontSize: '14px' }}>🔥</span>
       <span style={{ fontSize: '9px', color: '#f5c842', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {dailyStreak} day streak
      </span>
    </div>
  )}

        {/* Mode cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="mode-card active" onClick={() => onSelect('game')}>
            <div className="mode-card-left">
              <span className="mode-icon">📈</span>
              <div>
                <div className="mode-title">{t.home.mode1}</div>
                <div className="mode-sub">{t.home.mode1sub}</div>
              </div>
            </div>
            <span className="mode-arrow">→</span>
          </button>

          <button className="mode-card active" onClick={() => onSelect('arena')}>
            <div className="mode-card-left">
              <span className="mode-icon">⚔️</span>
              <div>
                <div className="mode-title">{t.home.mode2}</div>
                <div className="mode-sub">{t.arena.sub}</div>
              </div>
            </div>
            <span className="mode-arrow">→</span>
          </button>

          <button className="mode-card disabled">
            <div className="mode-card-left">
              <span className="mode-icon">🏆</span>
              <div>
                <div className="mode-title">{t.home.mode3}</div>
                <div className="mode-sub coming">{t.home.coming}</div>
              </div>
            </div>
            <span className="mode-badge">{t.home.coming}</span>
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => onSelect('badges')}
          style={{ background: 'transparent', border: '1px solid #1e2530', borderRadius: '8px', padding: '8px 16px', color: '#4a5568', fontFamily: "'Space Mono', monospace", fontSize: '9px', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}
          onMouseEnter={e => e.target.style.borderColor = '#22d3a5'}
          onMouseLeave={e => e.target.style.borderColor = '#1e2530'}
        >
          🏅 badges {unlockedCount > 0 && `· ${unlockedCount} unlocked`}
        </button>
          {/* Product Hunt badge */}
          <a href="https://www.producthunt.com/posts/tradara?utm_source=badge-featured&utm_medium=badge" target="_blank" rel="noopener noreferrer">
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=tradara&theme=dark&t=1"
              alt="Tradara on Product Hunt"
              style={{ height: '54px', width: 'auto' }}
            />
          </a>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: '#2a3345', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {t.home.version}
            </span>
            <button onClick={() => onSelect('legal')}
              style={{ background: 'transparent', border: 'none', color: '#2a3345', fontFamily: "'Space Mono', monospace", fontSize: '9px', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'underline' }}
              onMouseEnter={e => e.target.style.color = '#6b7a8d'}
              onMouseLeave={e => e.target.style.color = '#2a3345'}
            >
              Legal
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}