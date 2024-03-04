import _ from 'lodash';
import { ZirconDB } from '../../db';
import { ZirconClient } from '../zircon-client';
import { makeNow } from '../../tools';
import { Settings } from '../settings';
import { BundleManifest, IBundle, IResourceResponse } from '../../schema';
import { Bundle } from './bundle';

export interface IBundlerConfig {
  client: () => ZirconClient;
  db: () => ZirconDB;
}

export class Bundler {
  config: IBundlerConfig;
  settings: () => Promise<Settings>;
  client() {
    return this.config.client();
  };

  constructor(config: IBundlerConfig, settings: () => Promise<Settings>) {
    this.config = config;
    this.settings = settings;
  }

  async getBundle(projectId: string) {
    const pe = await this.config.db().projectEntry.get(projectId);
    if (pe?.bundleId) {
      return new Bundle(pe.bundleId, this.config.db);
    }
    throw new Error('Can not get bundle because project-entry was not found');
  }

  async getLatestBundle(projectId: string): Promise<IBundle | null> {
    return await this.config.db().bundle.getLatestBundle(projectId);
  }

  // make this upsert
  async createBundle(manifest: BundleManifest) {
    const client = this.client();
    const session = client.getSession();

    const { info: {id, groupId, projectId}, items }  = manifest.data;
    const now = makeNow();
    
    const bundleData: IBundle = {
      id,
      name: 'new-bundle',
      group: groupId,
      project: projectId,
      created: now,
      updated: now
    };

    this.config.db().bundle.upsert(bundleData);
    const bundle = new Bundle(id, this.config.db);
    
    for (const url in items) {
      const item = items[url];
      const { type, target: { scope, url: targetUrl }, data } = item;
      let r: IResourceResponse | null = null;

      console.log('>>> load item: ', scope, url, targetUrl);

      try {
        if (scope === 'site') {
          r = await client.getSiteItem(url);
        } else if (scope === 'app') {
          r = await client.getAppItem(url);
        } else if (scope === 'api') {
          r = await client.getApiItem(session, url, targetUrl);
        } else if (scope === 's3') {
          r = await client.getS3Item(url, targetUrl);
        } else if (scope === 'part') {
          const body = new TextEncoder().encode(JSON.stringify(data));
          r = {
            url,
            headers: {},
            body
          }
        }
      } catch (e) {
        console.error('>>>>>> error loading item: ', url);
        console.error('>>>>>> error: ', e);
        
      }

      console.log('>>>>>> resource: ', r?.url);

      if (r) {
        if (url === 'api/pub/methods/load_viewer') {
          // we break down the load_viewer response into parts
          const body = JSON.parse(new TextDecoder().decode(r.body));
          await bundle.savePart(id, 'group', body.group);
          await bundle.savePart(id, 'project', body.project);
          await bundle.savePart(id, 'spacePlan', body.spacePlan);
          await bundle.savePart(id, 'tagGroups', body.group);
          await bundle.savePart(id, 'tags', body.group);
          await bundle.savePart(id, 'tagGroups', body.group);

        } else {
          // save cached resource
          await this.config.db().bundleResource.upsert({
            bundle_id: id,
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
    return bundleData;
  }

  async pruneByProject(projectId: string, bundleId: string) {
    await this.config.db().bundle.pruneByProject(projectId, bundleId);
  }

  async prune() {
    // delete all bundles that do not have a project entry
    await this.config.db().bundle.prune();
    // delete all resources that do not have a bundle entry
    await this.config.db().bundleResource.prune();
  }
}
