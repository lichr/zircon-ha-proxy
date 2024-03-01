import _ from 'lodash';
import { ILocalProject, IProjectEntry, IProjectInfo } from '../../schema';
import { LocalBranch } from './local-branch';
import { OnlineBranch } from './online-branch';

/**
 * local-branch has precedence over online-branch
 */
export class Project {
  groupId: string;
  projectId: string;
  onlineBranch: OnlineBranch | null = null;
  localBranch: LocalBranch | null = null;
  projectEntry: IProjectEntry | null = null;
  active: boolean = false;

  constructor(groupId: string, projectId: string) {
    this.groupId = groupId;
    this.projectId = projectId;
  }

  get(): IProjectInfo {
    return {
      groupId: this.groupId,
      projectId: this.projectId,
      active: this.active,
      localOnly: this.projectEntry?.localOnly ?? false,
      onlineBranch: !_.isNil(this.onlineBranch),
      localBranch: !_.isNil(this.localBranch),
      bundleId: this.projectEntry?.bundleId ?? null,
      name: this.localBranch?.name() ?? this.onlineBranch?.name() ?? null,
      updateTime: this.localBranch?.updateTime() ?? this.onlineBranch?.updateTime() ?? null
    }
  }
}
