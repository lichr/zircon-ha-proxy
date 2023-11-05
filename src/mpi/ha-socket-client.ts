import EventEmitter from 'eventemitter3';
import _ from 'lodash';
import WebSocket from 'ws';
import { haDeviceToDevice, haEntityToMetric, haStateToState } from './convert';
import { makeSlug } from '../tools';
import { IMpiDevice, IMpiState } from './mpi-types';

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
  emitter: EventEmitter = new EventEmitter();

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
  }

  getConfig() {    
    this.send({
      type: 'get_config'
    })
  }

  async getStates(): Promise<Record<string, IMpiState>> {
    const stateList = (await this._command({ type: 'get_states' })).result;

    return _.mapValues(
      _.keyBy(
        stateList,
        'entity_id'
      ),
      (state) => haStateToState(state)
    );
  }

  async getDevices(): Promise<Record<string, IMpiDevice>> {
    const deviceList = (await this._command({ type: 'config/device_registry/list' })).result;
    const entityList = (await this._command({ type: 'config/entity_registry/list' })).result;
    const stateList = (await this._command({ type: 'get_states' })).result;

    // make devices
    const devices = _.keyBy(
        _.filter(
          _.map(
          deviceList,
          haDeviceToDevice
        ),
        // exclude Home Assistant devices
        (device) => device !== null
      ),
      'id'
    ) as Record<string, IMpiDevice>;

    // make metrics
    const metrics: Record<string, any> = {};
    _.forEach(entityList, (entity: any) => {
      const device = devices[entity.device_id];
      if (device) {
        const metric = haEntityToMetric(entity, device.name);
        if (metric) {
          device.metrics[metric.id] = metric;
          metrics[metric.uid] = metric;  
        }
      }
    });

    // make states
    _.forEach(stateList, (state: any) => {
      const entity_id = state.entity_id;
      const metric = metrics[entity_id];
      if (metric) {
        const s = haStateToState(state)
        metric.type = s.type;
        metric.state = s;
      }
    });

    // return
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
    } else if (message.type === 'result') {
      const id = message.id;
      const request = this.requests[id];
      if (request) {
        request.responseData = message;
        request.resolve(message);
        delete this.requests[id];
      }
    } else if (message.type === 'event') {
      const event = message.event;
      if (event.event_type === 'state_changed') {
        const entity_id = event.data.entity_id;
        const state = haStateToState(event.data.new_state);
        this.emitter.emit(
          'event',
          {
            type: 'state_changed',
            data: {
              states: { [entity_id] : state }
            }
          }
        );
      }
    }
  }
}
