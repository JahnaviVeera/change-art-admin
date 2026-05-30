import { io, type Socket } from 'socket.io-client';
import { config } from './config';

/**
 * Singleton Socket.IO client. The session cookie travels with the handshake
 * via `withCredentials: true` — no JWT-in-query, no token passed from JS.
 *
 * The socket is created lazily so it doesn't fire on the public login page
 * where there is no session yet. Call `connectSocket()` once the auth
 * provider confirms a session, and `disconnectSocket()` on sign-out.
 */

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket && socket.connected) return socket;

  socket = io(config.wsUrl, {
    withCredentials: true,
    // Try WebSocket first; fall back to long-polling when a proxy/firewall
    // blocks the WS upgrade. Without 'polling' the socket silently never
    // connects in those environments.
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 8_000,
  });

  if (import.meta.env.DEV) {
    socket.on('connect',        () => console.info('[socket] connected', socket?.id));
    socket.on('disconnect',     (reason) => console.info('[socket] disconnected', reason));
    socket.on('connect_error',  (err) => console.warn('[socket] connect_error', err.message));
    socket.on('reconnect',      (n) => console.info('[socket] reconnect', n));
    socket.on('reconnect_failed', () => console.warn('[socket] reconnect_failed'));
  }

  return socket;
}

/**
 * Force a reconnect if the socket has dropped. Safe to call on tab focus or
 * route change — no-ops when already connected.
 */
export function ensureSocketConnected(): void {
  if (socket && !socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
