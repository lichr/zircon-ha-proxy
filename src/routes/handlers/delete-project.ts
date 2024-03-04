import { ProxyCore } from '../../services';


export async function deleteProject(
  core: ProxyCore,
  groupId: string,
  projectId: string
) {
  try {
    // delete online branch
    await core.deleteOnlineBranch(groupId, projectId);
  } catch (e) {
    // do nothing
    // likely this is a 404
  }

  // delete project entry
  await core.deleteProjectEntry(projectId);

  // prune offline bundles
  await core.bundler.prune();
}
