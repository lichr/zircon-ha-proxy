export interface IOptions {
  baseUrl: string;
  email: string;
  password: string;
  group: string;
  project: string;
  /**
   * private key for client certificate, for accessing protected environments
  */
  key?: string;
  /**
   * client certificate,for accessing protected environments
  */
  cert?: string;
  haBaseUrl?: string;
  haAccessToken?: string;
}
