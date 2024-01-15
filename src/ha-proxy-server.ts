import _ from 'lodash';
import WebSocket from 'ws';
import { HaClient } from "./ha";
import { MpiDownstreamConnection } from './mpi/mpi-downstream-connection';

export class HaProxyServer {
  ha: HaClient;
  wss: WebSocket.Server;
  timer: NodeJS.Timeout | undefined;
  clients: Record<string, MpiDownstreamConnection> = {};

  constructor(wss: WebSocket.Server, ha: HaClient) {
    this.ha = ha;
    this.ha.emitter.on('event', (event) => this.onEvent(event));
    this.wss = wss;
    this.wss.on('connection', (ws) => this.onConnection(ws));
    this.timer = setInterval(() => this.onTimer(), 60000);
  }

  onTimer() {
    // scan for inactive connections
    const now = Date.now();
    _.each(
      this.clients,
      (client) => {
        if (now - client.lastActive > 60000) {
          // discard inactive connection
          client.close();
          delete this.clients[client.id];
        }
      }
    );
  }

  onEvent(event: any) {
    const message = {
      type: 'event',
      event
    };

    // send event to all connected clients
    _.each(
      this.clients,
      (client) => {
        client.send(message);
      }
    );
  }

  onConnection(ws: WebSocket) {
    console.log('Client connected');
    const client = new MpiDownstreamConnection(ws, () => this.ha, this.onClose);
    this.clients[client.id] = client;
  }

  onClose = (client: MpiDownstreamConnection) => {
    console.log('Client closed');
    delete this.clients[client.id];
  }
}
