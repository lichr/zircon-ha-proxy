import { produce } from 'immer';
import { ZirconDB } from '../../db';

export class Bundle {
  id: string;
  db: () => ZirconDB;
  
  constructor(id: string, db: () => ZirconDB) {
    this.id = id;
    this.db = db;
  }

  async getResource(url: string) {
    const res = await this.db().bundleResource.get(this.id, url);
    return res;
  }

  async getJson<T=any>(url: string): Promise<T> {
    const res = await this.getResource(url);
    if (res) {
      return JSON.parse(new TextDecoder().decode(res.body)) as T;
    }
    throw new Error(`Resource not found: ${url}`);
  }

  async updatePart<T=any>(url: string, updater: (data: T) => void) {
    const res = await this.getJson<T>(`parts/${url}`);
    if (!res) {
      throw new Error(`Part resource not found: ${url}`);
    }
    const next = produce(
      res,
      updater
    );
    if (next !== res) {
      await this.savePart(this.id, url, next);
    }
  }

  async saveJson(bundleId: string, url: string, data: any, options:any={ mode: 'static' }) {
    // convert json data to array buffer
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    if (bundleId) {
      await this.db().bundleResource.upsert({
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

  async savePart(bundleId: string, url: string, data: any) {
    await this.saveJson(bundleId, `parts/${url}`, data, { mode: 'part' });
  }
}
