import WebSocket from 'ws';
import { HaClient } from '../ha';
import { makeUid } from '../../tools';

export class MpiDownstreamConnection {
  id: string = makeUid();
  ws: WebSocket;
  onClose: (client: MpiDownstreamConnection) => void;
  ha: () => HaClient;
  lastActive: number = Date.now();

  constructor(
    ws: WebSocket,
    ha: () => HaClient,
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
    try {
      if (this.ws.readyState === WebSocket.OPEN) {
        console.log('>>> mpi send: ', data.type);
        this.ws.send(JSON.stringify(data));
      }
    } catch (error) {
      console.log(error);
    }
  }

  async onMessage(data: any) {
    const message = JSON.parse(data.toString());
    const type: string = message.type;
    this.lastActive = Date.now();
    console.log('>>> mpi receive: ', type);

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
