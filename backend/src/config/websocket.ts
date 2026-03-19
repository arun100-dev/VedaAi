import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { WSMessage } from '../types';

interface Client {
  ws: WebSocket;
  assignmentId?: string;
  jobId?: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Client> = new Map();

  initialize(server: any) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientId = Math.random().toString(36).slice(2);
      this.clients.set(clientId, { ws });

      console.log(`✅ WS Client connected: ${clientId}`);

      // Send welcome
      ws.send(
        JSON.stringify({
          type: 'CONNECTED',
          payload: { message: 'Connected to VedaAI WebSocket', clientId },
        } as WSMessage)
      );

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'SUBSCRIBE' && msg.assignmentId) {
            const client = this.clients.get(clientId);
            if (client) {
              client.assignmentId = msg.assignmentId;
              client.jobId = msg.jobId;
              this.clients.set(clientId, client);
            }
          }
        } catch (e) {}
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`❌ WS Client disconnected: ${clientId}`);
      });

      ws.on('error', (err) => {
        console.error('WS error:', err);
        this.clients.delete(clientId);
      });
    });

    return this.wss;
  }

  broadcast(assignmentId: string, message: WSMessage) {
    this.clients.forEach((client) => {
      if (
        client.ws.readyState === WebSocket.OPEN &&
        client.assignmentId === assignmentId
      ) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  broadcastToAll(message: WSMessage) {
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }
}

export const wsManager = new WebSocketManager();
