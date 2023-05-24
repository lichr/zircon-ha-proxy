export interface IOptions {
  baseUrl: string;
  signIn: {
    email: string;
    password: string;
  },
  location: {
    group: string;
    project: string;
  },
  certs?: {
    key: string;
    cert: string;
  }
}
