
import _ from 'lodash';
import { LocalBranch, OnlineBranch, Project, ProxyCore } from '../../services';
import { IProjectInfo } from '../../schema';
import { _getProjects } from './private';

export async function getProjectInfo(
  core: ProxyCore,
  groupId: string,
  projectId: string,
  active?: boolean
): Promise<IProjectInfo | null> {
  let project: Project | null = null;

  // get online and local projects
  const { onlineProjects, localProjects } = await _getProjects(core);

  // find online project
  const onlineProject = _.find(
    onlineProjects,
    (project: any) => project.project.group === groupId && project.info.id === projectId
  );
  if (onlineProject) {
    project = new Project(groupId, projectId);
    project.onlineBranch = new OnlineBranch(onlineProject);
  }

  // find local project
  const localProject = _.find(
    localProjects,
    (project) => project.groupId === groupId && project.projectId === projectId
  );
  if (localProject) {
    if (!project) {
      project = new Project(groupId, projectId);
    }
    project.localBranch = new LocalBranch(localProject);
  }

  if (project) {
    // set active
    if (_.isNil(active)) {
      const settings = await core.getSettings();
      const currentProject = settings.settings?.active_project;
      project.active = currentProject?.groupId === groupId && currentProject?.projectId === projectId;
    } else {
      project.active = active;
    }

    // project entry
    const entry = await core.getDb().projectEntry.get(projectId);
    project.projectEntry = entry;

    // return
    return project.get();
  }
  return null;
}
