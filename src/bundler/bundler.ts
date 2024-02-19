import _ from 'lodash';
import { IZirconDBConfig, ZirconDB } from '../db';
import { IZirconClientConfig, ZirconClient } from '../zircon-client';
import { makeNow } from '../tools';

export interface IBundlerConfig {
  db: IZirconDBConfig;
  client: IZirconClientConfig;
}

export class Bundler {
  db: ZirconDB;
  config: IBundlerConfig;
  client: ZirconClient;
  activeBundleId: string | null = null;

  constructor(config: IBundlerConfig) {
    this.config = config;
    this.db = new ZirconDB(config.db);
    this.client = new ZirconClient(config.client);
  }

  async init() {
    await this.db.init();
    const settings = await this.db.setting.query();
    this.activeBundleId = settings.active_bundle;
  }

  async getResource(url: string) {
    if (this.activeBundleId) {
      const res = await this.db.bundleResource.get('YIq0ZQz7xG0g', url);
      return res;
    }
    return null;
  }

  async createBundle() {
    const session = await this.client.makeSession();
    const manifest = await this.client.getManifest(session);
    console.log('>>>>>> manifest: ', manifest);

    const bundleId = manifest.info.id;
    const now = makeNow();

    this.db.bundle.upsert({
      id: bundleId,
      name: 'new-bundle',
      created: now,
      updated: now
    });


    for (const url in manifest.items) {
      const item = manifest.items[url];
      const { type, target: { scope, url: targetUrl } } = item;
      let r;

      try {
        if (scope === 'site') {
          r = await this.client.getSiteItem(url);
        } else if (scope === 'app') {
          r = await this.client.getAppItem(url);
        } else if (scope === 'api') {
          r = await this.client.getApiItem(session, url, targetUrl);
        } else if (scope === 's3') {
          r = await this.client.getS3Item(url, targetUrl);
        }
      } catch (e) {
        console.error('>>>>>> error loading item: ', url);
      }

      console.log('>>>>>> resource: ', r?.url, r?.size);

      if (r) {
        this.db.bundleResource.upsert({
          bundle_id: bundleId,
          url,
          headers: r.headers,
          size: r.size,
          body: r.body,
          options: {
            type,
            status: 'loaded'
          }
        })
      };
    }

    // set active bundle
    this.db.setting.upsert('active_bundle', bundleId);
    this.activeBundleId = bundleId;
  }


  dispose() {
    this.db.dispose();
  }

}
