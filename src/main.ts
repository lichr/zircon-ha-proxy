import express from 'express';
import http from 'http';
import _ from 'lodash';
import WebSocket from 'ws';
import { HaSocketClient } from './mpi';
import { makeAgentPemStrings, useOptions } from './tools';
import { WebSocketService } from './ws';
import { pageConfig, useZirconProxy } from './zircon';

const options = useOptions();
const { baseUrl, key, cert, haBaseUrl, haAccessToken } = options;

// create https agent that uses client certificate
const agent = key && cert ? makeAgentPemStrings(key, cert) : undefined;

// create express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/mpi' });
const host = '0.0.0.0';
const port = 3100;

// serve page config
app.get('/config/page.json', pageConfig(options, agent));


// proxy to ha socket
const ha = new HaSocketClient(`ws://${haBaseUrl}/api/websocket`, haAccessToken ?? '');

new WebSocketService(wss, ha);

// access ha internal
app.get('/ha/_/devices', async (req, res) => {
  try {
    const response = await ha.getRawDevices();
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred.');
  }
});

// access mpi (monitoring platform interface)
app.get('/mpi/devices', async (req, res) => {
  try {
    const response = await ha.getDevices();
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred.');
  }
});

// proxy to zircon services
useZirconProxy(app, baseUrl, agent);

// start the server
app.listen(
  port,
  host,
  () => {
    console.log(`Proxy server is running at http://${host}:${port}`);
  }
);
