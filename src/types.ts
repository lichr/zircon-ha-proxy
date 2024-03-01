import { IZirconDBConfig } from './db';

export interface IZirconClientCert {
  key: string;
  cert: string;
}

export interface IZirconOptions {
  baseUrl: string;
  mpiUrl?: string;
  clientCert?: IZirconClientCert;
}

export interface IHaOptions {
  apiUrl: string;
  webSocketUrl: string;
  accessToken: string;
}

export interface IOptionsZircon {
  baseUrl: string;
  mpiUrl?: string;
  clientCert?: IZirconClientCert;
}

export interface IHaDevConfig {
  baseUrl: string;
  host: string;
  accessToken: string;
}

export type RunMode = 'addon' | 'dev';
export interface IOptions {
  mode: RunMode;
  database: IZirconDBConfig;
  zircon: IOptionsZircon;
  ha: IHaOptions;
}

export interface IConfig {
  mode: RunMode;
  options: string;
  database: IZirconDBConfig;
  zircon: IOptionsZircon;
  ha?: IHaDevConfig;
}

export interface IProjectLocation {
  groupId: string;
  projectId: string;
}

// offline-bundle

export interface IBundleManifestInfo {
  id: string;
  groupId: string;
  projectId: string;
  version: string;
  create_time: string;
}

export type BundleResourceType = 'js' | 'json' | 'bin' | 'html';
export type BundleResourceScope = 'site' | 'app' | 'api' | 's3' | 'part';

export interface IBundleManifestItem {
  data?: any;
  target: {
    scope: BundleResourceScope;
    url: string;
  },
  type: BundleResourceType
}

export interface IBundleManifest {
  info: IBundleManifestInfo;
  items: Record<string, IBundleManifestItem>;
}

export interface IBundle {
  id: string;
  name: string;
  group: string;
  project: string;
  description?: string;
  created: string;
  updated: string;
}

export interface IProjectEntry {
  id: string;
  localOnly: boolean;
  bundleId?: string;
}

export interface IBundleResourceOptions {
  type: BundleResourceType;
  /**
   * cached: served as what is stored in the table
   * part: this is a part of a larger resource
   */
  mode: 'cache' | 'static' | 'part';
  parent?: string;
}

export interface IBundleResourceHeader {
  name: string;
  value: string;
}

export interface IResourceResponse {
  url: string;
  headers: Record<string, string>;
  body: ArrayBuffer;
}

export interface IBundleResource {
  bundle_id: string;
  url: string;
  headers: Record<string, string>;
  size: number;
  body: ArrayBuffer;
  options: IBundleResourceOptions;
}

export interface IBundleResourceInput {
  bundle_id: string;
  url: string;
  headers: Record<string, string>;
  body: ArrayBuffer;
  options: IBundleResourceOptions;
}

export interface IBundleLogEntry {
  id: string;
  bundle_id: string;
  level: 'info' | 'warn' | 'error';
  created: string;
  message: string;
  data?: any;
  error?: any;
}

export interface ISettingEntry<T=any> {
  id: string;
  body: any;
}

export interface IUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providers: string[];
}

export interface IUserInfo {
  session: boolean;
  user?: IUser;
  tokenId?: string;
  groups: Record<string, any>;
}

export interface ISettings {
  zircon_base_url?: string;
  access_token?: string;
  active_project?: IProjectLocation;
  user?: IUser;
}

export interface IProjectInfo {
  groupId: string;
  projectId: string;
  active: boolean;
  localOnly: boolean;
  onlineBranch: boolean;
  localBranch: boolean;
  name: string | null;
  updateTime: string | null;
}
