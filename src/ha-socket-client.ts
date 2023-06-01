import _ from 'lodash';
import WebSocket from 'ws';
import { IOptions } from './types';


function makeSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').trim();
}

class WsRequest {
  id: number;
  requestData: any;
  responseData: any;
  promise: Promise<any>;
  resolve: (value: any) => void = () => {};
  reject: (reason?: any) => void = () => {};

  constructor(id: number, requestData: any) {
    this.id = id;
    this.requestData = requestData;
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

export class HaSocketClient {
  messageId = 0;
  url: string;
  accessToken: string;
  socket: WebSocket;
  connected = false;
  status: 'disconnected' | 'connecting' | 'authoring' | 'authorized' = 'disconnected';
  requests: Record<number, WsRequest> = {};

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
    // this.getEntities();
  }

  getConfig() {    
    this.send({
      type: 'get_config'
    })
  }

  async getDevices(): Promise<any> {
    const deviceList = (await this._command({ type: 'config/device_registry/list' })).result;
    const entityList = (await this._command({ type: 'config/entity_registry/list' })).result;
    const stateList = (await this._command({ type: 'get_states' })).result;

    const devices = _.keyBy(
        _.filter(
          _.map(
          deviceList,
          (device: any) => {
            return {
              id: device.id,
              name: device.name,
              model: device.model,
              manufacturer: device.manufacturer,
              metrics: {} as Record<string, any>
            }
          }
        ),
        (device: any) => device.manufacturer !== 'Home Assistant' && device.model !== 'Home Assistant Add-on'
      ),
      'id'
    );

    const metrics: Record<string, any> = {};
    _.forEach(entityList, (entity: any) => {
      const device = devices[entity.device_id];
      if (device) {
        let name = entity.name ?? entity.original_name ?? '';
        name = name === device.name ? name : name.replace(device.name, '').trim();
        name = name.replace(/\sSensor$/, '');
        const id = makeSlug(name);
        const metric = {
          id,
          uid: entity.entity_id,
          name,
          state: {}
        }
        device.metrics[id] = metric;
        metrics[metric.uid] = metric;
      }
    });

    _.forEach(stateList, (state: any) => {
      const entity_id = state.entity_id;
      const metric = metrics[entity_id];
      if (metric) {
        metric.state = {
          type: state.attributes.state_class === 'measurement' ? 'number' : 'string',
          class: state.attributes.device_class,
          value: state.state,
          last_changed: state.last_changed,
          unit: state.attributes.unit_of_measurement
        }
      }
    });

    return devices;
  };

  async getRawDevices(): Promise<any> {
    const deviceList = (await this._command({ type: 'config/device_registry/list' })).result;
    const entityList = (await this._command({ type: 'config/entity_registry/list' })).result;
    const stateList = (await this._command({ type: 'get_states' })).result;

    const devices = _.keyBy(
          _.map(
          deviceList,
          (device: any) => {
            return {
              device,
              entities: {} as Record<string, any>
            }
          }
        ),
      'device.id'
    );

    const entities: Record<string, any> = {};
    _.forEach(entityList, (entity: any) => {
      const device = devices[entity.device_id];
      if (device) {
        const id = makeSlug(entity.name ?? entity.original_name ?? '');
        const en = {
          entity,
          state: {}
        }
        device.entities[id] = en;
        entities[entity.entity_id] = en;
      }
    });

    _.forEach(stateList, (state: any) => {
      const entity_id = state.entity_id;
      const entity = entities[entity_id];
      if (entity) {
        entity.state = state
      }
    });

    return devices;
  };


  private async _command(data: any): Promise<any> {
    const messageId = this.send(data);
    const request = new WsRequest(
      this.messageId,
      data
    );
    this.requests[messageId] = request;
    return request.promise;
  }

  subscribeEvents(eventType: string) {
    return this.send({
      type: 'subscribe_events',
      event_type: eventType
    })
  }

  send(request: any) {
    this.messageId += 1;
    const req = { id: this.messageId, ...request };
    this.socket.send(JSON.stringify(req));
    return this.messageId;
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

    const id = message.id;
    const request = this.requests[id];
    if (request) {
      request.responseData = message;
      request.resolve(message);
      delete this.requests[id];
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
