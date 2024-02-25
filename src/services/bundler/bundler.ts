import _ from 'lodash';
import { ZirconDB, getLocalProjects } from '../../db';
import { ZirconClient } from '../zircon-client';
import { makeNow } from '../../tools';
import { IBundle } from '../../types';
import { Settings } from '../settings';

export interface IBundlerConfig {
  client: () => ZirconClient;
  db: () => ZirconDB;
}

export class Bundler {
  config: IBundlerConfig;
  settings: Settings;
  client() {
    return this.config.client();
  };

  constructor(config: IBundlerConfig, settings: Settings) {
    this.config = config;
    this.settings = settings;
  }

  async getResource(url: string) {
    const activeBundleId = this.settings.activeBundle();
    const res = await this.config.db().bundleResource.get(activeBundleId, url);
    return res;
  }

  async saveStaticJson(bundleId: string, url: string, data: any, options:any={ mode: 'static' }) {
    // convert json data to array buffer
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    if (bundleId) {
      await this.config.db().bundleResource.upsert({
        bundle_id: bundleId,
        url,
        headers: {},
        body: bytes,
        options: {
          type: 'json',
          ...options
        }
      });
    }
  }

  async savePart(bundleId: string, parent: string, url: string, data: any) {
    await this.saveStaticJson(bundleId, `parts/${url}`, data, { mode: 'part', parent });
  }

  async createBundle() {
    const client = this.client();
    const session = client.getSession();
    const manifest = await client.getManifest(session);
    console.log('>>>>>> manifest: ', manifest);

    const bundleId = manifest.info.id;
    const now = makeNow();
    const project = this.settings.projectId();
    const group = this.settings.groupId();

    const bundle: IBundle = {
      id: bundleId,
      name: 'new-bundle',
      group,
      project,
      created: now,
      updated: now
    };

    this.config.db().bundle.upsert(bundle);
    
    for (const url in manifest.items) {
      const item = manifest.items[url];
      const { type, target: { scope, url: targetUrl } } = item;
      let r;

      try {
        if (scope === 'site') {
          r = await client.getSiteItem(url);
        } else if (scope === 'app') {
          r = await client.getAppItem(url);
        } else if (scope === 'api') {
          r = await client.getApiItem(session, url, targetUrl);
        } else if (scope === 's3') {
          r = await client.getS3Item(url, targetUrl);
        }
      } catch (e) {
        console.error('>>>>>> error loading item: ', url);
        console.error('>>>>>> error: ', e);
        
      }

      console.log('>>>>>> resource: ', r?.url, r?.size);

      if (r) {
        if (url === 'api/pub/methods/load_viewer') {
          // we break down the load_viewer response into parts
          const body = JSON.parse(new TextDecoder().decode(r.body));
          await this.savePart(bundleId, url, 'group', body.group);
          await this.savePart(bundleId, url, 'project', body.project);
          await this.savePart(bundleId, url, 'spacePlan', body.spacePlan);
          await this.savePart(bundleId, url, 'tagGroups', body.group);
          await this.savePart(bundleId, url, 'tags', body.group);
          await this.savePart(bundleId, url, 'tagGroups', body.group);

        } else {
          // save cached resource
          await this.config.db().bundleResource.upsert({
            bundle_id: bundleId,
            url,
            headers: r.headers,
            body: r.body,
            options: {
              type,
              mode: 'cache'
            }
          });

        }
      };
    }

    // set active bundle
    this.settings.set('active_bundle', bundleId);
  }

  async getLocalProjects() {
    const projects = await getLocalProjects(this.config.db().getDB());
    return projects;
  }

}
