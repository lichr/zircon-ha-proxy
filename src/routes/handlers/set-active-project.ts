import { ProxyCore } from '../../services';

export async function setActiveProject(
  core: ProxyCore,
  groupId: string,
  projectId: string
) {
  await core.db.setting.upsert('active_project', { groupId, projectId });
}
