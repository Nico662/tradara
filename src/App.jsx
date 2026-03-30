import { useState, useRef, useCallback } from "react";
import Chart, { generateCandles } from "./Chart";
import Home from "./Home";
import { useLang } from './LangContext.jsx';
import { LANGS } from './i18n';
import Arena from './Arena.jsx';
import html2canvas from 'html2canvas';
import { playWin, playLose, playClick, playStreak, playReveal } from './sounds.js';
import Legal from './Legal.jsx';


const ASSETS = [
  { name: 'BTC/USD',  tf: '15m', vol: 0.025, cat: 'crypto',      binance: 'BTCUSDT',  yahoo: null,        base: () => 28000 + Math.random() * 40000 },
  { name: 'ETH/USD',  tf: '15m', vol: 0.030, cat: 'crypto',      binance: 'ETHUSDT',  yahoo: null,        base: () => 1200  + Math.random() * 2400  },
  { name: 'SOL/USD',  tf: '15m', vol: 0.035, cat: 'crypto',      binance: 'SOLUSDT',  yahoo: null,        base: () => 80    + Math.random() * 120   },
  { name: 'XRP/USD',  tf: '15m', vol: 0.030, cat: 'crypto',      binance: 'XRPUSDT',  yahoo: null,        base: () => 0.5   + Math.random() * 2     },
  { name: 'EUR/USD',  tf: '1H', vol: 0.004, cat: 'forex',       binance: null, yahoo: 'EURUSD=X',        base: () => 1.04  + Math.random() * 0.18  },
  { name: 'GBP/USD',  tf: '1H', vol: 0.005, cat: 'forex',       binance: null, yahoo: 'GBPUSD=X',        base: () => 1.20  + Math.random() * 0.20  },
  { name: 'USD/JPY',  tf: '1H', vol: 0.004, cat: 'forex',       binance: null, yahoo: 'JPY=X',           base: () => 130   + Math.random() * 20    },
  { name: 'USD/CHF',  tf: '1H', vol: 0.004, cat: 'forex',       binance: null, yahoo: 'CHF=X',           base: () => 0.88  + Math.random() * 0.15  },
  { name: 'AUD/USD',  tf: '1H', vol: 0.004, cat: 'forex',       binance: null, yahoo: 'AUDUSD=X',        base: () => 0.62  + Math.random() * 0.12  },
  { name: 'USD/CAD',  tf: '1H', vol: 0.004, cat: 'forex',       binance: null, yahoo: 'CAD=X',           base: () => 1.25  + Math.random() * 0.15  },
  { name: 'S&P 500',  tf: '15min', vol: 0.012, cat: 'indices',     binance: null, yahoo: null, alphavantage: 'SPY',  base: () => 3800  + Math.random() * 2000 },
  { name: 'NASDAQ',   tf: '15min', vol: 0.014, cat: 'indices',     binance: null, yahoo: null, alphavantage: 'QQQ',  base: () => 11000 + Math.random() * 5000 },
  { name: 'DOW',      tf: '15min', vol: 0.010, cat: 'indices',     binance: null, yahoo: null, alphavantage: 'DIA',  base: () => 30000 + Math.random() * 8000 },
  { name: 'GOLD',     tf: '15min', vol: 0.008, cat: 'commodities', binance: null, yahoo: null, alphavantage: 'GLD',  base: () => 1700  + Math.random() * 700  },
  { name: 'SILVER',   tf: '15min', vol: 0.015, cat: 'commodities', binance: null, yahoo: null, alphavantage: 'SLV',  base: () => 20    + Math.random() * 10   },
  { name: 'OIL/USD',  tf: '15min', vol: 0.020, cat: 'commodities', binance: null, yahoo: null, alphavantage: 'USO',  base: () => 60    + Math.random() * 40   },
];

const CATEGORIES = [
  { id: 'all',         labelKey: 'all'         },
  { id: 'crypto',      labelKey: 'crypto'      },
  { id: 'forex',       labelKey: 'forex'       },
  { id: 'indices',     labelKey: 'indices'     },
  { id: 'commodities', labelKey: 'commodities' },
];

