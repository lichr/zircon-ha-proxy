import { ZirconDB } from '../../db';
import { ISettings } from '../../types';

// TODO: add initial value from config files
export class Settings {
  db: () => ZirconDB;
  settings: ISettings | null = null;

  constructor(
    db: () => ZirconDB
  ) {
    this.db = db;
  }
  async load() {
    this.settings = await this.db().setting.query();
  }

  async set<T=any>(id: string, body: any, noReLoad?: boolean) {
    await this.db().setting.upsert(id, body);
    if (!noReLoad) {
      await this.load();
    }
  }

  user() {
    const v = this.settings?.user;
    if (!v) {
      throw new Error('User not set (settings.user)');
    }
    return v;
  }

  projectId() {
    const v = this.settings?.active_project?.projectId;
    if (!v) {
      throw new Error('Active project not set (settings.active_project.projectId)');
    }
    return v;
  }

  groupId() {
    const v = this.settings?.active_project?.groupId;
    if (!v) {
      throw new Error('Active project not set (settings.active_project.groupId)');
    }
    return v;
  }

  accessToken() {
    const v = this.settings?.access_token;
    if (!v) {
      throw new Error('Access token not set (settings.access_token)');
    }
    return v;
  }

  ZirconBaseUrl() {
    const v = this.settings?.zircon_base_url;
    if (!v) {
      throw new Error('Zircon base url not set (settings.zircon_base_url)');
    }
    return v;
  }

  activeBundle() {
    const v = this.settings?.active_bundle;
    if (!v) {
      throw new Error('Active bundle not set (settings.active_bundle)');
    }
    return v;
  }
}
