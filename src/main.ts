import express, { Request, Response } from 'express';
import { Options, createProxyMiddleware } from 'http-proxy-middleware';
import { makeAgentPem } from './make-agent';
import axios from 'axios';
import _ from 'lodash';

// https agent that uses client certificate
const agent = makeAgentPem('certs/dev.key', 'certs/dev.crt');
const options: Options = {
  target: 'https://dev.zircon.run', // Target host
  // path rewrite rules
  pathRewrite: {
    '^/': '/designer/'
  },
  changeOrigin: true, // Needed for virtual hosted sites
  ws: true, // Proxy websockets
  secure: true, // If you want to verify the SSL Certs
  agent,
  logLevel: 'debug'
};

const proxy = createProxyMiddleware(options);
const app = express();
const host = '0.0.0.0';
const port = 3100;

// serve page config
app.get('/config/page.json', async (req: Request, res: Response) => {
  try {
    const ingressPath = req.headers['x-ingress-path'];
    console.log('>>> ingress-path: ', ingressPath);

    const response = await axios.get('https://dev.zircon.run/designer/config/page.json', {
      httpsAgent: agent
    });

    // Add login info to received JSON data
    const modifiedData = {
      ...response.data,
      signIn: {
        email: 'dev@zircon.app',
        password: '111111'
      },
      location: {
        group: 'FrCOUUzBcuCS',
        project: 'bke19Xd6bzoT'
      }
    };

    res.json(modifiedData);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred.');
  }
});

// proxy
app.use('/', proxy);

// start the server
app.listen(
  port,
  host,
  () => {
    console.log(`Proxy server is running at http://${host}:{port}`);
  }
);