function randomAsset(cat = 'all') {
  const pool = cat === 'all' ? ASSETS : ASSETS.filter(a => a.cat === cat);
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function App() {
  const [screen,    setScreen]   = useState('home');
  const [category,  setCategory] = useState('all');
  const [asset,     setAsset]    = useState(() => randomAsset('all'));
  const [phase,     setPhase]    = useState('choose');
  const [result,    setResult]   = useState(null);
  const [score,     setScore]    = useState(0);
  const [streak,    setStreak]   = useState(0);
  const [round,     setRound]    = useState(1);
  const [history,   setHistory]  = useState([]);
  const [selected,  setSelected] = useState(null);
  const [gameOver,  setGameOver] = useState(false);
  const [revealing, setRevealing]= useState(false);
  const [highscore, setHighscore]= useState(() => {
    return parseInt(localStorage.getItem('tradara_highscore') || '0');
  });

  const { lang, setLang, t } = useLang();
  const chartRef = useRef(null);

  const makeChoice = useCallback((choice) => {
    if (phase !== 'choose') return;
    setSelected(choice);
    setPhase('reveal');
    setRevealing(true);

    const candles    = chartRef.current.getCandles();
    const lastClose  = candles[candles.length - 1].close;
    const trend      = (Math.random() - 0.5) * 0.5;
    const future     = chartRef.current.getRealReveal?.()
      ?? generateCandles(20, lastClose, asset.vol, trend * 2);
    const lastReveal = future[future.length - 1].close;
    const pctMove    = (lastReveal - lastClose) / lastClose * 100;
    const direction  = pctMove > 0.1 ? 'up' : pctMove < -0.1 ? 'down' : 'flat';

    chartRef.current.revealFuture(future, () => setRevealing(false));

    const win     = (choice === 'long'  && direction === 'up')
                 || (choice === 'short' && direction === 'down')
                 || (choice === 'skip'  && direction === 'flat');
    const neutral = choice === 'skip';

    let pts = 0;
if (win && !neutral) {
  pts = 100 + streak * 10;
  const newScore = score + pts;
  setScore(newScore);
  if (newScore > highscore) {
    setHighscore(newScore);
    localStorage.setItem('tradara_highscore', String(newScore));
  }
  setStreak(s => s + 1);
  if (streak >= 2) playStreak(); else playWin();
} else if (win && neutral) {
  pts = 50;
  const newScore = score + pts;
  setScore(newScore);
  if (newScore > highscore) {
    setHighscore(newScore);
    localStorage.setItem('tradara_highscore', String(newScore));
  }
  setStreak(s => s + 1);
  playWin();
} else if (!win && !neutral) {
  pts = -50;
  setScore(s => Math.max(0, s + pts));
  setStreak(0);
  playLose();
}
    // al elegir
playClick();

// en el resultado, después de calcular win/neutral:
if (win && !neutral) {
  pts = 100 + streak * 10;
  const newScore = score + pts;
  setScore(newScore);
  if (newScore > highscore) {
    setHighscore(newScore);
    localStorage.setItem('tradara_highscore', String(newScore));
  }
  setStreak(s => s + 1);
  if (streak >= 2) playStreak(); else playWin();  // ← añade esto
} else if (!win && !neutral) {
  pts = -50;
  setScore(s => Math.max(0, s + pts));
  setStreak(0);
  playLose();  // ← añade esto
}

    const outcome = win && !neutral ? 'win' : !win && !neutral ? 'lose' : 'skip';
    setHistory(h => [...h, outcome]);
    setResult({ win, neutral, pts, pctMove, direction, choice });
  }, [phase, asset, streak, score, highscore]);

  const changeCategory = (cat) => {
    setCategory(cat);
    setAsset(randomAsset(cat));
    setPhase('choose');
    setResult(null);
    setSelected(null);
  };

  const nextRound = () => {
    if (round >= 25) {
      setGameOver(true);
      return;
    }
    const next = randomAsset(category);
    setAsset(next);
    if (next.name === asset.name) {
      setTimeout(() => chartRef.current?.reshuffleWindow?.(), 50);
    }
    setPhase('choose');
    setResult(null);
    setSelected(null);
    setRound(r => r + 1);
  };

  const goHome = () => {
    setGameOver(false);
    setScreen('home');
    setAsset(randomAsset('all'));
    setCategory('all');
    setPhase('choose');
    setResult(null);
    setSelected(null);
    setRound(1);
    setScore(0);
    setStreak(0);
    setHistory([]);
  };

  const playAgain = () => {
    setGameOver(false);
    setRound(1);
    setScore(0);
    setStreak(0);
    setHistory([]);
    setResult(null);
    setSelected(null);
    setPhase('choose');
    setAsset(randomAsset(category));
  };

  const shareResult = async () => {
    const el = document.getElementById('share-card');
    if (!el) return;
    const canvas = await html2canvas(el, {
      backgroundColor: '#0a0c0f',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = 'tradara-result.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  // ── Game Over ─────────────────────────────────────────────────────
  if (gameOver) {
    const wins      = history.filter(h => h === 'win').length;
    const losses    = history.filter(h => h === 'lose').length;
    const skips     = history.filter(h => h === 'skip').length;
    const accuracy  = Math.round(wins / (wins + losses || 1) * 100);
    const maxStreak = history.reduce((acc, h, i) => {
      if (h !== 'win') return acc;
      let s = 1;
      while (history[i + s] === 'win') s++;
      return Math.max(acc, s);
    }, 0);

    return (
      <div id="gtm-root" style={{ position: 'relative' }}>
        <div className="scanlines" />
        <div style={{ padding: '40px 28px 36px', position: 'relative', zIndex: 2 }}>

          {/* Tarjeta que se captura */}
          <div id="share-card" style={{
            background: '#0a0c0f',
            border: '1px solid #1e2530',
            borderRadius: '12px',
            padding: '28px 24px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '18px', color: '#f0f0f0' }}>
                GUESS <span style={{ color: '#22d3a5' }}>THE</span> MARKET
              </div>
              <div style={{ fontSize: '9px', color: '#3a4455', letterSpacing: '0.1em' }}>tradara.dev</div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '52px', color: '#f5c842', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {score}
              </div>
              <div style={{ fontSize: '9px', color: '#4a5568', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px' }}>
                {t.gameover.finalScore}
              </div>
              {score >= highscore && score > 0 && (
                <div style={{ marginTop: '8px', fontSize: '10px', color: '#22d3a5', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  ★ new highscore!
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#3a4455', marginTop: '4px' }}>
                best: {highscore}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              {[
                { label: t.gameover.correct,    value: wins,          color: '#22d3a5' },
                { label: t.gameover.accuracy,   value: accuracy + '%',color: '#e2e8f0' },
                { label: t.gameover.bestStreak, value: maxStreak+'x', color: '#f5c842' },
              ].map(s => (
                <div key={s.label} style={{ background: '#0f141b', border: '1px solid #1e2530', borderRadius: '8px', padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '20px', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '8px', color: '#4a5568', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {history.map((h, i) => (
                <div key={i} style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: h === 'win' ? '#22d3a5' : h === 'lose' ? '#f05454' : '#f5c842',
                }} />
              ))}
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button onClick={shareResult}
              style={{ flex: 1, padding: '14px', background: 'rgba(34,211,165,0.08)', border: '1px solid #22d3a5', borderRadius: '6px', color: '#22d3a5', fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
              📸 {t.gameover.share ?? 'Compartir'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={playAgain}
              style={{ flex: 1, padding: '14px', background: '#0f141b', border: '1px solid #2a3345', borderRadius: '6px', color: '#8899b0', fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
              {t.gameover.playAgain}
            </button>
            <button onClick={goHome}
              style={{ flex: 1, padding: '14px', background: '#0f141b', border: '1px solid #2a3345', borderRadius: '6px', color: '#8899b0', fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
              {t.gameover.menu}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Home ──────────────────────────────────────────────────────────
  if (screen === 'home') {
  return <Home onSelect={(mode) => {
    if (mode === 'arena') setScreen('arena');
    else if (mode === 'legal') setScreen('legal');
    else setScreen('game');
  }} />;
}

if (screen === 'arena') {
  return <Arena onBack={() => setScreen('home')} />;
}

if (screen === 'legal') {
  return <Legal onBack={() => setScreen('home')} />;
}

  // ── Game ──────────────────────────────────────────────────────────
  const cls      = result ? (result.win && !result.neutral ? 'win' : !result.win && !result.neutral ? 'lose' : 'neutral') : '';
  const recent   = history.slice(-12);
  const dirLabel = result ? (result.direction === 'up' ? t.game.up : result.direction === 'down' ? t.game.down : t.game.flatDir) : '';

  return (
    <div id="gtm-root" style={{ position: 'relative' }}>
      <div className="scanlines" />

      <button onClick={goHome}
        style={{ position: 'absolute', top: '14px', left: '16px', background: 'transparent', border: 'none', color: '#3a4455', fontFamily: "'Space Mono', monospace", fontSize: '11px', cursor: 'pointer', letterSpacing: '0.06em', zIndex: 10, padding: '4px 0', transition: 'color 0.15s' }}
        onMouseEnter={e => e.target.style.color = '#e2e8f0'}
        onMouseLeave={e => e.target.style.color = '#3a4455'}
      >
        {t.game.menu}
      </button>

      <div className="header">
        <div className="logo">GUESS <span>THE</span> MARKET</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="lang-selector">
            {Object.keys(LANGS).map(l => (
              <button key={l} className={`lang-btn${lang === l ? ' active' : ''}`} onClick={() => setLang(l)}>
                {LANGS[l].label}
              </button>
            ))}
          </div>
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">{t.game.round}</span>
              <span className="stat-val">{round}/25</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t.game.score}</span>
              <span className="stat-val yellow">{score}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t.game.streak}</span>
              <span className="stat-val green">{streak}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="cat-bar">
        {CATEGORIES.map(c => (
          <button key={c.id} className={`cat-btn${category === c.id ? ' active' : ''}`} onClick={() => changeCategory(c.id)}>
            {t.cats[c.labelKey]}
          </button>
        ))}
      </div>

      <div className="asset-bar">
        <div className="asset-name">{asset.name}</div>
        <div className="asset-price"></div>
        <div className="timeframe-badge">{asset.tf}</div>
      </div>

      <div className="chart-area">
        <div className="chart-wrapper">
          <Chart ref={chartRef} asset={asset} />
          <div className={`phase-label${phase === 'reveal' ? ' active' : ''}`}>
            {phase === 'choose' ? t.game.reading : result
              ? (result.direction === 'up' ? t.game.bullish : result.direction === 'down' ? t.game.bearish : t.game.ranging)
              : t.game.revealing}
          </div>
        </div>
      </div>

      <div className="streak-bar">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className={`streak-dot${recent[i] ? ' ' + recent[i] : ''}`} />
        ))}
        {streak > 1 && <span className="streak-label">{streak}x streak</span>}
      </div>

      {phase === 'choose' && (
        <div className="action-zone">
          <div className="prompt-text">{t.game.whatNext}</div>
          <div className="buttons-row">
            <button className={`trade-btn long${selected === 'long' ? ' selected' : ''}`} onClick={() => makeChoice('long')}>
              <span className="btn-icon">▲</span>
              <span>Long</span>
              <span className="btn-sublabel">{t.game.longSub}</span>
            </button>
            <button className={`trade-btn notrade${selected === 'skip' ? ' selected' : ''}`} onClick={() => makeChoice('skip')}>
              <span className="btn-icon">—</span>
              <span>{t.game.noTrade}</span>
              <span className="btn-sublabel">{t.game.noTradeSub}</span>
            </button>
            <button className={`trade-btn short${selected === 'short' ? ' selected' : ''}`} onClick={() => makeChoice('short')}>
              <span className="btn-icon">▼</span>
              <span>Short</span>
              <span className="btn-sublabel">{t.game.shortSub}</span>
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="result-overlay">
          <div className={`result-card ${cls}`}>
            <div className="result-left">
              <div className={`result-verdict ${cls}`}>
                {result.win && !result.neutral ? t.game.correct : !result.win && !result.neutral ? t.game.wrong : t.game.flat}
              </div>
              <div className="result-detail">
                price {dirLabel} &nbsp;{result.pctMove > 0 ? '+' : ''}{result.pctMove.toFixed(2)}% · you: {result.choice.toUpperCase()}
              </div>
            </div>
            <div className={`result-pnl ${result.pts > 0 ? 'pos' : result.pts < 0 ? 'neg' : 'zero'}`}>
              {result.pts > 0 ? '+' + result.pts : result.pts === 0 ? '±0' : result.pts}
            </div>
            <button className="next-btn" onClick={nextRound} disabled={revealing}
              style={{ opacity: revealing ? 0.3 : 1, cursor: revealing ? 'not-allowed' : 'pointer' }}>
              {revealing ? '...' : t.game.next}
            </button>
          </div>
        </div>
      )}

      {/* Session stats */}
<div style={{ padding: '12px 20px', borderTop: '1px solid #1e2530', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', position: 'relative', zIndex: 2 }}>
  {[
    {
      label: 'CORRECT',
      value: history.filter(h => h === 'win').length,
      color: '#22d3a5'
    },
    {
      label: 'WRONG',
      value: history.filter(h => h === 'lose').length,
      color: '#f05454'
    },
    {
      label: 'ACCURACY',
      value: history.filter(h => h !== 'skip').length > 0
        ? Math.round(history.filter(h => h === 'win').length / history.filter(h => h !== 'skip').length * 100) + '%'
        : '—',
      color: '#f5c842'
    },
  ].map(s => (
    <div key={s.label} style={{ background: '#0f141b', border: '1px solid #1e2530', borderRadius: '8px', padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '20px', color: s.color }}>{s.value}</div>
      <div style={{ fontSize: '8px', color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2px' }}>{s.label}</div>
    </div>
  ))}
</div>
    </div>
  );
}