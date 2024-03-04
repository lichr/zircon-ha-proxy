import { IDesignerDependencies, IProjectEntity, ProjectPackage, makeNewProject } from '../../schema';
import { LocalBranch, OnlineBranch, ProxyCore } from '../../services';
import { produce } from 'immer';
import { setActiveProject } from './set-active-project';
import { makeNow } from '../../tools';

export async function upsertProject(
  core: ProxyCore,
  props: {
    projectId?: string;
    groupId: string;
    name: string;
    localOnly: boolean;
    active: boolean;
  }
) {
  const { projectId, groupId, name, localOnly, active } = props;
  const session = core.zirconClient.getSession();
  const now = makeNow();
  let id: string;

  if (projectId) {
    id = projectId;
    const localBranch = await core.getLocalBranch(projectId);
    const onlineBranch = await core.getOnlineBranch(groupId, projectId);
    let bundleId: string;

    if (onlineBranch) {
      // update online branch
      const next = produce(
        onlineBranch.data.project,
        draft => {
          draft.info.name = name;
        }
      );
      await core.updateOnlineBranch(groupId, projectId, next);
    }

    // update local branch
    if (localBranch) {
      const bundle = await core.bundler.getBundle(projectId);
      bundleId = bundle.id;
      await bundle.updatePart<IProjectEntity>(
        'project',
        (draft) => {
          draft.info.name = name;
          draft.info.updateTime = now;
        }
      );
    } else if (onlineBranch) {
      // pull from online branch
      bundleId = (await core.pullBranch(groupId, projectId)).id;
    } else {
      throw new Error('Can not update project because it was not found locally or online');
    }

    if (localOnly && onlineBranch) {
      // delete online branch
      await core.deleteOnlineBranch(groupId, projectId);
    }

    if (!localOnly && !onlineBranch) {
      // push to online branch
      await core.pushBranch(groupId, projectId);
    }

    // upsert project entry
    core.getDb().projectEntry.upsert({ projectId, groupId, localOnly, bundleId });

  } else {
    // create new project
    // get designer dependencies
    const deps = await session.apiGet<IDesignerDependencies>(`pub/methods/load_designer_deps`, { params: { group: groupId } });

    // make new project entity
    const pack = new ProjectPackage({ ...deps, ...makeNewProject({ groupId, name }) });
    id = pack.projectId();

    // create offline bundle from project entity
    const manifest = pack.makeBundleManifest();
    const { id: bundleId } = await core.bundler.createBundle(manifest);

    // push it to online branch
    if (!localOnly) {
      try {
        await core.pushBranch(groupId, id);
      } catch (e) {
        console.error('>>> error creating online branch', e);
      }
    }

    // insert project entry
    core.getDb().projectEntry.upsert({ projectId: id, groupId, localOnly, bundleId });
  }

  // set as active project
  if (active) {
    await setActiveProject(core, groupId, id);
  }
}
