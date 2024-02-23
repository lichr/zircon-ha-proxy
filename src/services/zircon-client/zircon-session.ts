import axios from 'axios';
import { FirebaseOptions, initializeApp } from 'firebase/app';
import { Auth, User, getAuth, onAuthStateChanged, signInWithCustomToken, signInWithEmailAndPassword } from 'firebase/auth';
import { Agent } from 'https';

export interface IZirconSessionConfig {
  httpsAgent: Agent | null;
  accessToken: string;
  baseUrl: string;
}

/**
 * Represents a session with a Zircon server.
 * Log in with firebase custom token.
 */
export class ZirconSession {
  config: IZirconSessionConfig;
  firebaseOptions: FirebaseOptions | null = null;
  user: User | null = null;

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

  // private async _login(auth: Auth, customToken: string): Promise<User> {
  //   return new Promise(
  //     (resolve, reject) => {
  //       onAuthStateChanged(
  //         auth,
  //         (user) => {
  //           if (user) {
  //             resolve(user);
  //           } else {
  //             // reject(new Error('Failed to login'));
  //           }
  //         }
  //       );
        
  //       signInWithCustomToken(auth, customToken).catch(
  //         (err) => {
  //           console.error('Error signing in with custom token', err);
  //           reject(err);
  //         }
  //       );
  //     }
  //   );
  // }

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
