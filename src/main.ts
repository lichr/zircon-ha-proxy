import axios from 'axios';
import express, { Request, Response } from 'express';
import fs from 'fs';
import { Options, createProxyMiddleware } from 'http-proxy-middleware';
import _ from 'lodash';
import minimist from 'minimist';
import { makeAgentPemStrings } from './make-agent';
import { IOptions } from './types';

// parse command line arguments
const argv = minimist(process.argv.slice(2));
const optionFile = argv.options;
if (_.isEmpty(optionFile)) {
  throw new Error('Please specify options file with --options option.');
}
const options = JSON.parse(fs.readFileSync(optionFile).toString()) as IOptions;
const { baseUrl, email, password, group, project, key, cert } = options;

// create https agent that uses client certificate
const agent = key && cert ? makeAgentPemStrings(key, cert) : undefined;

// make default proxy options
const proxyOptions: Options = {
  target: baseUrl, // Target host
  changeOrigin: true, // Needed for virtual hosted sites
  ws: true, // Proxy websockets
  secure: true, // If you want to verify the SSL Certs
  agent,
  logLevel: 'debug'
};

// create express app
const app = express();
const host = '0.0.0.0';
const port = 3100;

// serve page config
app.get('/config/page.json', async (req: Request, res: Response) => {
  try {
    const ingressPath = req.headers['x-ingress-path'];
    const response = await axios.get(`${baseUrl}/designer/config/page.json`, {
      httpsAgent: agent
    });

    // Add login info to received JSON data
    const modifiedData = {
      ...response.data,
      page: {
        baseUrl: ingressPath ?? '',
        apiBaseUrl: 'zircon/api',
        xpiBaseUrl: 'zircon/xpi'
      },
      signIn: {
        email,
        password
      },
      location: {
        group,
        project
      }
    };

    res.json(modifiedData);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred.');
  }
});

// proxy
app.use(
  '/zircon',
  createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      '^/zircon': ''
    }
  })
);
app.use(
  '/',
  createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: {
      '^/': '/designer/'
    }
  })
);

// start the server
app.listen(
  port,
  host,
  () => {
    console.log(`Proxy server is running at http://${host}:${port}`);
  }
);
