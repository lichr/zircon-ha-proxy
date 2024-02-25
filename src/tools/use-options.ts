import fs from 'fs';
import _ from 'lodash';
import minimist from 'minimist';
import { IAddonOptions, IDevOptions, IOptions, IOptionsHa, IOptionsZircon, IZirconOptions, RunMode } from '../types';

function tryLoadOptions<T>(argv: any, key: string): T | undefined {
  const file = argv[key];
  const exists = file ? fs.existsSync(file) : false;
  return exists ? JSON.parse(fs.readFileSync(file).toString()) : undefined;
}

export function useOptions(): IOptions {
  // parse command line arguments
  const argv = minimist(process.argv.slice(2));

  // read options file
  // when running as add-on, this is the file provided by HA addon host
  // when running in development, this is the file placed in project root
  const addonOptions = tryLoadOptions<IAddonOptions>(argv, 'options');
  if (!addonOptions) {
    throw new Error('Please specify options file with --options option.');
  }

  // read dev-options file
  // this file is not needed when running as add-on
  const devOptions = tryLoadOptions<IDevOptions>(argv, 'dev-options');

  // read zircon-options file
  // this file is only need when running dev-containers
  const zirconOptions = tryLoadOptions<IZirconOptions>(argv, 'zircon-options');

  let ha: IOptionsHa;
  let zircon: IOptionsZircon;
  let mode: RunMode;
  if (devOptions) {
    // for running as dev-command
    mode = 'dev';
    ha = {
      apiUrl: `http://${devOptions.haBaseUrl}/api`,
      webSocketUrl: `ws://${devOptions.haBaseUrl}/api/websocket`,
      accessToken: devOptions.haAccessToken,
    }
  } else {
    // for running as add-on
    mode = 'addon';
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

  if (zirconOptions) {
    // pre-configured zircon options
    // for running as dev-command and dev-containers
    zircon = {
      zirconAccessToken: addonOptions.zircon_access_token,
      baseUrl: zirconOptions.baseUrl,
      group: addonOptions.group,
      project: addonOptions.project,
      mpiUrl: zirconOptions.mpiUrl,
      clientCert: zirconOptions.clientCert
    }
  } else {
    // default zircon options
    // for production
    zircon = {
      zirconAccessToken: addonOptions.zircon_access_token,
      baseUrl: 'https://zircon3d.com',
      group: addonOptions.group,
      project: addonOptions.project,
    }
  }
  const options = {
    mode,
    db: {
      path: 'data/zircon.db'
    },
    zircon,
    ha
  }


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

  return options;
}
