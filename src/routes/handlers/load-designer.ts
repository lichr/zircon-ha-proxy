import { IProjectPackage, IDesignerDependencies } from '../../schema';
import { ProxyCore } from '../../services';

export async function loadDesigner(
  core: ProxyCore
): Promise<IProjectPackage> {
  // load designer dependencies from online api
  const session = core.zirconClient.getSession();
  const settings = await core.getSettings();
  const groupId = settings.groupId();
  const deps = await session.apiGet<IDesignerDependencies>(`pub/methods/load_designer_deps`, { params: { group: groupId } });

  // get data from local bundle
  const bundle = await core.activeBundle();
  const project = await bundle.getJson('parts/project');
  const spacePlan = await bundle.getJson('parts/spacePlan');

  // return
  return {
    ...deps,
    project,
    spacePlan,
  };
}
