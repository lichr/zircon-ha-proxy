import { ProxyCore } from '../../services';

export async function upsertProject(
  core: ProxyCore,
  props: {
    projectId?: string;
    groupId: string;
    name: string;
    localOnly: boolean;
    setActive: boolean;
  }
) {
  const { projectId, groupId, name, localOnly, setActive } = props;
  if (projectId) {
    // update project if there is an offline bundle
    const entry = await core.getDb().projectEntry.get(projectId);
    const bundle = core.bundler.getLatestBundle(projectId);
  }
}

