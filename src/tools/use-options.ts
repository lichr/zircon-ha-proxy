import fs from 'fs';
import _ from 'lodash';
import minimist from 'minimist';
import { IConfig, IOptions, IHaOptions, IOptionsZircon } from '../types';

function tryLoadOptions<T>(argv: any, key: string): T | undefined {
  const file = argv[key];
  const exists = file ? fs.existsSync(file) : false;
  return exists ? JSON.parse(fs.readFileSync(file).toString()) : undefined;
}

export function useOptions(): IOptions {
  // parse command line arguments
  const argv = minimist(process.argv.slice(2));

  // read config file
  const config = tryLoadOptions<IConfig>(argv, 'config');
  if (!config) {
    throw new Error('config file not found.');
  }

  // generate options for access ha api
  const { mode, zircon, database } = config;
  let ha: IHaOptions;
  if (config.mode === 'dev') {
    if (!config.ha) {
      throw new Error('HA dev config must be set for running proxy in dev mode.');
    }
    const { baseUrl, host, accessToken } = config.ha;
    ha = {
      apiUrl: `http://${baseUrl}/api`,
      webSocketUrl: `ws://${host}/api/websocket`,
      accessToken
    }
  } else {
    // for running as add-on
    const accessToken = process.env.SUPERVISOR_TOKEN;
    if (!accessToken || _.isEmpty(accessToken)) {
      throw new Error('SUPERVISOR_TOKEN is not set.');
    }
    ha = {
      apiUrl: 'http://supervisor/core/api',
      webSocketUrl: 'ws://supervisor/core/websocket',
      accessToken
    }
  }

  // make options
  const options: IOptions = {
    mode,
    database,
    zircon,
    ha
  }

  // notify options
  console.log('>>> options: ', {
    mode: options.mode,
    zircon: {
      ...options.zircon,
      clientCert: options.zircon.clientCert ? '***': undefined,
      zirconAccessToken: '***'
    },
    ha: {
      ...options.ha,
      accessToken: '***'
    }
  });

  // return
  return options;
}
