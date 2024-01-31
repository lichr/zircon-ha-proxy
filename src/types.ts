export interface IAddonOptions {
  zircon_access_token: string;
  group: string;
  project: string;
}

export interface IZirconClient {
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
  client?: IZirconClient;
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
  client?: IZirconClient;
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
