
import _ from 'lodash';
import { ProxyCore } from '../../services';
import { pushProject } from './push-project';
import { IDesignerDependencies, ProjectPackage } from '../../schema';

export async function saveSpacePlan(
  core: ProxyCore,
  props: {
    groupId: string;
    projectId: string;
    planId: string;
    spacePlan: any;
  }
) {
  const { groupId, projectId, planId, spacePlan } = props;

  // make project package from space-plan
  const session = core.zirconClient.getSession();
  const deps = await session.apiGet<IDesignerDependencies>(`pub/methods/load_designer_deps`, { params: { group: groupId } });
  const project = await core.bundler.getResourceJson('parts/project');
  const pack = new ProjectPackage({ ...deps, project, spacePlan });

  // create new bundle
  const manifest = pack.makeBundleManifest();

  // upsert bundle
  const bundle = await core.bundler.createBundle(manifest);

  // set active bundle for this project
  let entry = await core.getDb().projectEntry.get(projectId);
  if (entry) {
    entry.bundleId = bundle.id;
  } else {
    // in most cases this should not happen
    entry = {
      id: projectId,
      localOnly: false,
      bundleId: bundle.id
    }
  }
  core.getDb().projectEntry.upsert(entry);

  // prune old bundles
  core.bundler.pruneByProject(projectId, bundle.id);

  // save to online branch if not local only
  if (!entry.localOnly) {
    await pushProject(core, pack);
  }
}