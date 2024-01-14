import WebSocket from 'ws';
import { HaUpstreamConnection } from './ha-upstream-connection';

export class MpiDownstreamConnection {
  ws: WebSocket;
  onClose: () => void;
  ha: () => HaUpstreamConnection;
  lastActive: number = Date.now();

  constructor(
    ws: WebSocket,
    ha: () => HaUpstreamConnection,
    onClose: () => void
  ) {
    this.onClose = onClose;
    this.ha = ha;
    this.ws = ws;
    this.ws.on('message', (data) => this.onMessage(data).then());
    this.ws.on('close', () => this.onClose());
    this.ws.on('error', (err) => {
      console.log('Client error: ', err);
    });
  }

  send(data: any) {
    this.ws.send(JSON.stringify(data));
  }

  async onMessage(data: any) {
    const message = JSON.parse(data.toString());
    const type: string = message.type;

    if (type === 'get_devices') {
      this.handleGetDevices();
    } else if (type === 'get_states') {
      this.handleStates();
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
