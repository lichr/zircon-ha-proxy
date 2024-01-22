export interface IAddonOptions {
  email: string;
  password: string;
  group: string;
  project: string;
}

export interface IDevOptions {
  baseUrl: string;
  /**
   * private key and cert for client certificate, for accessing protected environments
  */
  key: string;
  cert: string;
  haHost: string;
  haAccessToken: string;
}

export interface IOptions {
  mode: 'addon' | 'dev';
  email: string;
  password: string;
  baseUrl: string;
  group: string;
  project: string;
  haApiUrl: string;
  haWebSocketUrl: string;
  haAccessToken: string;
  dev?: {
    key: string;
    cert: string;
  }
}

export interface IProjectLocation {
  groupId: string;
  projectId: string;
}
