import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { AuthUser } from './utils/jwt.js';
import { verifyAccessToken } from './utils/jwt.js';
import app from './app.js';

interface ClientToServerEvents {
  'ping-server': () => void;
}

interface ServerToClientEvents {
  'pong-server': (payload: { message: string; timestamp: string }) => void;
}

interface InterServerEvents {}

interface SocketData {
  user: AuthUser;
}

const httpServer = createServer(app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: ['http://localhost:8081'], // thay bằng origin web của bạn nếu có
  },
});

io.use((socket, next) => {
  const token: unknown = socket.handshake.auth?.token;

  if (typeof token !== 'string') {
    return next(new Error('AUTH_REQUIRED'));
  }

  try {
    socket.data.user = verifyAccessToken(token);
    next();
  } catch (error) {
    const code = error instanceof Error && error.name === 'TokenExpiredError'
      ? 'AUTH_TOKEN_EXPIRED'
      : 'AUTH_INVALID';
    next(new Error(code));
  }
});

io.on('connection', (socket) => {
  const { user } = socket.data;
  socket.join(`user:${user.id}`);
  console.log(`User ${user.id} connected with socket ${socket.id}`);

  socket.on('ping-server', () => {
    socket.emit('pong-server', {
      message: 'Socket hoạt động',
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`User ${user.id} disconnected: ${reason}`);
  });
});

const PORT = Number(process.env.PORT) || 4000;

httpServer.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});