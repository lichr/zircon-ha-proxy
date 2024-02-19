export interface IAddonOptions {
  zircon_access_token: string;
  group: string;
  project: string;
}

export interface IZirconClientCert {
  key: string;
  cert: string;
}
export interface IDevOptions {
  haBaseUrl: string;
  haHost: string;
  haAccessToken: string;
}

export interface IZirconOptions {
  baseUrl: string;
  mpiUrl?: string;
  clientCert?: IZirconClientCert;
}

export interface IOptionsHa {
  apiUrl: string;
  webSocketUrl: string;
  accessToken: string;
}

export interface IOptionsZircon {
  zirconAccessToken: string;
  baseUrl: string;
  group: string;
  project: string;  
  mpiUrl?: string;
  clientCert?: IZirconClientCert;
}

export type RunMode = 'addon' | 'dev';
export interface IOptions {
  mode: RunMode;
  zircon: IOptionsZircon,
  ha: IOptionsHa,
}

export interface IProjectLocation {
  groupId: string;
  projectId: string;
}

// offline-bundle

export interface IBundleManifestInfo {
  id: string;
  version: string;
  create_time: string;
}

export type BundleResourceType = 'js' | 'json' | 'bin' | 'html';
export type BundleResourceScope = 'site' | 'app' | 'api' | 's3';

export interface IBundleManifestItem {
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
  description?: string;
  created: string;
  updated: string;
}

export interface IBundleResourceOptions {
  type: BundleResourceType;
  status: 'loading' | 'loaded';
}

export interface IBundleResourceHeader {
  name: string;
  value: string;
}

export interface IResourceResponse {
  url: string;
  headers: Record<string, string>;
  size: number;
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

export interface IBundleLogEntry {
  id: string;
  bundle_id: string;
  level: 'info' | 'warn' | 'error';
  created: string;
  message: string;
  data?: any;
  error?: any;
}
