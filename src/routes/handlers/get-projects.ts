import _ from 'lodash';
import { LocalBranch, OnlineBranch, Project, ProxyCore } from '../../services';
import { IProjectInfo } from '../../schema';
import { _getBranches } from './private';

export async function getProjects(
  core: ProxyCore
): Promise<IProjectInfo[]> {
  const activeProject = await core.getActiveProjectId();
  const isActive = (projectId: string) => {
    return activeProject?.projectId === projectId;
  }

  // for receiving projects
  const projects: Record<string, Project> = {};
  const makeProject = (groupId: string, projectId: string) => {
    let project = projects[projectId];
    if (!project) {
      project = new Project(groupId, projectId);
      projects[projectId] = project;
    }
    return project;
  }

  // get online and local projects
  const { onlineBranches, localBranches } = await _getBranches(core);

  // merge online and local projects
  _.each(
    onlineBranches,
    (branch) => {
      makeProject(branch.groupId(), branch.projectId()).onlineBranch = branch;
    }
  );
  _.each(
    localBranches,
    (branch) => {
      makeProject(branch.groupId(), branch.projectId()).localBranch = branch;
    }
  );

  // get entries
  const entries = _.keyBy(
    await core.getDb().projectEntry.query(),
    'projectId'
  );

  _.each(
    projects,
    (project, id) => {
      project.projectEntry = entries[id];
      project.active = isActive(id);
    }
  );

  // result
  return _.map(
    projects,
    (project) => project.get()
  );
}
