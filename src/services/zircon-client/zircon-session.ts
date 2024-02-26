import axios from 'axios';
import { FirebaseOptions, initializeApp } from 'firebase/app';
import { User, getAuth, signInWithCustomToken } from 'firebase/auth';
import { Agent } from 'https';
import { IUser } from '../../types';
import _ from 'lodash';

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

  async apiGet<T = any>(url: string): Promise<T> {
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
        httpsAgent: this.config.httpsAgent
      }
    );
    return r.data;
  }

  async apiPost<T = any, R = any>(url: string, data: T): Promise<R> {
    if (!this.user) {
      throw new Error('Not logged in');
    }
    const idToken = await this.user.getIdToken();
    const r = await axios.post(
      `${this.config.baseUrl}/api/${url}`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        httpsAgent: this.config.httpsAgent
      }
    );
    return r.data;
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
