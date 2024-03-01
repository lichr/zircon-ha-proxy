
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
