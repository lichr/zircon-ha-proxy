import _ from 'lodash';
import { LocalBranch, OnlineBranch, Project, ProxyCore } from '../../services';
import { IProjectInfo } from '../../types';
import { _getProjects } from './private';

export async function getProjects(
  core: ProxyCore
): Promise<IProjectInfo[]> {
  const settings = await core.getSettings();
  const currentProject = settings.settings?.active_project;

  // for receiving projects
  const projects: Record<string, Project> = {};
  const makeProject = (groupId: string, projectId: string) => {
    const id = `${groupId}.${projectId}`;
    let project = projects[id];
    if (!project) {
      project = new Project(groupId, projectId);
      projects[id] = project;
    }
    return project;
  }

  // get online and local projects
  const { onlineProjects, localProjects } = await _getProjects(core);

  // merge online and local projects
  _.each(
    onlineProjects,
    (project: any) => {
      const projectId = project.info.id;
      const groupId = project.project.group;
      makeProject(groupId, projectId).onlineBranch = new OnlineBranch(project);
    }
  );
  _.each(
    localProjects,
    (project) => {
      const { groupId, projectId } = project;
      makeProject(groupId, projectId).localBranch = new LocalBranch(project);
    }
  );

  // get entries
  const entries = _.keyBy(
    await core.getDb().projectEntry.query(),
    'id'
  );
  _.each(
    projects,
    (project, id) => {
      project.projectEntry = entries[id];
      project.active = id === currentProject?.projectId;
    }
  );

  // result
  return _.map(
    projects,
    (project) => project.get()
  );
}
