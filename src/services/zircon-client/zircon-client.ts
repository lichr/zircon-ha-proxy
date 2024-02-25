import axios from 'axios';
import { IBundleManifest, IResourceResponse, IUser, IZirconClientCert } from '../../types';
import { Agent } from 'https';
import { makeAgentPemStrings } from '../../tools';
import _ from 'lodash';
import { ZirconSession } from './zircon-session';
import { ZirconDB } from '../../db';
import { Settings } from '../settings';

export interface IZirconClientConfig {
  db: () => ZirconDB;
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
  settings: Settings;

  constructor(config: IZirconClientConfig, settings: Settings) {
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

  async makeSession() {
    const accessToken = this.settings.accessToken();
    const baseUrl = this.settings.ZirconBaseUrl();
    const session = new ZirconSession({
      httpsAgent: this.httpsAgent,
      accessToken,
      baseUrl,
      onSignIn: this.onSignIn
    });
    await session.init();
    return session;
  }

  onSignIn = async (user: IUser) => {
    // save user info to db
    this.settings.set('user', user);
  }

  async getManifest(session: ZirconSession): Promise<IBundleManifest> {
    const projectId = this.settings.projectId();
    const groupId = this.settings.groupId();
    return await session.apiGet(
      `pub/methods/make_bundle_manifest?group=${groupId}&project=${projectId}`
    );
  }


  async getSiteItem(url: string): Promise<IResourceResponse> {
    const baseUrl = this.settings.ZirconBaseUrl();
    const r = await this.get(`${baseUrl}/${url}`);
    return makeResponse(url, r);
  }

  async getAppItem(url: string): Promise<IResourceResponse> {
    const baseUrl = this.settings.ZirconBaseUrl();
    const r = await this.get(`${baseUrl}/${url}`);
    return makeResponse(url, r);
  }

  async getApiItem(session: ZirconSession, url: string, target_url: string): Promise<IResourceResponse> {
    const r = await session.apiGetRaw(target_url);
    return makeResponse(url, r);
  }

  async getS3Item(url: string, target_url: string): Promise<IResourceResponse> {
    const baseUrl = this.settings.ZirconBaseUrl();
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
