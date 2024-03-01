import { ILocalProject } from '../../schema';
import { IBranch } from './types';

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
