'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useAssignmentStore } from '../store/assignmentStore';
import { WSMessage, JobStatus } from '../types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws';

export function useWebSocket(assignmentId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const { setWsConnected, setJobStatus, updateJobStatus, setCurrentAssignment } = useAssignmentStore();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        if (assignmentId) {
          ws.send(JSON.stringify({ type: 'SUBSCRIBE', assignmentId }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);

          if (msg.type === 'JOB_PROGRESS') {
            const payload = msg.payload as JobStatus;
            setJobStatus(payload);
          } else if (msg.type === 'JOB_COMPLETED') {
            const payload = msg.payload as JobStatus;
            setJobStatus({ ...payload, status: 'completed', progress: 100 });
          } else if (msg.type === 'JOB_FAILED') {
            const payload = msg.payload as JobStatus;
            setJobStatus({ ...payload, status: 'failed' });
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      if (mountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    }
  }, [assignmentId]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const subscribe = useCallback((id: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'SUBSCRIBE', assignmentId: id }));
    }
  }, []);

  return { subscribe };
}
