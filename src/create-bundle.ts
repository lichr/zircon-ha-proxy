import fs from 'fs';
import { Bundler } from './services';
import _ from 'lodash';
import { useOptions } from './tools';


function tryLoadOptions<T>(file: string): T | undefined {
  const exists = file ? fs.existsSync(file) : false;
  return exists ? JSON.parse(fs.readFileSync(file).toString()) : undefined;
}


// const clientConfig: IZirconClientConfig = {
//   zirconAccessToken: 'g0yQNInyov69.8ftTZdzr1NifU6yVW9hJXi4GAvINAG3X',
//   baseUrl: 'https://dev.zircon.run',
//   group: 'ZA7SAvKGkJE6',
//   project: 'avqzYxQ9jbMh',
// }

async function main() {
  // const zirconOptions = tryLoadOptions<IZirconOptions>('../../options/zircon-options.json');
  // if (!zirconOptions) {
  //   throw new Error('Please specify options file with --options option.');
  // }
  // clientConfig.clientCert = zirconOptions.clientCert;

  const options = useOptions();
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
  await bundler.createBundle();

  // const session = await bundler.client.makeSession();
  // // const item = await bundler.client.getApiItem(session, 'api/pub/methods/load_viewer?group=FrCOUUzBcuCS&project=smxhtZa6arCt', 'pub/methods/load_viewer?group=FrCOUUzBcuCS&project=smxhtZa6arCt');
  // const item = await bundler.client.getAppItem('resources/lebombo_1k.hdr');
  // console.log('>>>>>> item: ', _.omit(item, 'body'));

}

main();
