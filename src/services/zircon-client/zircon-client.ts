import axios from 'axios';
import { Agent } from 'https';
import _ from 'lodash';
import { IZirconClientCert } from '../../types';
import { makeAgentPemStrings } from '../../tools';
import { ZirconDB } from '../../db';
import { IResourceResponse, IUser, IBundleManifest } from '../../schema';
import { Settings } from '../settings';
import { ZirconSession } from './zircon-session';

export interface IZirconClientConfig {
  zirconBaseUrl: string;
  db: () => ZirconDB;
  clientCert?: IZirconClientCert;
}

function makeResponse(url: string, r: any): IResourceResponse {
  const headers = _.mapValues(
    r.headers,
    (value, key) => value.toString()
  );

  return {
    url,
    headers,
    body: r.data,
  };
}

export class ZirconClient {
  config: IZirconClientConfig;
  httpsAgent: Agent | null = null;
  session: ZirconSession | null = null;
  settings: () => Promise<Settings>;

  constructor(config: IZirconClientConfig, settings: () => Promise<Settings>) {
    this.config = config;
    this.settings = settings;

    // make https agent if client-certificate is provided
    if (config.clientCert) {
      const { key, cert } = config.clientCert;
      this.httpsAgent = makeAgentPemStrings(key, cert);
    }
  }

  async init() {
    this.session = await this.makeSession();
  }

  getSession() {
    if (!this.session) {
      throw new Error('Session not initialized');
    }
    return this.session;
  }

  async getIdToken() {
    const user = this.session?.user;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }

  async makeSession() {
    const settings = await this.settings();
    const accessToken = settings.settings?.access_token ?? null;
    if (accessToken) {
      const baseUrl = this.config.zirconBaseUrl;
      const session = new ZirconSession({
        httpsAgent: this.httpsAgent,
        accessToken,
        baseUrl,
        onSignIn: this.onSignIn
      });
      await session.init();
      return session;
    }
    return null;
  }

  onSignIn = async (user: IUser) => {
    const settings = await this.settings();
    // save user info to db
    settings.set('user', user);
  }

  async getManifest(session: ZirconSession): Promise<IBundleManifest> {
    const settings = await this.settings();
    const projectId = settings.projectId();
    const groupId = settings.groupId();
    return await session.apiGet(
      `pub/methods/make_bundle_manifest?group=${groupId}&project=${projectId}`
    );
  }


  async getSiteItem(url: string): Promise<IResourceResponse> {
    const baseUrl = this.config.zirconBaseUrl;
    const r = await this.get(`${baseUrl}/${url}`);
    return makeResponse(url, r);
  }

  async getAppItem(url: string): Promise<IResourceResponse> {
    const baseUrl = this.config.zirconBaseUrl;
    const r = await this.get(`${baseUrl}/${url}`);
    return makeResponse(url, r);
  }

  async getApiItem(session: ZirconSession, url: string, target_url: string): Promise<IResourceResponse> {
    const r = await session.apiGetRaw(target_url);
    return makeResponse(url, r);
  }

  async getS3Item(url: string, target_url: string): Promise<IResourceResponse> {
    const baseUrl = this.config.zirconBaseUrl;
    const r2 = await axios.get(
      `${baseUrl}/xpi/s3/sign_download_url/${target_url}`,
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
