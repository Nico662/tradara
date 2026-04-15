const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const YahooFinance = require('yahoo-finance2').default;
const cors         = require('cors');

const yf         = new YahooFinance();
const app        = express();
const httpServer = http.createServer(app);
const io         = new Server(httpServer, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3001;
const cron = require('node-cron');
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:nicolasvidalcorrecher@tradara.dev',
  'BEWPkbh1HeSsw08H0EsELp5TIPD2gcQ8Yfa1RsSW-9jER3uvoeVUTazcIqjlf4UNFKe7QeqQ8ZlVjGI72pinR0I',
  'PCyRdLvdQswDzk0DlbImRKEgPbVLewsWGHCha07sXw8'
);

let pushSubscriptions = [];
const rateLimit = require('express-rate-limit');
app.use(cors());
// Rate limiting general — 100 requests por minuto por IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting estricto para /daily — 10 requests por minuto por IP
const dailyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests for daily challenge.' },
});

// Rate limiting para candles — 30 requests por minuto por IP
const candlesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many candle requests.' },
});

app.use(generalLimiter);
app.use('/daily', dailyLimiter);
app.use('/candles', candlesLimiter);
app.get('/candles', async (req, res) => {
  const { symbol, interval, from, to } = req.query;
  try {
    let period1, period2;
    if (from && to) {
      period1 = from;
      period2 = to;
    } else if (interval === '1h') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      period1 = d.toISOString().split('T')[0];
    } else {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 2);
      period1 = d.toISOString().split('T')[0];
    }

    const result  = await yf.chart(symbol, {
      interval: interval === '1h' ? '1h' : '1d',
      period1,
      ...(period2 ? { period2 } : {}),
    });
    const quotes  = result.quotes.filter(q => q.open && q.high && q.low && q.close);
    const candles = quotes.slice(-500).map(q => ({
      time:  Math.floor(new Date(q.date).getTime() / 1000),
      open:  q.open,
      high:  q.high,
      low:   q.low,
      close: q.close,
    }));
    res.json(candles);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/stats', (req, res) => {
  res.json({
    online:      io.engine.clientsCount,
    gamesPlayed: totalGamesPlayed,
  });
});
app.post('/push/subscribe', express.json(), (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: 'Invalid subscription' });
  const exists = pushSubscriptions.find(s => s.endpoint === sub.endpoint);
  if (!exists) pushSubscriptions.push(sub);
  res.json({ ok: true });
});

app.post('/push/send', express.json(), (req, res) => {
  const payload = JSON.stringify({
    title: '⚡ Daily Challenge',
    body:  "Today's chart is ready. Can you call it?",
    url:   'https://tradara.dev',
  });
  const promises = pushSubscriptions.map(sub =>
    webpush.sendNotification(sub, payload).catch(err => {
      if (err.statusCode === 410) {
        pushSubscriptions = pushSubscriptions.filter(s => s.endpoint !== sub.endpoint);
      }
    })
  );
  Promise.all(promises).then(() => res.json({ ok: true, sent: pushSubscriptions.length }));
});
const DAILY_ASSETS = [
  { source: 'kraken', symbol: 'BTCUSD',  name: 'BTC/USD', interval: '15m' },
  { source: 'kraken', symbol: 'ETHUSD',  name: 'ETH/USD', interval: '15m' },
  { source: 'kraken', symbol: 'SOLUSD',  name: 'SOL/USD', interval: '15m' },
  { source: 'kraken', symbol: 'XRPUSD',  name: 'XRP/USD', interval: '15m' },
  { source: 'yahoo',  symbol: 'EURUSD=X', name: 'EUR/USD', interval: '1h'  },
  { source: 'yahoo',  symbol: 'GBPUSD=X', name: 'GBP/USD', interval: '1h'  },
  { source: 'yahoo',  symbol: 'JPY=X',    name: 'USD/JPY', interval: '1h' },
  { source: 'yahoo',  symbol: 'AUDUSD=X', name: 'AUD/USD', interval: '1h' },
];

let dailyChallenge = null;
let dailyDate      = null;

async function getDailyChallenge() {
  const today = new Date().toISOString().split('T')[0];
  if (dailyDate === today && dailyChallenge) return dailyChallenge;

  // seed determinístico basado en la fecha
  const seed  = today.replace(/-/g, '');
  const idx   = parseInt(seed) % DAILY_ASSETS.length;
  const asset = DAILY_ASSETS[idx];

  const candles = await fetchCandles(asset);
  const total   = candles.length;
  const visible = Math.min(80, Math.floor(total * 0.8));
  const future  = Math.min(20, total - visible);

  // ventana determinística basada en fecha
  const maxStart = Math.max(0, total - visible - future);
  const start    = parseInt(seed.slice(-4)) % (maxStart || 1);

  dailyChallenge = {
    date:    today,
    asset:   asset.name,
    interval: asset.interval,
    visible: candles.slice(start, start + visible),
    future:  candles.slice(start + visible, start + visible + future),
  };
  dailyDate = today;
  return dailyChallenge;
}

