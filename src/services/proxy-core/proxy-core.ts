import { Agent } from 'https';
import { IOptions } from '../../types';
import { Bundler } from '../bundler';
import { makeAgentPemStrings } from '../../tools';

export class ProxyCore {
  options: IOptions;
  bundler: Bundler;
  agent: Agent | null = null;

  constructor(options: IOptions) {
    this.options = options;
    const { zircon: { clientCert } } = options;
    if (clientCert) {
      this.agent = makeAgentPemStrings(clientCert.key, clientCert.cert);
    }    
    this.bundler = new Bundler({
      db: { path: 'data/zircon.db' },
      client: {
        zirconAccessToken: options.zircon.zirconAccessToken,
        baseUrl: options.zircon.baseUrl,
        group: options.zircon.group,
        project: options.zircon.project,
        clientCert: options.zircon.clientCert
      }
    });
  }

  async init() {
    await this.bundler.init();
  }
}
