import { ILocalProject, ILocalBranchData } from '../../schema';
import { IBranch } from './types';

export class LocalBranch implements IBranch {
  data: ILocalBranchData;
  constructor(data: ILocalBranchData) {
    this.data = data;
  }

  groupId(): string {
    return this.data.groupId;
  }

  projectId(): string {
    return this.data.projectId;
  }

  name(): string {
    return this.data.project.info.name;
  }

  updateTime(): string {
    return this.data.spacePlan.info.updateTime;
  }
}
