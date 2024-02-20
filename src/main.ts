import express from 'express';
import cors from 'cors';
import http from 'http';
import _ from 'lodash';
import WebSocket from 'ws';
import { makeAgentPemStrings, useOptions } from './tools';
import { HaClient } from './ha';
import { HaProxyServer } from './ha-proxy-server';
import { Bundler } from './bundler';
import { useOffline, useOnline } from './routes';

async function main() {
  const options = useOptions();
  const { ha: { webSocketUrl, accessToken }, zircon: { baseUrl, clientCert } } = options;

  // offline bundle
  const bundler = new Bundler({
    db: { path: 'data/zircon.db' },
    client: {
      zirconAccessToken: options.zircon.zirconAccessToken,
      baseUrl: options.zircon.baseUrl,
      group: options.zircon.group,
      project: options.zircon.project,
      clientCert: options.zircon.clientCert
    }
  });
  await bundler.init();

  // create https agent that uses client certificate
  // this is generally NOT needed
  // it is only used for testing with our protected environment, such as dev
  let agent = undefined;
  if (clientCert) {
    agent = makeAgentPemStrings(clientCert.key, clientCert.cert);
  }

  // create express app
  const app = express();
  const server = http.createServer(app);
  const host = '0.0.0.0';
  const port = 11200;

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

  // use offline data
  app.use('/offline', useOffline(bundler));

  // proxy to zircon services: designer-page, api, xpi and others
  useOnline(app, options, agent);

  // set cors
  app.use(cors());

  // start the server
  server.listen(
    port,
    host,
    () => {
      console.log(`Proxy server is running at http://${host}:${port}`);
    }
  );
}
main();
