import { IOnlineBranchData } from '../../schema';
import { IBranch } from './types';

export class OnlineBranch implements IBranch {
  data: IOnlineBranchData;
  constructor(data: IOnlineBranchData) {
    this.data = data;
  }

  groupId(): string {
    return this.data.project.project.group;
  }

  projectId(): string {
    return this.data.project.info.id;
  }

  name(): string {
    return this.data.project.info.name;
  }
  updateTime(): string {
    // XXX: should return space-plan's updateTime
    return this.data.project.info.updateTime;
  }
}
