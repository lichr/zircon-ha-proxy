import axios from 'axios';
import { IBundleManifest, IResourceResponse, IZirconClientCert } from '../../types';
import { Agent } from 'https';
import { makeAgentPemStrings } from '../../tools';
import _, { initial } from 'lodash';
import { ZirconSession } from './zircon-session';

export interface IZirconClientConfig {
  zirconAccessToken: string;
  baseUrl: string;
  group: string;
  project: string;
  clientCert?: IZirconClientCert;
}

function makeResponse(url: string, r: any) {
  const headers = _.mapValues(
    r.headers,
    (value, key) => value.toString()
  );

  return {
    url,
    headers,
    size: r.data.byteLength,
    body: r.data,
  };
}


export class ZirconClient {
  config: IZirconClientConfig;
  httpsAgent: Agent | null = null;
  session: ZirconSession | null = null;

  constructor(config: IZirconClientConfig) {
    this.config = config;

    // make https agent if client-certificate is provided
    if (config.clientCert) {
      const { key, cert } = config.clientCert;
      this.httpsAgent = makeAgentPemStrings(key, cert);
    }
  }

  async init() {
    this.session = await this.makeSession();
  }

  projectId() {
    return this.config.project;
  }

  groupId() {
    return this.config.group;
  }

  getSession() {
    if (!this.session) {
      throw new Error('Session not initialized');
    }
    return this.session;
  }

  async makeSession() {
    const session = new ZirconSession({
      httpsAgent: this.httpsAgent,
      accessToken: this.config.zirconAccessToken,
      baseUrl: this.config.baseUrl
    });
    await session.init();
    return session;
  }

  async getManifest(session: ZirconSession): Promise<IBundleManifest> {
    return await session.apiGet(
      `pub/methods/make_bundle_manifest?group=${this.config.group}&project=${this.config.project}`
    );
  }


  async getSiteItem(url: string): Promise<IResourceResponse> {
    const r = await this.get(`${this.config.baseUrl}/${url}`);
    return makeResponse(url, r);
  }

  async getAppItem(url: string): Promise<IResourceResponse> {
    const r = await this.get(`${this.config.baseUrl}/${url}`);
    return makeResponse(url, r);
  }

  async getApiItem(session: ZirconSession, url: string, target_url: string): Promise<IResourceResponse> {
    const r = await session.apiGetRaw(target_url);
    return makeResponse(url, r);
  }

  async getS3Item(url: string, target_url: string): Promise<IResourceResponse> {
    const r2 = await axios.get(
      `${this.config.baseUrl}/xpi/s3/sign_download_url/${target_url}`,
      {
        httpsAgent: this.httpsAgent
      }
    );
    const downloadUrl = r2.data.url;

    const r = await this.get(downloadUrl);
    return makeResponse(url, r);
  }


  async get(url: string): Promise<IResourceResponse> {
    return await axios.get(
      url,
      {
        httpsAgent: this.httpsAgent,
        responseType: 'arraybuffer',
      }
    );
  }

  async getProject() {
  }

  async getSpacePlan() {

  }

  async getFileFromS3() {

  }
}
