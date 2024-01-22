import EventEmitter from 'eventemitter3';
import _ from 'lodash';
import WebSocket from 'ws';
import { HaRequest } from './ha-request';

export class HaUpstreamConnection {
  messageId = 0;
  url: string;
  accessToken: string;
  ws: WebSocket | null = null;
  connected = false;
  status: 'disconnected' | 'connecting' | 'authoring' | 'authorized' = 'disconnected';
  // timer for ping / pong
  timer: NodeJS.Timeout | null = null;
  pongReceived = false;
  requests: Record<number, HaRequest> = {};
  emitter: EventEmitter = new EventEmitter();

  constructor(url: string, accessToken: string) {
    this.accessToken = accessToken;
    this.url = url;
    this._open();
    this._startTimer();
  }

  private _open() {
    console.log('>>> connecting to ha: ', this.url);
    this.status = 'connecting';
    try {
      this.ws = new WebSocket(this.url);
      this.ws.on('open', this.onOpen);
      this.ws.on('message', this.onMessage);
      this.ws.on('close', this.onClose);
      this.ws.on('error', this.onError);
    } catch (error) {
      console.log('>>> error connecting to ha: ', error);
      this._close();
    }
  }

  private _close() {
    this.status = 'disconnected';
    this.ws?.close();
  }

  private _startTimer() {
    this._stopTimer();
    this.timer = setInterval(
      this._onTimer,
      10000
    );
  }

  private _stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private _onTimer = () => {
    if (this.status === 'authorized') {
      // check ping / pong for every 10 seconds
      if (!this.pongReceived) {
        console.log('Pong not received, closing connection...');
        this._close();
      } else {
        this.pongReceived = false; // Reset the pongReceived flag
        this.sendMessage({ type: 'ping' }) // Send a ping
      }
    } else if (this.status === 'disconnected') {
      // retry to connect for every 10 seconds
      this._open();
    }
  }

  onOpen = () => {
    this.status = 'authoring';
  }

  onConnected() {
    this.messageId = 0;
    this.emitter.emit('connect');
  }

  getConfig() {
    this.sendMessage({
      type: 'get_config'
    })
  }

  async command(data: any): Promise<any> {
    const messageId = this.sendMessage(data);
    const request = new HaRequest(
      this.messageId,
      data
    );
    this.requests[messageId] = request;
    return request.promise;
  }

  subscribeEvents(eventType: string) {
    return this.sendMessage({
      type: 'subscribe_events',
      event_type: eventType
    })
  }

  send(data: any) {
      try {
          if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('>>> ha send: ', data.type);
            this.ws?.send(JSON.stringify(data));
          }
      } catch (error) {
          console.log(error);
      }
  }

  sendMessage(request: any) {
    this.messageId += 1;
    this.send({ id: this.messageId, ...request });
    return this.messageId;
  }

  sendAuth() {
    this.send({
      type: 'auth',
      access_token: this.accessToken
    });
  }

  // XXX: messages may come in a batch
  onMessage = (data: WebSocket.RawData) => {
    const message = JSON.parse(data.toString());

    if (message.type === 'auth_required') {
      console.log('<<< ha receive: ', message.type, message);
      this.sendAuth();
    } else if (message.type === 'auth_ok') {
      console.log('<<< ha receive: ', message.type, message);
      this.onConnected();
    } else if (message.type === 'result') {
      const id = message.id;
      const request = this.requests[id];
      console.log('<<< ha receive: ', message.type, id);
      if (request) {
        request.responseData = message;
        request.resolve(message);
        delete this.requests[id];
      }
    } else if (message.type === 'event') {
      const event = message.event;
      console.log('<<< ha event: ', event.event_type);
      this.emitter.emit('event', event);
    } else {
      console.log('<<< ha receive-unknown: ', message.type, message);
    }
  }

  onClose = () => {
    console.log('>>> ha connection closed');
    this.status = 'disconnected';
  }

  onError = (error: any) => {
    console.log('>>> ha connection error', error);
    this.status = 'disconnected';
  }
}
