import WebSocket from 'ws';
import { HaSocketClient } from "./ha-socket-client";

export class WebSocketService {
  ha: HaSocketClient;
  wss: WebSocket.Server;

  constructor(wss: WebSocket.Server, ha: HaSocketClient) {
    this.ha = ha;
    this.wss = wss;
    this.wss.on('connection', () => this.onConnection);
    this.wss.on('message', (data) => this.onMessage(data));
    this.wss.on('close', () => this.onClose());
  }

  onConnection() {
    console.log('Client connected');
  }

  onMessage(data: WebSocket.RawData) {
    
  }

  onClose() {

  }
}
