import express from 'express';
import cors from 'cors';
import http from 'http';
import _ from 'lodash';
import WebSocket from 'ws';
import { useOptions } from './tools';
import { HaClient, ProxyCore, ProxyServer } from './services';
import { useOffline, useOnline } from './routes';

async function main() {
  const options = useOptions();
  const { ha: { webSocketUrl, accessToken }, zircon: { baseUrl, clientCert } } = options;
  const core = new ProxyCore(options);


  // create express app
  const app = express();
  const server = http.createServer(app);
  const host = '0.0.0.0';
  const port = 11200;

  // proxy to ha socket
  const ha = new HaClient(webSocketUrl, accessToken);

  // ws server for mpi events
  const wss = new WebSocket.Server({ server, path: '/mpi/ws' });
  new ProxyServer(wss, ha);

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
  app.use('/offline', useOffline(options, core));

  // proxy to zircon services: designer-page, api, xpi and others
  useOnline(app, core);

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
