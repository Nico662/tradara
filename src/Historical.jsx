import { useState, useEffect, useRef } from 'react';
import { useLang } from './LangContext.jsx';
import { HISTORICAL_EVENTS } from './historical.js';
import Chart from './Chart.jsx';

export default function Historical({ onBack }) {
  const { t } = useLang();
  const [phase, setPhase]       = useState('select'); // select, loading, choose, reveal, done
  const [event, setEvent]       = useState(null);
  const [candles, setCandles]   = useState(null);
  const [future, setFuture]     = useState(null);
  const [result, setResult]     = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [copied, setCopied]     = useState(false);
  const chartRef = useRef(null);

  async function loadEvent(ev) {
    setEvent(ev);
    setPhase('loading');
    try {
      const res  = await fetch(`https://tradara-production.up.railway.app/candles?symbol=${encodeURIComponent(ev.symbol)}&interval=${ev.interval}&from=${ev.from}&to=${ev.to}`);
      const data = await res.json();
      if (data.error || !data.length) throw new Error('No data');
      const split  = Math.floor(data.length * 0.8);
      setCandles(data.slice(0, split));
      setFuture(data.slice(split));
      setPhase('choose');
    } catch {
      setPhase('select');
      alert('Error loading historical data. Try another event.');
    }
  }

  const makeChoice = (choice) => {
    if (phase !== 'choose' || !future || future.length === 0) return;
    setPhase('reveal');
    setRevealing(true);
    chartRef.current?.revealFuture(future, () => setRevealing(false));

    const lastClose  = candles[candles.length - 1].close;
    const lastFuture = future[future.length - 1].close;
    const pctMove    = (lastFuture - lastClose) / lastClose * 100;
    const direction  = pctMove > 0.1 ? 'up' : pctMove < -0.1 ? 'down' : 'flat';
    const win        = (choice === 'long'  && direction === 'up')
                    || (choice === 'short' && direction === 'down')
                    || (choice === 'skip'  && direction === 'flat');
    setResult({ choice, direction, pctMove, win });
  };

  const shareResult = () => {
    if (!result || !event) return;
    const text = `📜 Tradara Historical Mode\n${event.emoji} ${event.title}\n\n${result.win ? '✅ CORRECT' : '❌ WRONG'} — ${result.direction === 'up' ? '▲' : result.direction === 'down' ? '▼' : '—'} ${result.pctMove > 0 ? '+' : ''}${result.pctMove.toFixed(2)}%\n\nCan you beat history? tradara.dev`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const resultColor = result?.win ? '#22d3a5' : '#f05454';

  // ── Select screen ────────────────────────────────────────────────
  if (phase === 'select') return (
    <div id="gtm-root" style={{ position: 'relative' }}>
      <div className="scanlines" />
      <div style={{ padding: '48px 24px 32px', position: 'relative', zIndex: 2 }}>
        <button onClick={onBack}
          style={{ background: 'transparent', border: 'none', color: '#3a4455', fontFamily: "'Space Mono', monospace", fontSize: '11px', cursor: 'pointer', letterSpacing: '0.06em', marginBottom: '24px', display: 'block' }}
          onMouseEnter={e => e.target.style.color = '#e2e8f0'}
          onMouseLeave={e => e.target.style.color = '#3a4455'}
        >← back</button>

        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '22px', color: '#f0f0f0', marginBottom: '4px' }}>
          📜 Historical Mode
        </div>
        <div style={{ fontSize: '9px', color: '#3a4455', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '24px' }}>
          50 real market events · can you call them?
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {HISTORICAL_EVENTS.map(ev => (
            <button key={ev.id} onClick={() => loadEvent(ev)}
              style={{ background: '#0f141b', border: '1px solid #1e2530', borderRadius: '8px', padding: '12px 16px', textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#22d3a5'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1e2530'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>{ev.emoji}</span>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '12px', color: '#f0f0f0' }}>
                    {ev.title}
                  </div>
                  <div style={{ fontSize: '9px', color: '#4a5568', marginTop: '2px' }}>
                    {ev.name} · {ev.from}
                  </div>
                </div>
                <span style={{ marginLeft: 'auto', color: '#22d3a5', fontSize: '14px' }}>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Loading ──────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div id="gtm-root" style={{ position: 'relative' }}>
      <div className="scanlines" />
      <div style={{ padding: '48px 24px', position: 'relative', zIndex: 2, textAlign: 'center', marginTop: '60px' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>{event?.emoji}</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', color: '#f0f0f0', marginBottom: '8px' }}>
          {event?.title}
        </div>
        <div style={{ fontSize: '10px', color: '#3a4455', letterSpacing: '0.1em' }}>loading historical data...</div>
      </div>
    </div>
  );

  // ── Choose / Reveal ──────────────────────────────────────────────
  return (
    <div id="gtm-root" style={{ position: 'relative' }}>
      <div className="scanlines" />
      <div style={{ padding: '48px 24px 32px', position: 'relative', zIndex: 2 }}>

        <button onClick={() => { setPhase('select'); setResult(null); setCandles(null); setFuture(null); }}
          style={{ background: 'transparent', border: 'none', color: '#3a4455', fontFamily: "'Space Mono', monospace", fontSize: '11px', cursor: 'pointer', letterSpacing: '0.06em', marginBottom: '16px', display: 'block' }}
          onMouseEnter={e => e.target.style.color = '#e2e8f0'}
          onMouseLeave={e => e.target.style.color = '#3a4455'}
        >← events</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '24px' }}>{event?.emoji}</span>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', color: '#f0f0f0' }}>
              {phase === 'choose' ? '???' : event?.title}
            </div>
            <div style={{ fontSize: '9px', color: '#4a5568' }}>
              {event?.name} · {phase === 'choose' ? '????' : event?.from}
            </div>
          </div>
        </div>

        <div className="chart-area">
          <div className="chart-wrapper">
            <Chart ref={chartRef} asset={{
              name:          event?.name,
              tf:            event?.interval,
              vol:           0.02,
              cat:           'indices',
              binance:       null,
              yahoo:         null,
              alphavantage:  null,
              base:          () => candles?.[0]?.close || 100,
              _dailyVisible: candles,
              _dailyFuture:  future,
            }} />
          </div>
        </div>

        {phase === 'choose' && (
          <>
            <div style={{ fontSize: '10px', color: '#5a6a7d', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '12px 0 10px', textAlign: 'center' }}>
              what happens next in history?
            </div>
            <div className="buttons-row" style={{ padding: '0' }}>
              <button className="trade-btn long" onClick={() => makeChoice('long')}>
                <span className="btn-icon">▲</span><span>Long</span>
                <span className="btn-sublabel">price goes up</span>
              </button>
              <button className="trade-btn notrade" onClick={() => makeChoice('skip')}>
                <span className="btn-icon">—</span><span>No Trade</span>
                <span className="btn-sublabel">stays flat</span>
              </button>
              <button className="trade-btn short" onClick={() => makeChoice('short')}>
                <span className="btn-icon">▼</span><span>Short</span>
                <span className="btn-sublabel">price goes down</span>
              </button>
            </div>
          </>
        )}

        {(phase === 'reveal' || phase === 'done') && result && !revealing && (
          <div style={{ marginTop: '12px', background: result.win ? 'rgba(34,211,165,0.05)' : 'rgba(240,84,84,0.05)', border: `1px solid ${resultColor}`, borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', color: resultColor, marginBottom: '8px', textAlign: 'center' }}>
              {result.win ? '✓ CORRECT' : '✗ WRONG'}
            </div>
            <div style={{ fontSize: '11px', color: '#6b7a8d', textAlign: 'center', marginBottom: '16px' }}>
              price {result.direction === 'up' ? '▲ went up' : result.direction === 'down' ? '▼ went down' : '— stayed flat'} · {result.pctMove > 0 ? '+' : ''}{result.pctMove.toFixed(2)}%
            </div>
            <div style={{ background: '#0f141b', border: '1px solid #1e2530', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '18px' }}>{event?.emoji}</span>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '13px', color: '#f0f0f0' }}>{event?.title}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#6b7a8d', lineHeight: 1.6 }}>{event?.desc}</div>
              <div style={{ fontSize: '9px', color: '#3a4455', marginTop: '8px' }}>{event?.from} → {event?.to}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={shareResult}
                style={{ flex: 1, padding: '12px', background: 'rgba(34,211,165,0.08)', border: '1px solid #22d3a5', borderRadius: '6px', color: '#22d3a5', fontFamily: "'Space Mono', monospace", fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                {copied ? '✓ copied!' : '📋 share'}
              </button>
              <button onClick={() => { setPhase('select'); setResult(null); setCandles(null); setFuture(null); }}
                style={{ flex: 1, padding: '12px', background: '#0f141b', border: '1px solid #2a3345', borderRadius: '6px', color: '#8899b0', fontFamily: "'Space Mono', monospace", fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                try another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
