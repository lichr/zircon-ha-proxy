import EventEmitter from 'eventemitter3';
import _ from 'lodash';
import WebSocket from 'ws';
import { HaRequest } from './ha-request';

export class HaUpstreamConnection {
  messageId = 0;
  url: string;
  accessToken: string;
  socket: WebSocket | null = null;
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
    this.status = 'connecting';
    try {
      this.socket = new WebSocket(this.url);
      this.socket.on('open', this.onOpen);
      this.socket.on('message', this.onMessage);
      this.socket.on('close', this.onClose);
      this.socket.on('error', this.onError);
    } catch (error) {
      this._close();
    }
  }

  private _close() {
    this.status = 'disconnected';
    this.socket?.close();
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
        this.send({ type: 'ping' }) // Send a ping
      }
    } else if (this.status === 'disconnected') {
      // retry to connect for every 10 seconds
      this._open();
    }
  }

  onOpen = () => {
    this.status = 'authoring';
    console.log('>>> send: auth');
  }

  onConnected() {
    this.messageId = 0;
    this.emitter.emit('connect');
  }

  getConfig() {
    this.send({
      type: 'get_config'
    })
  }

  async command(data: any): Promise<any> {
    const messageId = this.send(data);
    const request = new HaRequest(
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
    this.socket?.send(JSON.stringify(req));
    return this.messageId;
  }

  sendAuth() {
    this.socket?.send(JSON.stringify({
      type: 'auth',
      access_token: this.accessToken
    }));
  }

  // XXX: messages may come in a batch
  onMessage = (data: WebSocket.RawData) => {
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
      this.emitter.emit('event', event);
    }
  }

  onClose = () => {
    this.status = 'disconnected';
  }

  onError = () => {
    this.status = 'disconnected';
  }
}
