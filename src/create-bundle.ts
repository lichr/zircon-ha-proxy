import { ProxyCore } from './services';
import _ from 'lodash';
import { useOptions } from './tools';

async function main() {
  const options = useOptions();
  const core = new ProxyCore(options);
  await core.init();
  // await core.bundler.createBundle();
}

main();
