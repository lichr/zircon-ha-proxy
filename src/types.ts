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

