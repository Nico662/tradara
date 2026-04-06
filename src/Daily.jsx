import { useState, useEffect, useRef } from 'react';
import { useLang } from './LangContext.jsx';
import Chart, { generateCandles } from './Chart.jsx';

export default function Daily({ onBack }) {
  const { t } = useLang();
  const [phase, setPhase]       = useState('loading'); // loading, choose, reveal, done, already
  const [candles, setCandles]   = useState(null);
  const [future, setFuture]     = useState(null);
  const [asset, setAsset]       = useState(null);
  const [interval, setInterval] = useState('15m');
  const [result, setResult]     = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const chartRef = useRef(null);

  useEffect(() => {
    // cuenta atrás hasta medianoche
    const timer = setInterval(() => {
      const now       = new Date();
      const midnight  = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff      = midnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const today   = new Date().toISOString().split('T')[0];
    const played  = localStorage.getItem('tradara_daily_played');
    if (played === today) {
      const saved = JSON.parse(localStorage.getItem('tradara_daily_result') || 'null');
      setResult(saved);
      setPhase('already');
      return;
    }

    fetch('https://tradara-production.up.railway.app/daily')
      .then(r => r.json())
      .then(data => {
        setCandles(data.visible);
        setFuture(data.future);
        setAsset(data.asset);
        setInterval(data.interval);
        setPhase('choose');
      })
      .catch(() => setPhase('error'));
  }, []);

  const makeChoice = (choice) => {
    if (phase !== 'choose' || !future || future.length === 0) return;
    const lastClose  = candles[candles.length - 1].close;
    const lastFuture = future[future.length - 1].close;
    const pctMove    = (lastFuture - lastClose) / lastClose * 100;
    const direction  = pctMove > 0.1 ? 'up' : pctMove < -0.1 ? 'down' : 'flat';
    const win        = (choice === 'long'  && direction === 'up')
                    || (choice === 'short' && direction === 'down')
                    || (choice === 'skip'  && direction === 'flat');

    const res = { choice, direction, pctMove, win };
    setResult(res);
    setPhase('reveal');

    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('tradara_daily_played', today);
    localStorage.setItem('tradara_daily_result', JSON.stringify(res));
  };

  const resultColor = result?.win ? '#22d3a5' : '#f05454';

  return (
    <div id="gtm-root" style={{ position: 'relative' }}>
      <div className="scanlines" />
      <div style={{ padding: '48px 28px 32px', position: 'relative', zIndex: 2 }}>

        <button onClick={onBack}
          style={{ background: 'transparent', border: 'none', color: '#3a4455', fontFamily: "'Space Mono', monospace", fontSize: '11px', cursor: 'pointer', letterSpacing: '0.06em', marginBottom: '24px', display: 'block' }}
          onMouseEnter={e => e.target.style.color = '#e2e8f0'}
          onMouseLeave={e => e.target.style.color = '#3a4455'}
        >← back</button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '22px', color: '#f0f0f0' }}>
            Daily Challenge
          </div>
          <div style={{ fontSize: '9px', color: '#3a4455', fontFamily: "'Space Mono', monospace", letterSpacing: '0.1em' }}>
            {new Date().toISOString().split('T')[0]}
          </div>
        </div>

        <div style={{ fontSize: '9px', color: '#3a4455', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '24px' }}>
          next challenge in {timeLeft}
        </div>

        {phase === 'loading' && (
          <div style={{ textAlign: 'center', color: '#3a4455', fontSize: '11px', marginTop: '60px' }}>
            loading...
          </div>
        )}

        {phase === 'error' && (
          <div style={{ textAlign: 'center', color: '#f05454', fontSize: '11px', marginTop: '60px' }}>
            error loading challenge. try again later.
          </div>
        )}

        {(phase === 'choose' || phase === 'reveal') && candles && (
          <>
            <div className="asset-bar" style={{ marginBottom: '8px' }}>
              <div className="asset-name">{asset}</div>
              <div className="timeframe-badge" style={{ marginLeft: 'auto' }}>{interval}</div>
            </div>

            <div style={{ height: '220px', marginBottom: '12px' }}>
              <Chart
                ref={chartRef}
                asset={{ name: asset, tf: interval, vol: 0.02, cat: 'crypto', binance: null, yahoo: null, alphavantage: null, base: () => candles[0]?.close || 100 }}
                overrideCandles={candles}
                overrideFuture={future}
              />
            </div>

            {phase === 'choose' && (
              <>
                <div style={{ fontSize: '10px', color: '#5a6a7d', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center' }}>
                  one shot — what happens next?
                </div>
                <div className="buttons-row">
                  <button className="trade-btn long" onClick={() => makeChoice('long')}>
                    <span className="btn-icon">▲</span>
                    <span>Long</span>
                    <span className="btn-sublabel">price goes up</span>
                  </button>
                  <button className="trade-btn notrade" onClick={() => makeChoice('skip')}>
                    <span className="btn-icon">—</span>
                    <span>No Trade</span>
                    <span className="btn-sublabel">stay flat</span>
                  </button>
                  <button className="trade-btn short" onClick={() => makeChoice('short')}>
                    <span className="btn-icon">▼</span>
                    <span>Short</span>
                    <span className="btn-sublabel">price goes down</span>
                  </button>
                </div>
              </>
            )}

            {phase === 'reveal' && result && (
              <div style={{ background: result.win ? 'rgba(34,211,165,0.05)' : 'rgba(240,84,84,0.05)', border: `1px solid ${resultColor}`, borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '28px', color: resultColor, marginBottom: '8px' }}>
                  {result.win ? '✓ CORRECT' : '✗ WRONG'}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7a8d' }}>
                  price {result.direction === 'up' ? '▲ went up' : result.direction === 'down' ? '▼ went down' : '— stayed flat'} · {result.pctMove > 0 ? '+' : ''}{result.pctMove.toFixed(2)}%
                </div>
                <div style={{ marginTop: '16px', fontSize: '9px', color: '#3a4455', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  come back tomorrow for the next challenge
                </div>
              </div>
            )}
          </>
        )}

        {phase === 'already' && result && (
          <div style={{ background: result.win ? 'rgba(34,211,165,0.05)' : 'rgba(240,84,84,0.05)', border: `1px solid ${result.win ? '#22d3a5' : '#f05454'}`, borderRadius: '8px', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#4a5568', marginBottom: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              today's result
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '28px', color: result.win ? '#22d3a5' : '#f05454', marginBottom: '8px' }}>
              {result.win ? '✓ CORRECT' : '✗ WRONG'}
            </div>
            <div style={{ fontSize: '11px', color: '#6b7a8d', marginBottom: '16px' }}>
              you played {result.choice.toUpperCase()} · price {result.direction === 'up' ? '▲ went up' : result.direction === 'down' ? '▼ went down' : '— stayed flat'}
            </div>
            <div style={{ fontSize: '9px', color: '#3a4455', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              next challenge in {timeLeft}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}