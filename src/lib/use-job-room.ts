import { useEffect } from 'react';
import { SOCKET_EVENTS, type JoinJobRoomEvent, type LeaveJobRoomEvent } from '@contracts';
import { getSocket } from './socket-client';

/**
 * Subscribe the current socket to a single job's room while the calling
 * component is mounted. Joining a job room is required to receive
 * per-job events that the backend broadcasts only to that room (e.g.
 * granular review-progress events, typing indicators, etc.). The global
 * SocketProvider already receives tenant-wide events without a room.
 *
 * Pass `null` / `undefined` to no-op (e.g. before the job id is known).
 *
 * Idempotent: rejoining the same room is safe; the server tracks
 * membership and rebroadcasts on reconnect via the `connect` event.
 */
export function useJobRoom(jobId: string | null | undefined): void {
  useEffect(() => {
    if (!jobId) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;

    const join = () => {
      const payload: JoinJobRoomEvent = { jobId };
      socket.emit(SOCKET_EVENTS.JOIN_JOB_ROOM, payload);
    };

    // Join now if connected; rejoin after every reconnect.
    if (socket.connected) join();
    socket.on('connect', join);

    return () => {
      socket.off('connect', join);
      if (socket.connected) {
        const payload: LeaveJobRoomEvent = { jobId };
        socket.emit(SOCKET_EVENTS.LEAVE_JOB_ROOM, payload);
      }
    };
  }, [jobId]);
}
