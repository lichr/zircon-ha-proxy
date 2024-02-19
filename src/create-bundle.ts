import fs from 'fs';
import { Database } from 'sqlite3';
import { Bundler, IBundlerConfig } from './bundler';
import { IZirconClientConfig, ZirconClient, ZirconSession } from './zircon-client';
import { IZirconOptions } from './types';
import _ from 'lodash';


function tryLoadOptions<T>(file: string): T | undefined {
  const exists = file ? fs.existsSync(file) : false;
  return exists ? JSON.parse(fs.readFileSync(file).toString()) : undefined;
}


const clientConfig: IZirconClientConfig = {
  zirconAccessToken: 'z6dB7FtqWnd4.r1c9isqtX03dGOtdLbL9HM04LhjYnMr9',
  baseUrl: 'https://dev.zircon.run',
  group: 'FrCOUUzBcuCS',
  project: 'smxhtZa6arCt',
}

async function main() {

  const zirconOptions = tryLoadOptions<IZirconOptions>('../../options/zircon-options.json');
  if (!zirconOptions) {
    throw new Error('Please specify options file with --options option.');
  }
  clientConfig.clientCert = zirconOptions.clientCert;

  const config: IBundlerConfig = {
    db: {
      path: 'data/zircon.db'
    },
    client: clientConfig
  };
  const bundler = new Bundler(config);
  await bundler.init();
  await bundler.createBundle();

  // const session = await bundler.client.makeSession();
  // // const item = await bundler.client.getApiItem(session, 'api/pub/methods/load_viewer?group=FrCOUUzBcuCS&project=smxhtZa6arCt', 'pub/methods/load_viewer?group=FrCOUUzBcuCS&project=smxhtZa6arCt');
  // const item = await bundler.client.getAppItem('resources/lebombo_1k.hdr');
  // console.log('>>>>>> item: ', _.omit(item, 'body'));

}

main();
