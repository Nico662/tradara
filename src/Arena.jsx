import { io } from 'socket.io-client';
import { useState, useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { useLang } from './LangContext.jsx';
import { LANGS } from './i18n.js';


const SOCKET_URL = 'https://tradara-production.up.railway.app';
const FOREX_PAIRS = ['EUR/USD','GBP/USD','AUD/USD','USD/JPY','USD/CHF','USD/CAD'];

export default function Arena({ onBack }) {
  const { t, lang, setLang } = useLang();
  const [screen,    setScreen]   = useState('lobby');
  const [name,      setName]     = useState('');
  const [status,    setStatus]   = useState('');
  const [gameData,  setGameData] = useState(null);
  const [round,     setRound]    = useState(1);
  const [total,     setTotal]    = useState(10);
  const [scores,    setScores]   = useState({});
  const [names,     setNames]    = useState({});
  const [phase,     setPhase]    = useState('choose');
  const [result,    setResult]   = useState(null);
  const [myId,      setMyId]     = useState(null);
  const [opponent,  setOpponent] = useState('');
  const [finalData, setFinalData]= useState(null);
  const [timeLeft,  setTimeLeft] = useState(15);
  const [lobbyMode, setLobbyMode] = useState('select'); // select | random | create | join
 const [roomCode, setRoomCode]   = useState('');
 const [joinCode, setJoinCode]   = useState('');
  const socketRef = useRef(null);
  const timerRef  = useRef(null);
  const [chatMsg,     setChatMsg]     = useState(null);
 const [showChat,    setShowChat]    = useState(false);

  useEffect(() => {
    return () => {   
      socketRef.current?.disconnect();
      clearInterval(timerRef.current);
    };
  }, []);

  function startTimer() {
    clearInterval(timerRef.current);
    setTimeLeft(15);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          makeChoice('skip');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function initSocket(name) {
  if (socketRef.current) {
    if (socketRef.current.connected) return socketRef.current;
    socketRef.current.disconnect();
    socketRef.current = null;
  }

  const socket = io(SOCKET_URL, { reconnection: false });
  socketRef.current = socket;

  socket.on('connect_error', () => {
    setStatus('Error de conexión. ¿Está el servidor corriendo?');
  });

  socket.on('matchmaking:waiting', () => {
    setScreen('waiting');
    setStatus('Buscando oponente aleatorio...');
  });

  socket.on('room:created', (data) => {
    setRoomCode(data.code);
    setScreen('waiting');
    setStatus('waiting_for_friend');
  });

  socket.on('room:error', (data) => {
    setStatus(data.message);
  });

  socket.on('game:start', (data) => {
    setGameData(data);
    setRound(data.round);
    setTotal(data.total);
    setOpponent(data.opponent);
    setScreen('game');
    setPhase('choose');
    setResult(null);
    startTimer();
  });

  socket.on('game:opponent_chose', () => {
    setStatus('Oponente ya eligió — esperando...');
  });

  socket.on('game:round_result', (data) => {
    clearInterval(timerRef.current);
    setScores(data.scores);
    setNames(data.names);
    setResult(data);
    setPhase('result');
  });

  socket.on('game:next_round', (data) => {
    setGameData(data);
    setRound(data.round);
    setResult(null);
    setPhase('choose');
    setStatus('');
    startTimer();
  });

  socket.on('game:over', (data) => {
    setFinalData(data);
    setScreen('gameover');
  });

  socket.on('game:error', (data) => {
    setStatus(data.message);
    setScreen('lobby');
  });

  socket.on('game:opponent_disconnected', () => {
    setStatus('El oponente se desconectó');
    setScreen('lobby');
    socket.disconnect();
  });

  socket.on('game:opponent_forfeited', (data) => {
    clearInterval(timerRef.current);
    setFinalData({ forfeited: true, winner: data.winner });
    setScreen('gameover');
  });

  socket.on('connect', () => {
    setMyId(socket.id);
  });
  socket.on('chat:message', (data) => {
  setChatMsg(data);
  setTimeout(() => setChatMsg(null), 3000);
 });

 socket.on('connect', () => {
  setMyId(socket.id);
 });


  return socket;
}

function findRandom() {
  if (!name.trim()) return;
  const socket = initSocket(name.trim());
  socket.on('connect', () => {
    socket.emit('matchmaking:join', { name: name.trim() });
  });
  // si ya conectado
  if (socket.connected) {
    socket.emit('matchmaking:join', { name: name.trim() });
  }
}

function createRoom() {
  if (!name.trim()) return;
  const socket = initSocket(name.trim());
  socket.on('connect', () => {
    socket.emit('room:create', { name: name.trim() });
  });
  if (socket.connected) {
    socket.emit('room:create', { name: name.trim() });
  }
}

function joinRoom() {
  if (!name.trim() || !joinCode.trim()) return;
  const socket = initSocket(name.trim());
  socket.on('connect', () => {
    socket.emit('room:join', { name: name.trim(), code: joinCode.trim().toUpperCase() });
  });
  if (socket.connected) {
    socket.emit('room:join', { name: name.trim(), code: joinCode.trim().toUpperCase() });
  }
}
function sendChat(msg) {
  socketRef.current?.emit('chat:message', { msg });
  setChatMsg({ msg, from: 'tú' });
  setTimeout(() => setChatMsg(null), 3000);
  setShowChat(false);
}
  function makeChoice(choice) {
    if (phase !== 'choose') return;
    clearInterval(timerRef.current);
    setPhase('waiting_opponent');
    setStatus('Esperando al oponente...');
    socketRef.current?.emit('game:choice', { choice });
  }

  function goBack() {
    if (screen === 'game') {
      socketRef.current?.emit('game:forfeit');
    }
    socketRef.current?.disconnect();
    clearInterval(timerRef.current);
    onBack();
  }

// ── Lobby ─────────────────────────────────────────────────────────
  if (screen === 'lobby') return (
  <div id="gtm-root" style={{ position: 'relative' }}>
    <div className="scanlines" />
    <div style={{ padding: '40px 28px', position: 'relative', zIndex: 2 }}>
      <button onClick={goBack}
        style={{ background: 'transparent', border: 'none', color: '#3a4455', fontFamily: "'Space Mono', monospace", fontSize: '11px', cursor: 'pointer', letterSpacing: '0.06em', marginBottom: '32px', display: 'block' }}
        onMouseEnter={e => e.target.style.color = '#e2e8f0'}
        onMouseLeave={e => e.target.style.color = '#3a4455'}
      >← menu</button>

      <div style={{ position: 'absolute', top: '14px', right: '20px', zIndex: 10 }}>
        <div className="lang-selector">
          {Object.keys(LANGS).map(l => (
            <button key={l} className={`lang-btn${lang === l ? ' active' : ''}`} onClick={() => setLang(l)}>
              {LANGS[l].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '28px', color: '#f0f0f0', marginBottom: '8px' }}>
          {t.arena.title}
        </div>
        <div style={{ fontSize: '10px', color: '#3a4455', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {t.arena.sub}
        </div>
      </div>

      {/* Nombre */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '9px', color: '#4a5568', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{t.arena.yourName}</div>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="..." maxLength={16}
          style={{ width: '100%', background: '#0f141b', border: '1px solid #2a3345', borderRadius: '6px', padding: '12px 14px', color: '#e2e8f0', fontFamily: "'Space Mono', monospace", fontSize: '13px', outline: 'none' }}
        />
      </div>

      {status && <div style={{ fontSize: '10px', color: '#f05454', marginBottom: '12px' }}>{status}</div>}

      {/* Opciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Matchmaking aleatorio */}
        <button onClick={findRandom} disabled={!name.trim()}
          style={{ width: '100%', padding: '14px', background: name.trim() ? 'rgba(34,211,165,0.08)' : '#0f141b', border: `1px solid ${name.trim() ? '#22d3a5' : '#2a3345'}`, borderRadius: '6px', color: name.trim() ? '#22d3a5' : '#3a4455', fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: name.trim() ? 'pointer' : 'not-allowed' }}
        >⚡ {t.arena.findMatch}</button>

        {/* Crear sala */}
        <button onClick={createRoom} disabled={!name.trim()}
          style={{ width: '100%', padding: '14px', background: '#0f141b', border: `1px solid ${name.trim() ? '#2a3345' : '#1e2530'}`, borderRadius: '6px', color: name.trim() ? '#8899b0' : '#3a4455', fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: name.trim() ? 'pointer' : 'not-allowed' }}
        >🔒 {t.arena.createRoom}</button>

        {/* Unirse con código */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text" value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
            placeholder="XKQZ" maxLength={4}
            style={{ flex: 1, background: '#0f141b', border: '1px solid #2a3345', borderRadius: '6px', padding: '12px 14px', color: '#e2e8f0', fontFamily: "'Space Mono', monospace", fontSize: '16px', outline: 'none', letterSpacing: '0.2em', textAlign: 'center', textTransform: 'uppercase' }}
          />
          <button onClick={joinRoom} disabled={!name.trim() || joinCode.length < 4}
            style={{ padding: '12px 20px', background: name.trim() && joinCode.length >= 4 ? 'rgba(245,200,66,0.08)' : '#0f141b', border: `1px solid ${name.trim() && joinCode.length >= 4 ? '#f5c842' : '#2a3345'}`, borderRadius: '6px', color: name.trim() && joinCode.length >= 4 ? '#f5c842' : '#3a4455', fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, cursor: name.trim() && joinCode.length >= 4 ? 'pointer' : 'not-allowed', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}
          >{t.arena.joinRoom}</button>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '16px', background: '#0f141b', border: '1px solid #1e2530', borderRadius: '8px' }}>
        <div style={{ fontSize: '9px', color: '#3a4455', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>{t.arena.howTitle}</div>
        <div style={{ fontSize: '11px', color: '#4a5568', lineHeight: 1.8 }}>
          {t.arena.how1}<br/>
          {t.arena.how2}<br/>
          {t.arena.how3}<br/>
          {t.arena.how4}
        </div>
      </div>
    </div>
  </div>
);
  // ── Waiting ───────────────────────────────────────────────────────
  if (screen === 'waiting') return (
  <div id="gtm-root" style={{ position: 'relative' }}>
    <div className="scanlines" />
    <div style={{ padding: '40px 28px', position: 'relative', zIndex: 2, textAlign: 'center' }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', color: '#f0f0f0', marginBottom: '16px' }}>
        {status === 'waiting_for_friend' ? 'Sala creada' : t.arena.searching}
      </div>
      <div style={{ fontSize: '32px', marginBottom: '24px' }}>
        {status === 'waiting_for_friend' ? '🔒' : '⚔️'}
      </div>

      {status === 'waiting_for_friend' && roomCode ? (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', color: '#4a5568', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            comparte este código con tu amigo
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '48px', color: '#22d3a5', letterSpacing: '0.3em', background: '#0f141b', border: '1px solid #22d3a5', borderRadius: '10px', padding: '16px 24px', display: 'inline-block' }}>
            {roomCode}
          </div>
          <div style={{ marginTop: '12px', fontSize: '10px', color: '#3a4455', letterSpacing: '0.06em' }}>
            esperando que alguien se una...
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '10px', color: '#3a4455', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '32px' }}>
          {t.arena.playingAs} <span style={{ color: '#22d3a5' }}>{name}</span>
        </div>
      )}

      <button onClick={goBack}
        style={{ background: 'transparent', border: '1px solid #2a3345', borderRadius: '6px', color: '#4a5568', fontFamily: "'Space Mono', monospace", fontSize: '10px', padding: '8px 16px', cursor: 'pointer', letterSpacing: '0.06em' }}>
        {t.arena.cancel}
      </button>
    </div>
   </div>
);

  // ── Game ──────────────────────────────────────────────────────────
  if (screen === 'game' && gameData) {
    const myScore   = scores[myId] ?? 0;
    const oppId     = Object.keys(scores).find(id => id !== myId);
    const oppScore  = scores[oppId] ?? 0;
    const myResult  = result?.results?.[myId];
    const oppResult = result?.results?.[oppId];

    return (
      <div id="gtm-root" style={{ position: 'relative' }}>
        <div className="scanlines" />

        <button onClick={goBack}
          style={{ position: 'absolute', top: '14px', left: '16px', background: 'transparent', border: 'none', color: '#3a4455', fontFamily: "'Space Mono', monospace", fontSize: '11px', cursor: 'pointer', letterSpacing: '0.06em', zIndex: 10, padding: '4px 0', transition: 'color 0.15s' }}
          onMouseEnter={e => e.target.style.color = '#f05454'}
          onMouseLeave={e => e.target.style.color = '#3a4455'}
        >{t.arena.forfeit}</button>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2530', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', color: '#22d3a5' }}>{myScore}</div>
            <div style={{ fontSize: '9px', color: '#3a4455', letterSpacing: '0.06em' }}>{name.toUpperCase()}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ fontSize: '9px', color: '#4a5568', letterSpacing: '0.1em', textTransform: 'uppercase' }}>round {round}/{total}</div>
            {phase === 'choose' && (
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '20px', color: timeLeft <= 5 ? '#f05454' : '#f5c842' }}>
                {timeLeft}s
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', color: '#f05454' }}>{oppScore}</div>
            <div style={{ fontSize: '9px', color: '#3a4455', letterSpacing: '0.06em' }}>{opponent.toUpperCase()}</div>
          </div>
        </div>

        <div className="asset-bar">
          <div className="asset-name">{gameData.asset}</div>
          <div className="timeframe-badge">{gameData.interval || gameData.asset?.interval || '1H'}</div>
        </div>

        <div className="chart-area">
          <ArenaChart candles={gameData.visible} future={phase === 'result' ? gameData.future : null} assetName={gameData.asset} />
        </div>

        {phase === 'choose' && (
          <div className="action-zone">
            <div className="prompt-text">{t.game.whatNext}</div>
            <div className="buttons-row">
              <button className="trade-btn long" onClick={() => makeChoice('long')}>
                <span className="btn-icon">▲</span><span>Long</span>
                <span className="btn-sublabel">{t.game.longSub}</span>
              </button>
              <button className="trade-btn notrade" onClick={() => makeChoice('skip')}>
                <span className="btn-icon">—</span><span>{t.game.noTrade}</span>
                <span className="btn-sublabel">{t.game.noTradeSub}</span>
              </button>
              <button className="trade-btn short" onClick={() => makeChoice('short')}>
                <span className="btn-icon">▼</span><span>Short</span>
                <span className="btn-sublabel">{t.game.shortSub}</span>
              </button>
            </div>
          </div>
        )}

        {phase === 'waiting_opponent' && (
          <div style={{ padding: '16px 20px', textAlign: 'center', fontSize: '10px', color: '#4a5568', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {status}
          </div>
        )}

        {phase === 'result' && result && (
          <div style={{ padding: '0 20px 16px', position: 'relative', zIndex: 2 }}>
            <div style={{ borderRadius: '8px', padding: '14px 16px', border: `1px solid ${myResult?.win ? '#22d3a5' : '#f05454'}`, background: myResult?.win ? 'rgba(34,211,165,0.05)' : 'rgba(240,84,84,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', color: myResult?.win ? '#22d3a5' : '#f05454' }}>
                    {myResult?.win ? t.arena.correct : t.arena.incorrect}
                  </div>
                  <div style={{ fontSize: '9px', color: '#4a5568', marginTop: '2px' }}>
                    {t.arena.youPlayed}: {myResult?.choice?.toUpperCase()} · {t.arena.oppPlayed}: {oppResult?.choice?.toUpperCase()}
                  </div>
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '20px', color: myResult?.win ? '#22d3a5' : '#f05454' }}>
                  {myResult?.win ? '+100' : '±0'}
                </div>
              </div>
              <div style={{ fontSize: '9px', color: '#3a4455', letterSpacing: '0.06em' }}>
                precio {result.direction === 'up' ? t.arena.priceUp : result.direction === 'down' ? t.arena.priceDown : t.arena.priceFlat} {result.pctMove > 0 ? '+' : ''}{result.pctMove.toFixed(2)}%
              </div>
              <div style={{ marginTop: '8px', fontSize: '9px', color: '#3a4455', textAlign: 'center', letterSpacing: '0.06em' }}>
                {t.arena.nextRound}
              </div>
            </div>
          </div>
        )}
        {/* Chat burbuja recibida */}
{chatMsg && (
  <div style={{
    position: 'absolute', top: '60px', right: '16px', zIndex: 20,
    background: '#1a2030', border: '1px solid #2a3345',
    borderRadius: '8px', padding: '8px 12px',
    fontFamily: "'Space Mono', monospace", fontSize: '11px',
    color: '#e2e8f0', maxWidth: '160px',
    animation: 'slideUp 0.2s ease',
  }}>
    <span style={{ color: '#22d3a5', fontSize: '9px' }}>{chatMsg.from}</span>
    <div>{chatMsg.msg}</div>
  </div>
)}

{/* Panel de mensajes */}
{showChat && (
  <div style={{
    position: 'absolute', bottom: '60px', right: '16px', zIndex: 20,
    background: '#0f141b', border: '1px solid #2a3345',
    borderRadius: '10px', padding: '10px', display: 'flex',
    flexWrap: 'wrap', gap: '6px', maxWidth: '200px',
  }}>
    {['👍', '😂', '🔥', 'gg', 'wp', '😤'].map(msg => (
      <button key={msg} onClick={() => sendChat(msg)}
        style={{ background: '#1a2030', border: '1px solid #2a3345', borderRadius: '6px', padding: '6px 10px', color: '#e2e8f0', fontFamily: "'Space Mono', monospace", fontSize: '13px', cursor: 'pointer' }}>
        {msg}
      </button>
    ))}
  </div>
)}

{/* Botón chat */}
<button onClick={() => setShowChat(s => !s)}
  style={{
    position: 'absolute', bottom: '36px', right: '16px', zIndex: 20,
    background: '#1a2030', border: '1px solid #2a3345',
    borderRadius: '50%', width: '36px', height: '36px',
    fontSize: '16px', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  }}
>💬</button>



        <div className="ticker-tape">
          BTC +3.2% · ETH -1.8% · SPX +0.4% · GOLD +0.9% · EUR/USD -0.2%
        </div>
      </div>
    );
  }

  // ── Game Over ─────────────────────────────────────────────────────
  if (screen === 'gameover' && finalData) {
    if (finalData.forfeited) {
      const iWon = finalData.winner === name;
      return (
        <div id="gtm-root" style={{ position: 'relative' }}>
          <div className="scanlines" />
          <div style={{ padding: '40px 28px 36px', position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '36px', color: iWon ? '#22d3a5' : '#f05454', marginBottom: '4px' }}>
              {iWon ? t.arena.won : t.arena.forfeited}
            </div>
            <div style={{ fontSize: '10px', color: '#3a4455', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '32px' }}>
              {iWon ? t.arena.forfeitWon : t.arena.forfeitLost}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setScreen('lobby'); setResult(null); setScores({}); setFinalData(null); }}
                style={{ flex: 1, padding: '14px', background: '#0f141b', border: '1px solid #22d3a5', borderRadius: '6px', color: '#22d3a5', fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                {t.arena.rematch}
              </button>
              <button onClick={goBack}
                style={{ flex: 1, padding: '14px', background: '#0f141b', border: '1px solid #2a3345', borderRadius: '6px', color: '#8899b0', fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                {t.arena.menu}
              </button>
            </div>
          </div>
        </div>
      );
    }

    const myScore  = finalData.scores?.[myId] ?? 0;
    const oppId    = Object.keys(finalData.scores ?? {}).find(id => id !== myId);
    const oppScore = finalData.scores?.[oppId] ?? 0;
    const iWon     = myScore > oppScore;
    const isDraw   = myScore === oppScore;

    return (
      <div id="gtm-root" style={{ position: 'relative' }}>
        <div className="scanlines" />
        <div style={{ padding: '40px 28px 36px', position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '36px', color: iWon ? '#22d3a5' : isDraw ? '#f5c842' : '#f05454', marginBottom: '4px' }}>
            {iWon ? t.arena.won : isDraw ? t.arena.draw : t.arena.lost}
          </div>
          <div style={{ fontSize: '10px', color: '#3a4455', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '32px' }}>
            {iWon ? t.arena.wonSub : isDraw ? t.arena.drawSub : t.arena.lostSub}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
            <div style={{ flex: 1, background: '#0f141b', border: '1px solid #22d3a5', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '9px', color: '#3a4455', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{name}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '32px', color: '#22d3a5' }}>{myScore}</div>
            </div>
            <div style={{ flex: 1, background: '#0f141b', border: '1px solid #f05454', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '9px', color: '#3a4455', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{opponent}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '32px', color: '#f05454' }}>{oppScore}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setScreen('lobby'); setResult(null); setScores({}); socketRef.current?.disconnect(); }}
              style={{ flex: 1, padding: '14px', background: '#0f141b', border: '1px solid #22d3a5', borderRadius: '6px', color: '#22d3a5', fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
              {t.arena.rematch}
            </button>
            <button onClick={goBack}
              style={{ flex: 1, padding: '14px', background: '#0f141b', border: '1px solid #2a3345', borderRadius: '6px', color: '#8899b0', fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
              {t.arena.menu}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
function getChartHeight() {
  const vh = window.innerHeight;
  if (vh < 700) return 160;
  if (vh < 900) return 200;
  return 240;
}
// ── ArenaChart ────────────────────────────────────────────────────
function ArenaChart({ candles, future, assetName }) {
  const containerRef = useRef(null);
  const chartRef2    = useRef(null);
  const seriesRef    = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !candles) return;

    let chart;
    let ro;

    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      chart = createChart(containerRef.current, {
        width:  containerRef.current.clientWidth,
        height: getChartHeight(),
        layout: { background: { color: 'transparent' }, textColor: '#3a4455' },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.03)' },
          horzLines: { color: 'rgba(255,255,255,0.04)' },
        },
        rightPriceScale: { borderColor: 'transparent' },
        timeScale: { borderColor: 'transparent', barSpacing: 14, rightOffset: 3, visible: false },
        crosshair:    { mode: 1 },
        handleScroll: true,
        handleScale:  true,
      });

      const series = chart.addSeries(CandlestickSeries, {
        upColor:         '#22d3a5', downColor:       '#f05454',
        borderUpColor:   '#22d3a5', borderDownColor: '#f05454',
        wickUpColor:     '#22d3a5', wickDownColor:   '#f05454',
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      });

      series.setData(candles);
      chart.timeScale().applyOptions({
       fixLeftEdge:  true,
       fixRightEdge: false,
});
      chartRef2.current = chart;
      seriesRef.current = series;

      ro = new ResizeObserver(() => {
        if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
      });
      ro.observe(containerRef.current);
    }, 10);

    return () => {
      clearTimeout(timer);
      if (ro) ro.disconnect();
      if (chart) chart.remove();
    };
  }, [candles]);

  // reveal velas una a una cuando llega el futuro
  useEffect(() => {
    if (!future || !seriesRef.current || !candles) return;

    let i = 0;
    const interval = setInterval(() => {
      if (!seriesRef.current || i >= future.length) {
        clearInterval(interval);
        return;
      }
      const next = future.slice(0, i + 1);
      seriesRef.current.setData([
        ...candles,
        ...next.map(c => ({
          ...c,
          color:       c.close >= c.open ? 'rgba(34,211,165,0.5)' : 'rgba(240,84,84,0.5)',
          wickColor:   c.close >= c.open ? 'rgba(34,211,165,0.5)' : 'rgba(240,84,84,0.5)',
          borderColor: c.close >= c.open ? 'rgba(34,211,165,0.5)' : 'rgba(240,84,84,0.5)',
        })),
      ]);
      i++;
    }, 120);

    return () => clearInterval(interval);
  }, [future]);

  return <div ref={containerRef} style={{ width: '100%', height: `${getChartHeight()}px` }} />;
}