import axios, { AxiosRequestConfig } from 'axios';
import { FirebaseOptions, initializeApp } from 'firebase/app';
import { User, getAuth, signInWithCustomToken } from 'firebase/auth';
import { Agent } from 'https';
import _ from 'lodash';
import { IUser } from '../../schema';

export interface IZirconSessionConfig {
  httpsAgent: Agent | null;
  accessToken: string;
  baseUrl: string;
  onSignIn: (user: IUser) => Promise<void>;
}

/**
 * Represents a session with a Zircon server.
 * Log in with firebase custom token.
 */
export class ZirconSession {
  config: IZirconSessionConfig;
  firebaseOptions: FirebaseOptions | null = null;
  user: User | null = null;
  getUser() {
    if (!this.user) {
      throw new Error('Not logged in');
    }
    return this.user;
  }

  constructor(config: IZirconSessionConfig) {
    this.config = config;
  }

  private async _getCustomToken() {
    // get custom token from zircon server
    const [tokenId, token] = this.config.accessToken.split('.');
    const customToken = (
      await axios.post(
        `${this.config.baseUrl}/api/pub/methods/make_custom_token`,
        {
          id: tokenId,
          token
        },
        {
          httpsAgent: this.config.httpsAgent
        }
      )
    ).data.custom_token;
    return customToken;
  }

  private async _getFirebaseOptions(): Promise<FirebaseOptions> {
    // get firebase options from zircon server
    const r = await axios.get(`${this.config.baseUrl}/static/page.json`, {
      httpsAgent: this.config.httpsAgent
    });
    const pageConfig = r.data;
    const firebaseOptions = pageConfig.firebase as FirebaseOptions;
    this.firebaseOptions = firebaseOptions;
    return firebaseOptions;
  }

  async init() {
    // get  firebase options
    const firebaseOptions = await this._getFirebaseOptions();

    // get custom token
    const customToken = await this._getCustomToken();

    // initialize firebase app
    const firebase = initializeApp(firebaseOptions);

    // login with custom token
    const auth = getAuth(firebase);

    // this.user = await this._login(auth, customToken);
    this.user = (await signInWithCustomToken(auth, customToken)).user;

    // notify sign in
    const userEntry: IUser = {
      uid: this.user.uid,
      email: this.user.email,
      displayName: this.user.displayName,
      photoURL: this.user.photoURL,
      providers: _.map(this.user.providerData, (p) => p.providerId)
    };
    await this.config.onSignIn(userEntry);
  }

  async apiCall<R = any>(config: AxiosRequestConfig, needsAuth = true): Promise<R> {
    const headers: Record<string, string> = {};
    if (needsAuth) {
      if (!this.user) {
        throw new Error('Not logged in');
      }
      const idToken = await this.user.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
    }
    const r = await axios(
      {
        headers: {
          ...headers,
          ...config.headers
        },
        httpsAgent: this.config.httpsAgent,
        ...config
      }
    );
    return r.data as R;
  }

  async apiGet<R = any>(
    url: string,
    config?: AxiosRequestConfig | null,
    needsAuth = true
  ): Promise<R> {
    return await this.apiCall<R>(
      {
        method: 'get',
        url: `${this.config.baseUrl}/api/${url}`,
        ...config
      },
      needsAuth
    );
  }

  async apiPost<T = any, R = any>(url: string, data: T, needsAuth = true): Promise<R> {
    return await this.apiCall<R>(
      {
        method: 'post',
        data,
        url: `${this.config.baseUrl}/api/${url}`
      },
      needsAuth
    );    
  }

  async apiPut<T = any, R = any>(url: string, data: T, needsAuth = true): Promise<R> {
    return await this.apiCall<R>(
      {
        method: 'put',
        data,
        url: `${this.config.baseUrl}/api/${url}`
      },
      needsAuth
    );      
  }

  async apiDelete<R = any>(url: string, needsAuth = true): Promise<R> {
    return await this.apiCall<R>(
      {
        method: 'delete',
        url: `${this.config.baseUrl}/api/${url}`
      },
      needsAuth
    );
  }

  async apiGetRaw(url: string) {
    if (!this.user) {
      throw new Error('Not logged in');
    }
    const idToken = await this.user.getIdToken();
    const r = await axios.get(
      `${this.config.baseUrl}/api/${url}`,
      {
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        responseType: 'arraybuffer',
        httpsAgent: this.config.httpsAgent
      }
    );
    return r;
  }
}
