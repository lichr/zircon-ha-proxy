import fs from 'fs';
import _ from 'lodash';
import minimist from 'minimist';
import { IAddonOptions, IOptions } from '../types';

export function useOptions(): IOptions {
  // parse command line arguments
  const argv = minimist(process.argv.slice(2));
  const optionFile = argv.options;
  if (_.isEmpty(optionFile)) {
    throw new Error('Please specify options file with --options option.');
  }
  const addonOptions = JSON.parse(fs.readFileSync(optionFile).toString()) as IAddonOptions;
  const devOptionsFile = 'certs/dev-options.json';
  const devExits = fs.existsSync(devOptionsFile);
  const devOptions = devExits ? JSON.parse(fs.readFileSync(devOptionsFile).toString()) : undefined;

  let options: IOptions;
  if (devOptions) {
    // create options for development
    options = {
      mode: 'dev',
      email: addonOptions.email,
      password: addonOptions.password,
      baseUrl: devOptions.baseUrl,
      group: addonOptions.group,
      project: addonOptions.project,
      haApiUrl: `http://${devOptions.haBaseUrl}/api`,
      haWebSocketUrl: `ws://${devOptions.haBaseUrl}/api/websocket`,
      haAccessToken: devOptions.haAccessToken,
      dev: {
        key: devOptions.key,
        cert: devOptions.cert
      }
    }
  } else {
    // create options for addon
    const haAccessToken = process.env.SUPERVISOR_TOKEN;
    if (!haAccessToken || _.isEmpty(haAccessToken)) {
      throw new Error('SUPERVISOR_TOKEN is not set.');
    }
    options = {
      mode: 'addon',
      email: addonOptions.email,
      password: addonOptions.password,
      baseUrl: 'https://zircon3d.com',
      group: addonOptions.group,
      project: addonOptions.project,
      haApiUrl: 'http://supervisor/core/api',
      haWebSocketUrl: 'ws://supervisor/core/websocket',
      haAccessToken
    }
  }

  return options;
}
