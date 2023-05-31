import express from 'express';
import http from 'http';
import _ from 'lodash';
import WebSocket from 'ws';
import { makeAgentPemStrings } from './make-agent';
import { pageConfig } from './page-config';
import { useOptions } from './use-options';
import { HaSocketClient, useHaSocket } from './ha-socket-client';
import { useZirconProxy } from './use-zircon-proxy';
import { useHaProxy } from './use-ha-proxy';
import { WebSocketService } from './use-web-socket';

const options = useOptions();
const { baseUrl, key, cert, haBaseUrl, haAccessToken } = options;

// create https agent that uses client certificate
const agent = key && cert ? makeAgentPemStrings(key, cert) : undefined;

// create express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const host = '0.0.0.0';
const port = 3100;

// serve page config
app.get('/config/page.json', pageConfig(options, agent));

// proxy to zircon services
useZirconProxy(app, baseUrl, agent);

// proxy to ha api
useHaProxy(app, haBaseUrl ?? '', agent);

// proxy to ha socket
const ha = new HaSocketClient(`ws://${haBaseUrl}/api/websocket`, haAccessToken ?? '');

new WebSocketService(wss, ha);
useHaSocket(options, wss);

// start the server
app.listen(
  port,
  host,
  () => {
    console.log(`Proxy server is running at http://${host}:${port}`);
  }
);
