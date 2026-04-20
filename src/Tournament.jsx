import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import Chart from './Chart';
import { addXP } from './levels.js';

const SERVER = 'https://tradara-production.up.railway.app';

export default function Tournament({ onBack }) {
  const { user, syncProgress } = useAuth();
  const [phase, setPhase] = useState('loading');
  const [rounds, setRounds] = useState([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [weekId, setWeekId] = useState('');
  const [alreadyScore, setAlreadyScore] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => { init(); }, []);

  async function init() {
    if (!user) { setPhase('login'); return; }
    const token = localStorage.getItem('tradara_token');
    const playedRes = await fetch(`${SERVER}/tournament/played`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const playedData = await playedRes.json();
    if (playedData.played) {
      setAlreadyScore(playedData.score);
      await loadLeaderboard();
      setPhase('already_played');
      return;
    }
    const res  = await fetch(`${SERVER}/tournament`);
    const data = await res.json();
    setWeekId(data.weekId);
    setRounds(data.rounds);
    setPhase('playing');
  }

  async function loadLeaderboard() {
    const res  = await fetch(`${SERVER}/tournament/leaderboard`);
    const data = await res.json();
    setWeekId(data.weekId);
    setLeaderboard(data.scores);
  }

  function cleanCandles(candles) {
    return candles
      .filter(c => c && c.time != null && c.open > 0 && c.high > 0 && c.low > 0 && c.close > 0)
      .map(c => ({
        time:  typeof c.time === 'number' ? c.time : Math.floor(new Date(c.time).getTime() / 1000),
        open:  parseFloat(c.open),
        high:  parseFloat(c.high),
        low:   parseFloat(c.low),
        close: parseFloat(c.close),
      }));
  }

  function makeChoice(choice) {
    if (result || revealing) return;
    const currentRound = rounds[round];
    const future = currentRound.future;
    const lastClose  = currentRound.visible[currentRound.visible.length - 1].close;
    const lastFuture = future[future.length - 1].close;
    const pctMove    = (lastFuture - lastClose) / lastClose * 100;
    const direction  = pctMove > 0.1 ? 'up' : pctMove < -0.1 ? 'down' : 'flat';
    const win = (choice === 'long' && direction === 'up')
             || (choice === 'short' && direction === 'down')
             || (choice === 'skip' && direction === 'flat');
    const pts = win && choice !== 'skip' ? 100 : win && choice === 'skip' ? 50 : 0;
    setScore(s => s + pts);
    setHistory(h => [...h, { choice, win, pts }]);
    setResult({ win, pts, pctMove, direction, choice });
    setRevealing(true);
    chartRef.current?.revealFuture(cleanCandles(future), () => setRevealing(false));
  }

  async function nextRound() {
    if (round + 1 >= rounds.length) {
      const finalScore = score;
      const token = localStorage.getItem('tradara_token');
      await fetch(`${SERVER}/tournament/score`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: finalScore, rounds: history }),
      });
      const xpGained = Math.floor(finalScore / 10);
      const newXP = addXP(xpGained);
      const badges = JSON.parse(localStorage.getItem('tradara_badges') || '[]');
      syncProgress(newXP, badges);
      await loadLeaderboard();
      setPhase('finished');
      return;
    }
    setRound(r => r + 1);
    setResult(null);
    setRevealing(false);
  }

  if (phase === 'login') {
    return (
      <div style={{ padding: '48px 28px', textAlign: 'center' }}>
        <button onClick={onBack} style={{ position: 'absolute', top: '20px', left: '16px', background: 'transparent', border: 'none', color: '#3a4455', fontFamily: "'Space Mono', monospace", fontSize: '11px', cursor: 'pointer' }}>← menu</button>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', color: '#f0f0f0', marginBottom: '8px' }}>Weekly Tournament</div>
        <div style={{ fontSize: '11px', color: '#4a5568', marginBottom: '32px' }}>Sign in to compete</div>
        <a href={`${SERVER}/auth/google`} style={{ display: 'inline-block', padding: '12px 24px', background: 'rgba(34,211,165,0.08)', border: '1px solid #22d3a5', borderRadius: '8px', color: '#22d3a5', fontFamily: "'Space Mono', monospace", fontSize: '11px', textDecoration: 'none', fontWeight: 700 }}>
          Sign in with Google
        </a>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div style={{ padding: '48px 28px', textAlign: 'center' }}>
        <button onClick={onBack} style={{ position: 'absolute', top: '20px', left: '16px', background: 'transparent', border: 'none', color: '#3a4455', fontFamily: "'Space Mono', monospace", fontSize: '11px', cursor: 'pointer' }}>← menu</button>
        <div style={{ fontSize: '11px', color: '#4a5568', fontFamily: "'Space Mono', monospace" }}>Loading tournament...</div>
      </div>
    );
  }

  if (phase === 'already_played' || phase === 'finished') {
    return (
      <div style={{ padding: '48px 28px 32px' }}>
        <button onClick={onBack} style={{ position: 'absolute', top: '20px', left: '16px', background: 'transparent', border: 'none', color: '#3a4455', fontFamily: "'Space Mono', monospace", fontSize: '11px', cursor: 'pointer' }}>← menu</button>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '20px', color: '#f0f0f0' }}>Week {weekId}</div>
          {phase === 'finished' && (
            <div style={{ marginTop: '8px', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '32px', color: '#f5c842' }}>{score}</div>
          )}
          {phase === 'already_played' && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#4a5568' }}>Your score: <span style={{ color: '#f5c842', fontWeight: 700 }}>{alreadyScore}</span></div>
          )}
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#6b7a8d', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Leaderboard</div>
        {leaderboard.map((entry, i) => (
          <div key={entry._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: '#0f141b', border: `1px solid ${i === 0 ? '#f5c842' : i === 1 ? '#8899b0' : i === 2 ? '#cd7f32' : '#1e2530'}`, borderRadius: '8px', marginBottom: '8px' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', color: i === 0 ? '#f5c842' : i === 1 ? '#8899b0' : i === 2 ? '#cd7f32' : '#3a4455', width: '24px' }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
            </div>
            {entry.avatar && <img src={entry.avatar} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />}
            <div style={{ flex: 1, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '12px', color: '#f0f0f0' }}>{entry.name}</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', color: '#22d3a5' }}>{entry.score}</div>
          </div>
        ))}
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '9px', color: '#3a4455', fontFamily: "'Space Mono', monospace" }}>New tournament every Monday</div>
      </div>
    );
  }

  const currentRound = rounds[round];

  const stableCandles = useMemo(
    () => currentRound ? cleanCandles(currentRound.visible) : [],
    [currentRound]
  );
  const stableAsset = useMemo(() => currentRound ? {
    name: currentRound.asset,
    tf: currentRound.interval,
    vol: 0.02,
    cat: 'crypto',
    binance: null,
    yahoo: null,
    alphavantage: null,
    base: () => 100,
  } : null, [currentRound]);

  if (!currentRound) return null;

  return (
    <div id="gtm-root" style={{ position: 'relative' }}>
      <div className="scanlines" />
      <button onClick={onBack} style={{ position: 'absolute', top: 'calc(14px + env(safe-area-inset-top))', left: '16px', background: 'transparent', border: 'none', color: '#3a4455', fontFamily: "'Space Mono', monospace", fontSize: '11px', cursor: 'pointer', zIndex: 10 }}>← menu</button>

      <div className="header">
        <div className="logo">🏆 TOURNAMENT</div>
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-label">ROUND</span>
            <span className="stat-val">{round + 1}/10</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">SCORE</span>
            <span className="stat-val yellow">{score}</span>
          </div>
        </div>
      </div>

      <div className="asset-bar">
        <div className="asset-name">{currentRound.asset}</div>
        <div className="timeframe-badge">{currentRound.interval}</div>
      </div>

      <div className="chart-area">
        <div className="chart-wrapper">
          <Chart
            ref={chartRef}
            asset={stableAsset}
            externalCandles={stableCandles}
          />
        </div>
      </div>

      {!result && (
        <div className="action-zone">
          <div className="prompt-text">What happens next?</div>
          <div className="buttons-row">
            <button className="trade-btn long" onClick={() => makeChoice('long')}>
              <span className="btn-icon">▲</span>
              <span>Long</span>
            </button>
            <button className="trade-btn notrade" onClick={() => makeChoice('skip')}>
              <span className="btn-icon">—</span>
              <span>No Trade</span>
            </button>
            <button className="trade-btn short" onClick={() => makeChoice('short')}>
              <span className="btn-icon">▼</span>
              <span>Short</span>
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="result-overlay">
          <div className={`result-card ${result.win ? 'win' : 'lose'}`}>
            <div className="result-left">
              <div className={`result-verdict ${result.win ? 'win' : 'lose'}`}>
                {result.win ? 'CORRECT' : 'WRONG'}
              </div>
              <div className="result-detail">
                {result.direction === 'up' ? '▲ UP' : result.direction === 'down' ? '▼ DOWN' : '— FLAT'} {result.pctMove > 0 ? '+' : ''}{result.pctMove.toFixed(2)}%
              </div>
            </div>
            <div className={`result-pnl ${result.pts > 0 ? 'pos' : 'neg'}`}>
              {result.pts > 0 ? '+' + result.pts : result.pts}
            </div>
            <button className="next-btn" onClick={nextRound} disabled={revealing}
              style={{ opacity: revealing ? 0.3 : 1, cursor: revealing ? 'not-allowed' : 'pointer', flexShrink: 0, minWidth: '80px' }}>
              {revealing ? '...' : round + 1 >= rounds.length ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}