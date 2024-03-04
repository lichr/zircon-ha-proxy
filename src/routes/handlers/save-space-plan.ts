
import _ from 'lodash';
import { ProxyCore } from '../../services';
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
  const deps = await session.apiGet<IDesignerDependencies>(
    `pub/methods/load_designer_deps`,
    {
      params: {
        group: groupId
      }
    }
  );
  const bundle = await core.activeBundle();
  const project = await bundle.getJson('parts/project');
  const pack = new ProjectPackage({ ...deps, project, spacePlan });

  // create new bundle
  const manifest = pack.makeBundleManifest();

  // upsert bundle
  const nb = await core.bundler.createBundle(manifest);

  // set active bundle for this project
  let entry = await core.getDb().projectEntry.get(projectId);
  if (entry) {
    entry.bundleId = nb.id;
  } else {
    // in most cases this should not happen
    entry = {
      projectId,
      groupId,
      localOnly: false,
      bundleId: nb.id
    }
  }
  core.getDb().projectEntry.upsert(entry);

  // prune old bundles
  core.bundler.pruneByProject(projectId, nb.id);

  // save to online branch if not local only
  if (!entry.localOnly) {
    await core.pushBranch(groupId, projectId);
  }
}