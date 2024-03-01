import _ from 'lodash';
import { ProxyCore } from '../../services';
import { IProjectInfo } from '../../types';
import { getProjectInfo } from './get-project-info';

export async function getActiveProjectInfo(
  core: ProxyCore
): Promise<IProjectInfo | null> {
  const settings = await core.getSettings();
  const currentProject = settings.settings?.active_project;

  if (currentProject) {
    const { groupId, projectId } = currentProject as { groupId: string, projectId: string };
    return await getProjectInfo(core, groupId, projectId);
  }
  return null;
}
