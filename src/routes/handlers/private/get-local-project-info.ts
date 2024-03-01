import { ILocalProject } from '../../../schema';
import { ProxyCore } from '../../../services';

export async function getLocalProjectInfo(
  core: ProxyCore,
  props: {
    groupId: string;
    projectId: string;
  }
): Promise<ILocalProject> {
  const { groupId, projectId } = props;
  const entry = await core.getDb().projectEntry.get(projectId);
  const bundle = core.bundler.getLatestBundle(projectId);
  return {
    projectId,
    bundleId: entry?.bundleId,
    localOnly: entry?.localOnly ?? false
  };
}
