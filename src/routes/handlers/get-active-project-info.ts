import _ from 'lodash';
import { ProxyCore } from '../../services';
import { IProjectInfo } from '../../schema';
import { getProjectInfo } from './get-project-info';

export async function getActiveProjectInfo(
  core: ProxyCore
): Promise<IProjectInfo | null> {
  const activeProject = await core.activeProjectId();

  if (activeProject) {
    const { groupId, projectId } = activeProject as { groupId: string, projectId: string };
    return await getProjectInfo(core, groupId, projectId);
  }
  return null;
}