app.get('/daily', async (req, res) => {
  try {
    const challenge = await getDailyChallenge();
    res.json({
      date:     challenge.date,
      asset:    challenge.asset,
      interval: challenge.interval,
      visible:  challenge.visible,
      future:   challenge.future,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const ASSETS = [
  { name: 'BTC/USD',  source: 'kraken', symbol: 'XBTUSD',  interval: '15m' },
  { name: 'ETH/USD',  source: 'kraken', symbol: 'ETHUSD',  interval: '15m' },
  { name: 'SOL/USD',  source: 'kraken', symbol: 'SOLUSD',  interval: '15m' },
  { name: 'XRP/USD',  source: 'kraken', symbol: 'XRPUSD',  interval: '15m' },
  { name: 'DOGE/USD', source: 'kraken', symbol: 'DOGEUSD', interval: '15m' },
  { name: 'LINK/USD', source: 'kraken', symbol: 'LINKUSD', interval: '15m' },
  { name: 'AVAX/USD', source: 'kraken', symbol: 'AVAXUSD', interval: '15m' },
  { name: 'ADA/USD',  source: 'kraken', symbol: 'ADAUSD',  interval: '15m' },
  { name: 'DOT/USD',  source: 'kraken', symbol: 'DOTUSD',  interval: '15m' },
  { name: 'EUR/USD',  source: 'yahoo',  symbol: 'EURUSD=X', interval: '1h' },
  { name: 'GBP/USD',  source: 'yahoo',  symbol: 'GBPUSD=X', interval: '1h' },
  { name: 'USD/JPY',  source: 'yahoo',  symbol: 'JPY=X',    interval: '1h' },
  { name: 'AUD/USD',  source: 'yahoo',  symbol: 'AUDUSD=X', interval: '1h' },
];

const TOTAL_ROUNDS   = 10;
const rooms          = {};
let   waiting        = null;
let   totalGamesPlayed = 0;

async function fetchCandles(asset) {
  console.log('Fetching:', asset.name, asset.source);

  if (asset.source === 'kraken') {
    const intervalMap = { '15m': 15, '1h': 60, '1d': 1440 };
    const minutes = intervalMap[asset.interval] || 15;
    const url  = `https://api.kraken.com/0/public/OHLC?pair=${asset.symbol}&interval=${minutes}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.error && data.error.length > 0) throw new Error('Kraken error: ' + data.error[0]);
    const pair    = Object.keys(data.result).find(k => k !== 'last');
    const candles = data.result[pair].map(k => ({
      time:  k[0],
      open:  parseFloat(k[1]),
      high:  parseFloat(k[2]),
      low:   parseFloat(k[3]),
      close: parseFloat(k[4]),
    }));
    return candles;
  } else {
    const from = new Date();
    from.setDate(from.getDate() - 29);
    const result = await yf.chart(asset.symbol, {
      interval: '1h',
      period1:  from.toISOString().split('T')[0],
    });
    const candles = result.quotes
      .filter(q => q.open && q.high && q.low && q.close)
      .map(q => ({
        time:  Math.floor(new Date(q.date).getTime() / 1000),
        open:  q.open,
        high:  q.high,
        low:   q.low,
        close: q.close,
      }));
    return candles;
  }
}

function randomWindow(candles) {
  const maxStart = Math.max(0, candles.length - 100);
  const start    = Math.floor(Math.random() * maxStart);
  return {
    visible: candles.slice(start, start + 80),
    future:  candles.slice(start + 80, start + 100),
  };
}

async function startRoom(socket1, socket2) {
  const shuffled = [...ASSETS].sort(() => Math.random() - 0.5);

  for (const asset of shuffled) {
    try {
      const candles = await fetchCandles(asset);
      if (!candles || candles.length < 100) continue;

      const roomId = `room_${Date.now()}`;
      const win    = randomWindow(candles);

      rooms[roomId] = {
        players:    [socket1.id, socket2.id],
        scores:     { [socket1.id]: 0, [socket2.id]: 0 },
        names:      { [socket1.id]: socket1.playerName, [socket2.id]: socket2.playerName },
        round:      1,
        choices:    {},
        allCandles: candles,
        visible:    win.visible,
        future:     win.future,
        asset,
        usedAssets: [asset.name],
      };

      socket1.join(roomId);
      socket2.join(roomId);
      socket1.roomId = roomId;
      socket2.roomId = roomId;

      const payload = {
        roomId,
        round:    1,
        total:    TOTAL_ROUNDS,
        asset:    asset.name,
        interval: asset.interval,
        visible:  win.visible,
        future:   win.future,
      };

      socket1.emit('game:start', { ...payload, opponent: socket2.playerName });
      socket2.emit('game:start', { ...payload, opponent: socket1.playerName });
      totalGamesPlayed++;
      return;

    } catch (err) {
      console.log('Error con', asset.name, ':', err.message);
    }
  }

  socket1.emit('game:error', { message: 'Error al cargar datos. Intenta de nuevo.' });
  socket2.emit('game:error', { message: 'Error al cargar datos. Intenta de nuevo.' });
}

function resolveRound(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const lastClose  = room.visible[room.visible.length - 1].close;
  const lastFuture = room.future[room.future.length - 1].close;
  const pctMove    = (lastFuture - lastClose) / lastClose * 100;
  const direction  = pctMove > 0.1 ? 'up' : pctMove < -0.1 ? 'down' : 'flat';

  const roundResult = {};
  for (const [pid, choice] of Object.entries(room.choices)) {
    const win = (choice === 'long'  && direction === 'up')
             || (choice === 'short' && direction === 'down')
             || (choice === 'skip'  && direction === 'flat');
    const pts = win && choice !== 'skip' ? 100 : win && choice === 'skip' ? 50 : 0;
    room.scores[pid] += pts;
    roundResult[pid]  = { choice, win, pts };
  }

  io.to(roomId).emit('game:round_result', {
    direction,
    pctMove,
    future:  room.future,
    results: roundResult,
    scores:  room.scores,
    names:   room.names,
    round:   room.round,
    total:   TOTAL_ROUNDS,
  });

  if (room.round >= TOTAL_ROUNDS) {
    setTimeout(() => {
      io.to(roomId).emit('game:over', { scores: room.scores, names: room.names });
      delete rooms[roomId];
    }, 3000);
    return;
  }

  room.round++;
  room.choices = {};

  const available = ASSETS.filter(a => !room.usedAssets.includes(a.name));
  if (available.length < 3) {
    room.usedAssets = [room.asset.name];
  }
  const pool      = ASSETS.filter(a => !room.usedAssets.includes(a.name));
  const nextAsset = pool[Math.floor(Math.random() * pool.length)];
  room.usedAssets.push(nextAsset.name);

  fetchCandles(nextAsset).then(candles => {
    const win       = randomWindow(candles);
    room.visible    = win.visible;
    room.future     = win.future;
    room.asset      = nextAsset;
    room.allCandles = candles;

    setTimeout(() => {
      io.to(roomId).emit('game:next_round', {
        round:    room.round,
        total:    TOTAL_ROUNDS,
        asset:    nextAsset.name,
        interval: nextAsset.interval,
        visible:  room.visible,
        future:   room.future,
      });
    }, 3000);

  }).catch(async (err) => {
    console.log('Error next round:', err.message, '— trying fallback');

    const fallbackPool = ASSETS.filter(a =>
      a.name !== nextAsset.name && !room.usedAssets.includes(a.name)
    );

    if (fallbackPool.length > 0) {
      const fallback = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
      try {
        const candles = await fetchCandles(fallback);
        const win     = randomWindow(candles);
        room.visible    = win.visible;
        room.future     = win.future;
        room.asset      = fallback;
        room.allCandles = candles;
        room.usedAssets.push(fallback.name);

        setTimeout(() => {
          io.to(roomId).emit('game:next_round', {
            round:    room.round,
            total:    TOTAL_ROUNDS,
            asset:    fallback.name,
            interval: fallback.interval,
            visible:  room.visible,
            future:   room.future,
          });
        }, 3000);
        return;
      } catch (e) {
        console.log('Fallback failed:', e.message);
      }
    }

    const win = randomWindow(room.allCandles);
    room.visible = win.visible;
    room.future  = win.future;
    setTimeout(() => {
      io.to(roomId).emit('game:next_round', {
        round:    room.round,
        total:    TOTAL_ROUNDS,
        asset:    room.asset.name,
        interval: room.asset.interval,
        visible:  room.visible,
        future:   room.future,
      });
    }, 3000);
  });
}

const privateLobby = {};

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return privateLobby[code] ? generateCode() : code;
}

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('matchmaking:join', ({ name }) => {
    socket.playerName = name || 'Player';
    if (waiting && waiting.id !== socket.id) {
      const opponent = waiting;
      waiting = null;
      startRoom(opponent, socket);
    } else {
      waiting = socket;
      socket.emit('matchmaking:waiting');
    }
  });

  socket.on('game:forfeit', () => {
    if (socket.roomId && rooms[socket.roomId]) {
      const room     = rooms[socket.roomId];
      const winnerId = room.players.find(id => id !== socket.id);
      io.to(socket.roomId).emit('game:opponent_forfeited', {
        winner: room.names[winnerId],
      });
      delete rooms[socket.roomId];
    }
  });

  socket.on('game:choice', ({ choice }) => {
    const room = rooms[socket.roomId];
    if (!room) return;
    room.choices[socket.id] = choice;
    socket.to(socket.roomId).emit('game:opponent_chose');
    if (Object.keys(room.choices).length === 2) {
      resolveRound(socket.roomId);
    }
  });

  socket.on('chat:message', ({ msg }) => {
    if (socket.roomId && rooms[socket.roomId]) {
      socket.to(socket.roomId).emit('chat:message', { msg, from: socket.playerName });
    }
  });

  socket.on('room:create', ({ name }) => {
    socket.playerName = name || 'Player';
    const code = generateCode();
    privateLobby[code] = { host: socket, name };
    socket.roomCode = code;
    socket.emit('room:created', { code });
  });

  socket.on('room:join', ({ name, code }) => {
    socket.playerName = name || 'Player';
    const lobby = privateLobby[code.toUpperCase()];
    if (!lobby) {
      socket.emit('room:error', { message: 'Sala no encontrada' });
      return;
    }
    if (!lobby.host.connected) {
      socket.emit('room:error', { message: 'El host se desconectó' });
      delete privateLobby[code];
      return;
    }
    delete privateLobby[code];
    startRoom(lobby.host, socket);
  });

  socket.on('room:cancel', () => {
    if (socket.roomCode && privateLobby[socket.roomCode]) {
      delete privateLobby[socket.roomCode];
      socket.roomCode = null;
    }
  });
 socket.on('rematch:request', () => {
  const roomId = [...socket.rooms].find(r => r !== socket.id);
  if (!roomId) return;
  socket.to(roomId).emit('rematch:requested');
});

socket.on('rematch:accept', () => {
  const roomId = [...socket.rooms].find(r => r !== socket.id);
  if (!roomId) return;
  io.to(roomId).emit('rematch:countdown');

  setTimeout(async () => {
    const room = rooms[roomId];
    if (!room) return;

    // buscar nuevo asset
    const shuffled = [...ASSETS].sort(() => Math.random() - 0.5);
    for (const asset of shuffled) {
      try {
        const candles = await fetchCandles(asset);
        if (!candles || candles.length < 100) continue;

        const win       = randomWindow(candles);
        room.scores     = { [room.players[0]]: 0, [room.players[1]]: 0 };
        room.round      = 1;
        room.choices    = {};
        room.visible    = win.visible;
        room.future     = win.future;
        room.asset      = asset;
        room.allCandles = candles;
        room.usedAssets = [asset.name];

        const [id1, id2] = room.players;
        const name1 = room.names[id1];
        const name2 = room.names[id2];

        const payload = {
          roomId,
          round:    1,
          total:    TOTAL_ROUNDS,
          asset:    asset.name,
          interval: asset.interval,
          visible:  win.visible,
          future:   win.future,
        };

        io.to(id1).emit('game:start', { ...payload, opponent: name2 });
        io.to(id2).emit('game:start', { ...payload, opponent: name1 });
        totalGamesPlayed++;
        return;
      } catch (err) {
        console.log('Rematch error:', err.message);
      }
    }
  }, 10000);
});
  socket.on('disconnect', () => {
    if (socket.roomCode && privateLobby[socket.roomCode]) {
      delete privateLobby[socket.roomCode];
    }
    if (socket.roomId && rooms[socket.roomId]) {
      socket.to(socket.roomId).emit('game:opponent_disconnected');
      delete rooms[socket.roomId];
    }
    if (waiting?.id === socket.id) waiting = null;
    console.log('Disconnected:', socket.id);
  });
});
// v2.0
// Enviar notificación push cada día a las 8:00 AM UTC
cron.schedule('0 8 * * *', async () => {
  console.log('Sending daily push notifications...');
  const payload = JSON.stringify({
    title: '⚡ Daily Challenge',
    body:  "Today's chart is ready. Can you call it?",
    url:   'https://tradara.dev',
  });
  const promises = pushSubscriptions.map(sub =>
    webpush.sendNotification(sub, payload).catch(err => {
      if (err.statusCode === 410) {
        pushSubscriptions = pushSubscriptions.filter(s => s.endpoint !== sub.endpoint);
      }
    })
  );
  await Promise.all(promises);
  console.log(`Sent to ${pushSubscriptions.length} subscribers`);
});
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));