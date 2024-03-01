import { ProxyCore } from '../../../services';

export async function _getOnlineProjects(
  core: ProxyCore
) {
  const session = core.zirconClient.session;
  if (session) {
    return await session.apiGet('pub/current_user/projects')
  } else {
    return {}
  }
}
