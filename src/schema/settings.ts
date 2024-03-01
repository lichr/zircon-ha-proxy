import { IProjectLocation } from './bundle';

export interface ISettingEntry<T=any> {
  id: string;
  body: any;
}

export interface IUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providers: string[];
}

export interface IUserInfo {
  session: boolean;
  user?: IUser;
  tokenId?: string;
  groups: Record<string, any>;
}

export interface ISettings {
  zircon_base_url?: string;
  access_token?: string;
  active_project?: IProjectLocation;
  user?: IUser;
}
