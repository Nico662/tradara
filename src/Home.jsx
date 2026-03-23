import { useLang } from './LangContext';
import { LANGS } from './i18n';

export default function Home({ onSelect }) {
  const { lang, setLang, t } = useLang();

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
        </div>

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

        <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '9px', color: '#2a3345', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {t.home.version}
        </div>
      </div>
    </div>
  );
}