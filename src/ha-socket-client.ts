import _ from 'lodash';
import WebSocket from 'ws';
import { IOptions } from './types';

export class HaSocketClient {
  messageId = 0;
  url: string;
  accessToken: string;
  socket: WebSocket;
  connected = false;
  status: 'disconnected' | 'connecting' | 'authoring' | 'authorized' = 'disconnected';

  constructor(url: string, accessToken: string) {
    this.accessToken = accessToken;
    this.url = url;

    this.status = 'connecting';
    this.socket = new WebSocket(url);
    this.socket.on('open', () => this.onOpen());
    this.socket.on('message', (data) => this.onMessage(data));
  
  }

  onOpen() {
    this.status = 'authoring';
    console.log('>>> send: auth');
  }

  onConnected() {
    this.messageId = 0;
    // subscript events
    this.subscribeEvents('state_changed');

    // other events:
    // area_registry_updated
    // entity_registry_updated
    // device_registry_updated

    // this.getStates();
    this.getEntities();
  }

  getConfig() {    
    this.send({
      type: 'get_config'
    })
  }

  getDevices() {
    this.send({
      type: 'config/device_registry/list'
    })    
  }

  getEntities() {
    this.send({
      type: 'config/entity_registry/list'
    })    
  }


  getStates() {
    this.send({
      type: 'get_states'
    })
  }

  subscribeEvents(eventType: string) {
    this.send({
      type: 'subscribe_events',
      event_type: eventType
    })
  }

  send(request: any) {
    this.messageId += 1;
    const req = { id: this.messageId, ...request };
    this.socket.send(JSON.stringify(req));
  }

  sendAuth() {
    this.socket.send(JSON.stringify({
      type: 'auth',
      access_token: this.accessToken
    }));
  }
  onMessage(data: WebSocket.RawData) {
    const message = JSON.parse(data.toString());
    console.log('<<< receive: ', JSON.stringify(message, null, 2));

    if (message.type === 'auth_required') {
      this.sendAuth();
    } else if (message.type === 'auth_ok') {
      this.onConnected();
    }
    // wss.clients.forEach(client => {
    //   if (client.readyState === WebSocket.OPEN) {
    //     client.send(data);
    //   }
    // });    
  }

  check() {
  }

}

export function useHaSocket(options: IOptions, wss: WebSocket.Server) {
  const messageId = 1;
  const { haBaseUrl, haAccessToken } = options;
  if (_.isEmpty(haBaseUrl) || _.isEmpty(haAccessToken)) {
    throw new Error('Please specify haBaseUrl and haAccessToken in options file.');
  }
  // proxy to home assistant websocket
  const ha = new HaSocketClient(`ws://${haBaseUrl}/api/websocket`, haAccessToken ?? '');

  // haSocket.on('message', (data) => {
  //   console.log('<<< receive: ', data.toString());
  //   wss.clients.forEach(client => {
  //     if (client.readyState === WebSocket.OPEN) {
  //       client.send(data);
  //     }
  //   });
  // });

  // handle client websocket
  wss.on('connection', ws => {
    console.log('Client connected');

    // On receiving message from a client, send it to Home Assistant
    ws.on('message', message => {
      // convert the data schema here before sending
      let convertedMessage = message;
      // ha.send(convertedMessage);
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
}
