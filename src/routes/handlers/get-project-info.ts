
import _ from 'lodash';
import { Project, ProxyCore } from '../../services';
import { IProjectInfo } from '../../schema';

export async function getProjectInfo(
  core: ProxyCore,
  groupId: string,
  projectId: string,
): Promise<IProjectInfo | null> {
  // let project: Project | null = null;
  const project = new Project(groupId, projectId);
  project.onlineBranch = await core.getOnlineBranch(groupId, projectId);
  project.localBranch = await core.getLocalBranch(projectId);
  project.projectEntry = await core.getProjectEntry(projectId);
  project.active = await core.isActiveProject(projectId);

  if (project.isValid()) {
    // return
    return project.get();
  }
  return null;
}
