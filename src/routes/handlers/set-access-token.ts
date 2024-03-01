import { ProxyCore } from '../../services';

export async function setAccessToken(core: ProxyCore, accessToken: string) {
  // save access token to settings
  await core.db.setting.upsert('access_token', accessToken);

  // re-init zircon client
  await core.zirconClient.init();
}
