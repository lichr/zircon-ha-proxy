import WebSocket from 'ws';
import { HaUpstreamConnection } from './ha-upstream-connection';
import { makeUid } from '../tools';

export class MpiDownstreamConnection {
  id: string = makeUid();
  ws: WebSocket;
  onClose: (client: MpiDownstreamConnection) => void;
  ha: () => HaUpstreamConnection;
  lastActive: number = Date.now();

  constructor(
    ws: WebSocket,
    ha: () => HaUpstreamConnection,
    onClose: (client: MpiDownstreamConnection) => void
  ) {
    this.onClose = onClose;
    this.ha = ha;
    this.ws = ws;
    this.ws.on('message', (data) => this.onMessage(data).then());
    this.ws.on('close', () => this.onClose(this));
    this.ws.on('error', (err) => {
      console.log('Client error: ', err);
    });
  }

  close() {
    this.ws.close();
  }

  send(data: any) {
    this.ws.send(JSON.stringify(data));
  }

  async onMessage(data: any) {
    const message = JSON.parse(data.toString());
    const type: string = message.type;
    this.lastActive = Date.now();

    if (type === 'get_devices') {
      this.handleGetDevices();
    } else if (type === 'get_states') {
      this.handleStates();
    } else if (type === 'ping') {
      this.send({ type: 'pong' });
    }
  }


  async handleGetDevices() {
    const devices = await this.ha().getDevices();
    this.send({ type: 'devices', devices });
  }

  async handleStates() {
    const states = await this.ha().getStates();
    this.send({ type: 'states', states });
  }
}
