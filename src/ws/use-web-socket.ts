import WebSocket from 'ws';
import { HaSocketClient } from "../mpi/ha-socket-client";
import _ from 'lodash';

export class WebSocketService {
  ha: HaSocketClient;
  wss: WebSocket.Server;

  constructor(wss: WebSocket.Server, ha: HaSocketClient) {
    this.ha = ha;
    this.ha.emitter.on('event', (event) => this.onEvent(event));
    this.wss = wss;
    this.wss.on('connection', (ws) => this.onConnection(ws));
  }

  onEvent(event: any) {
    const message = JSON.stringify({
      type: 'event',
      event
    });

    // send event to all connected clients
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  onConnection(ws: WebSocket) {
    console.log('Client connected');
    ws.on('message', (data) => this.onMessage(ws, JSON.parse(data.toString())).then());
    ws.on('close', () => this.onClose(ws));
    ws.on('error', (err) => {
      console.log('Client error: ', err);
    });
  }

  async onMessage(ws: WebSocket, message: any) {
    console.log('Client message: ', message);    
    const type: string = message.type;
    if (type === 'get_devices') {
      const devices = await this.ha.getDevices();
      const data = JSON.stringify({ type: 'devices', devices });
      ws.send(data);
    } else if (type === 'get_states') {
      const states = await this.ha.getStates();
      const data = JSON.stringify({ type: 'states', states });
      ws.send(data);
    }
  }

  onClose(ws: WebSocket) {
    console.log('Client closed');
  }
}
