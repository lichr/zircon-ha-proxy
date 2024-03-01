import _ from 'lodash';
import { ProxyCore } from '../../services';
import { IUserInfo } from '../../types';

export async function getUserInfo(
  core: ProxyCore
): Promise<IUserInfo | null> {
  // get user info from settings
  const settings = await core.getSettings();
  const user = settings.settings?.user ?? undefined;
  const accessToken = settings.settings?.access_token ?? undefined;
  const tokenId = accessToken?.split('.')[0];

  // get groups from zircon api
  let onlineInfo = null;
  const session = core.zirconClient.session;
  if (session) {
    onlineInfo = await session.apiGet('pub/current_user');
  }

  // return
  return {
    user,
    tokenId,
    session: !_.isNil(core.zirconClient.session),
    groups: onlineInfo?.groups ?? {},
  };
}
