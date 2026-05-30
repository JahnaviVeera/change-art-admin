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

/**
 * Sanity-check wsUrl at startup. The classic failure mode is a misconfigured
 * env that yields a URL like `https://https/...` (double-prefixed protocol)
 * or just `https`, which makes socket.io try to open `ws://https/socket.io/`
 * and retry forever. Throw early so the bug is visible in the console
 * instead of a silent reconnect loop.
 */
function validateWsUrl(raw: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(
      `[socket] VITE_WS_URL is not a valid URL: ${JSON.stringify(raw)}. ` +
        `Expected something like "https://your-backend.up.railway.app".`,
    );
  }
  // host === 'https' / 'http' is the telltale sign of `https://https/...`
  // or `http://http/...` — a doubled protocol prefix.
  if (parsed.host === 'https' || parsed.host === 'http') {
    throw new Error(
      `[socket] VITE_WS_URL looks doubled-up: ${raw}. ` +
        `Remove the extra "https://" — the value should be ONE valid URL.`,
    );
  }
  if (!parsed.protocol.startsWith('http')) {
    throw new Error(
      `[socket] VITE_WS_URL must use http(s):// (got ${parsed.protocol}).`,
    );
  }
  return raw;
}

export function connectSocket(): Socket {
  // Return the existing instance whenever one exists — even if it's still
  // mid-handshake or retrying. Re-creating on every call (the old behaviour)
  // leaked socket instances; each one kept its own reconnection loop running
  // in the background, which is why the Network panel filled with WS retries.
  if (socket) return socket;

  const wsUrl = validateWsUrl(config.wsUrl);

  socket = io(wsUrl, {
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
    socket.on('connect',          () => console.info('[socket] connected', socket?.id));
    socket.on('disconnect',       (reason) => console.info('[socket] disconnected', reason));
    socket.on('connect_error',    (err) => console.warn('[socket] connect_error', err.message));
    socket.on('reconnect',        (n) => console.info('[socket] reconnect', n));
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
