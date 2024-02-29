import _ from 'lodash';
import { ZirconDB, getLocalProjects } from '../../db';
import { ZirconClient } from '../zircon-client';
import { makeNow } from '../../tools';
import { IBundle, IResourceResponse } from '../../types';
import { Settings } from '../settings';
import { BundleManifest } from '../schema';

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

  async getActiveBundleId() {
    const settings = await this.settings();
    const projectId =  settings.projectId();
    const pe = await this.config.db().projectEntry.get(projectId);
    return pe.bundleId ?? null;
  }

  async getResource(url: string) {
    const activeBundleId = await this.getActiveBundleId();
    if (activeBundleId) {
      const res = await this.config.db().bundleResource.get(activeBundleId, url);
      return res;
    }
    return null;
  }

  async getResourceJson<T=any>(url: string): Promise<T | null> {
    const res = await this.getResource(url);
    if (res) {
      return JSON.parse(new TextDecoder().decode(res.body)) as T;
    }
    return null;
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

  async createBundle(manifest: BundleManifest) {
    const settings = await this.settings();
    const client = this.client();
    const session = client.getSession();
    // const manifest = await client.getManifest(session);

    const { info: {id, groupId, projectId}, items }  = manifest.data;
    const now = makeNow();
    
    const bundle: IBundle = {
      id,
      name: 'new-bundle',
      group: groupId,
      project: projectId,
      created: now,
      updated: now
    };

    this.config.db().bundle.upsert(bundle);
    
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
          await this.savePart(id, url, 'group', body.group);
          await this.savePart(id, url, 'project', body.project);
          await this.savePart(id, url, 'spacePlan', body.spacePlan);
          await this.savePart(id, url, 'tagGroups', body.group);
          await this.savePart(id, url, 'tags', body.group);
          await this.savePart(id, url, 'tagGroups', body.group);

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
  }

  async getLocalProjects() {
    const projects = await getLocalProjects(this.config.db().getDB());
    return projects;
  }

}
