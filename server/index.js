const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const YahooFinance = require('yahoo-finance2').default;
const cors         = require('cors');

const yf         = new YahooFinance();
const app        = express();
const httpServer = http.createServer(app);
const io         = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());

app.get('/candles', async (req, res) => {
  const { symbol, interval } = req.query;
  try {
    const from = new Date();
    if (interval === '1h') {
      from.setDate(from.getDate() - 29);
    } else {
      from.setFullYear(from.getFullYear() - 2);
    }
    const period1 = from.toISOString().split('T')[0];
    const result  = await yf.chart(symbol, {
      interval: interval === '1h' ? '1h' : '1d',
      period1,
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

const ASSETS = [
  { name: 'BTC/USD', binance: 'BTCUSDT', yahoo: null,        interval: '1d' },
  { name: 'ETH/USD', binance: 'ETHUSDT', yahoo: null,        interval: '1d' },
  { name: 'SOL/USD', binance: 'SOLUSDT', yahoo: null,        interval: '1d' },
  { name: 'GOLD',    binance: null,       yahoo: 'GC=F',     interval: '1d' },
  { name: 'S&P 500', binance: null,       yahoo: '^GSPC',    interval: '1d' },
  { name: 'NASDAQ',  binance: null, yahoo: '^IXIC',       interval: '1d' },
];

const TOTAL_ROUNDS = 10;
const rooms        = {};
let   waiting      = null;

async function fetchCandles(asset) {
  if (asset.binance) {
    console.log('Fetching Binance:', asset.binance);
    const url  = `https://api.binance.com/api/v3/klines?symbol=${asset.binance}&interval=${asset.interval}&limit=500`;
    const res  = await fetch(url);
    const data = await res.json();
    console.log('Binance candles:', data.length);
    return data.map(k => ({
      time:  Math.floor(k[0] / 1000),
      open:  parseFloat(k[1]),
      high:  parseFloat(k[2]),
      low:   parseFloat(k[3]),
      close: parseFloat(k[4]),
    }));
  } else {
    console.log('Fetching Yahoo:', asset.yahoo);
    const from = new Date();
    from.setFullYear(from.getFullYear() - 2);
    const result = await yf.chart(asset.yahoo, {
      interval: '1d',
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
    console.log('Yahoo candles:', candles.length);
    return candles;
  }
}

function randomWindow(candles) {
  const maxStart = Math.max(0, candles.length - 90);
  const start    = Math.floor(Math.random() * maxStart);
  return {
    visible: candles.slice(start, start + 70),
    future:  candles.slice(start + 70, start + 90),
  };
}

async function startRoom(socket1, socket2) {
  const shuffled = [...ASSETS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  for (const asset of shuffled) {
    try {
      console.log('Intentando activo:', asset.name);
      const candles = await fetchCandles(asset);

      if (!candles || candles.length < 44) {
        console.log('Pocos datos para', asset.name);
        continue;
      }

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
      };

      socket1.join(roomId);
      socket2.join(roomId);
      socket1.roomId = roomId;
      socket2.roomId = roomId;

      const payload = {
        roomId,
        round:   1,
        total:   TOTAL_ROUNDS,
        asset:   asset.name,
        visible: win.visible,
        future:  win.future,
      };

      socket1.emit('game:start', { ...payload, opponent: socket2.playerName });
      socket2.emit('game:start', { ...payload, opponent: socket1.playerName });

      console.log(`Room ${roomId}: ${socket1.playerName} vs ${socket2.playerName} — ${asset.name}`);
      return;

    } catch (err) {
      console.log('Error con', asset.name, ':', err.message);
    }
  }

  console.error('Todos los activos fallaron');
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
    const pts = win && choice !== 'skip' ? 100 : 0;
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
  } else {
    room.round++;
    room.choices = {};

    const nextAsset = ASSETS[Math.floor(Math.random() * ASSETS.length)];

    fetchCandles(nextAsset).then(candles => {
      const win       = randomWindow(candles);
      room.visible    = win.visible;
      room.future     = win.future;
      room.asset      = nextAsset;
      room.allCandles = candles;

      setTimeout(() => {
        io.to(roomId).emit('game:next_round', {
          round:   room.round,
          total:   TOTAL_ROUNDS,
          asset:   nextAsset.name,
          visible: room.visible,
          future:  room.future,
        });
      }, 3000);
    }).catch(() => {
      const win    = randomWindow(room.allCandles);
      room.visible = win.visible;
      room.future  = win.future;

      setTimeout(() => {
        io.to(roomId).emit('game:next_round', {
          round:   room.round,
          total:   TOTAL_ROUNDS,
          asset:   room.asset.name,
          visible: room.visible,
          future:  room.future,
        });
      }, 3000);
    });
  }
}
// ── Sala privada ──────────────────────────────────────────────────
const privateLobby = {}; // { code: { host: socket, name: string } }

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return privateLobby[code] ? generateCode() : code;
}
io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('matchmaking:join', ({ name }) => {
    console.log('matchmaking:join from', socket.id, 'name:', name);
    socket.playerName = name || 'Player';

    if (waiting && waiting.id !== socket.id) {
      console.log('Pairing', waiting.id, 'with', socket.id);
      const opponent = waiting;
      waiting = null;
      startRoom(opponent, socket);
    } else {
      console.log('Waiting for opponent...');
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

  socket.on('disconnect', () => {
    // limpiar sala privada si era el host
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
  // crear sala privada
socket.on('room:create', ({ name }) => {
  socket.playerName = name || 'Player';
  const code = generateCode();
  privateLobby[code] = { host: socket, name };
  socket.roomCode = code;
  socket.emit('room:created', { code });
  console.log(`Room created: ${code} by ${name}`);
});

// unirse a sala privada
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

// cancelar sala privada
socket.on('room:cancel', () => {
  if (socket.roomCode && privateLobby[socket.roomCode]) {
    delete privateLobby[socket.roomCode];
    socket.roomCode = null;
  }
});
});

httpServer.listen(3001, () => console.log('Server running on http://localhost:3001'));