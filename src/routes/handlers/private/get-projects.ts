import { ProxyCore } from '../../../services';
import { _getOnlineProjects } from './get-online-projects';

export async function _getProjects(
  core: ProxyCore
) {
  // do parallel requests
  const [onlineProjects, localProjects] = await Promise.all([
    _getOnlineProjects(core),
    core.bundler.getLocalProjects()
  ]);
  return { onlineProjects, localProjects };
}
