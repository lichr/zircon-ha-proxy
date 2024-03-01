import _ from 'lodash';
import { ILocalProject } from '../../db';
import { IProjectEntry, IProjectInfo } from '../../types';

export interface IBranch {
  name(): string;
  updateTime(): string;
}

export class OnlineBranch implements IBranch {
  raw: any;
  constructor(raw: any) {
    this.raw = raw;
  }
  name(): string {
    return this.raw.info.name;
  }
  updateTime(): string {
    return this.raw.info.updateTime;
  }
}

export class LocalBranch implements IBranch {
  raw: ILocalProject;
  constructor(raw: any) {
    this.raw = raw;
  }
  name(): string {
    return this.raw.name;
  }
  updateTime(): string {
    return this.raw.updateTime;
  }
}

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
      name: this.localBranch?.name() ?? this.onlineBranch?.name() ?? null,
      updateTime: this.localBranch?.updateTime() ?? this.onlineBranch?.updateTime() ?? null
    }
  }
}
