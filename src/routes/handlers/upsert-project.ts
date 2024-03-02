import { LocalBranch, OnlineBranch, ProxyCore } from '../../services';
import { _updateLocalBranch } from './private';
import { produce } from 'immer';

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
  const db = core.getDb();

  let localBranch: LocalBranch | null = null;
  let onlineBranch: OnlineBranch | null = null;
  if (projectId) {
    // update local branch
    localBranch = await core.getLocalBranch(projectId);
    if (localBranch) {
      _updateLocalBranch(core, { localBranch: localBranch.data, groupId, projectId, name, localOnly, active });
    }

    // get online branch
    onlineBranch = await core.getOnlineBranch(groupId, projectId);
    if (onlineBranch) {
      // update online branch
      const next = produce(
        onlineBranch.data.project,
        draft => {
          draft.info.name = name;
        }
      );
      // if local branch does NOT exists, pull from online branch
      if (!localBranch) {
        // pull from online branch
      }

    } else if (!localOnly) {
      // create online branch
    }


    // or push to online branch
  } else {
    // create new project

  }

  // new project
  // 1. create local branch
  // 2. push to online branch (if local-only is false)

  // update project
  // if found local branch
  // 1. update local branch
  // 2. push to online branch (if local-only is false)

  // if not found local branch
  // 1. upsert to online branch (project)
  // 2. pull from online branch

  // update local branch
}
