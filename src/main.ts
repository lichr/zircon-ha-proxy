import express from 'express';
import cors from 'cors';
import http from 'http';
import _ from 'lodash';
import WebSocket from 'ws';
import { makeAgentPemStrings, useOptions } from './tools';
import { HaClient } from './ha';
import { HaProxyServer } from './ha-proxy-server';
import { pageConfig, useZirconProxy } from './zircon-proxy';

const options = useOptions();
const { ha: { webSocketUrl, accessToken }, zircon: { baseUrl, client } } = options;
// create https agent that uses client certificate
// this is generally NOT needed
// it is only used for testing with our protected environment, such as dev
let agent = undefined;
if (client) {
  agent = makeAgentPemStrings(client.key, client.cert);
}

// create express app
const app = express();
const server = http.createServer(app);
const host = '0.0.0.0';
const port = 11200;

// serve page config
app.get('/config/page.json', pageConfig(options, agent));

// proxy to ha socket
const ha = new HaClient(webSocketUrl, accessToken);

// ws server for mpi events
const wss = new WebSocket.Server({ server, path: '/mpi/ws' });
new HaProxyServer(wss, ha);

// access ha internal, only for development purposes
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
app.get('/mpi/devices', async (_req, res) => {
  try {
    const response = await ha.getDevices();
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred.');
  }
});

// proxy to zircon services: designer-page, api, xpi and others
useZirconProxy(app, baseUrl, agent);

app.use(cors());

// start the server
server.listen(
  port,
  host,
  () => {
    console.log(`Proxy server is running at http://${host}:${port}`);
  }
);
