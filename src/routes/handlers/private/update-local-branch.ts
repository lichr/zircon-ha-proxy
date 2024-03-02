import { produce } from 'immer';
import { ILocalBranchData } from '../../../schema';
import { ProxyCore } from '../../../services';
import { makeNow } from '../../../tools';

export function _updateLocalBranch(
  core: ProxyCore,
  props: {
    groupId: string;
    projectId: string;
    name: string;
    localOnly: boolean;
    active: boolean;
    localBranch: ILocalBranchData;
  }
) {
  const { groupId, projectId, name, localOnly, active, localBranch } = props;
  const db = core.getDb();
  const now = makeNow();

  // update project entry
  if (localOnly !== localBranch.entry.localOnly) {
    const next = produce(
      localBranch.entry,
      draft => {
        draft.localOnly = localOnly;
      }
    );
    db.projectEntry.upsert(next);
  }

  // update project
  if (name !== localBranch.project.info.name) {
    const next = produce(
      localBranch.project,
      draft => {
        draft.info.name = name;
        draft.info.updateTime = now;
      }
    );
    core.bundler.savePart(localBranch.entry.bundleId, 'project', next);
  }

  // set active
  if (active !== localBranch.active) {
    db.setting.upsert('active_project', { groupId, projectId })
  }
}
