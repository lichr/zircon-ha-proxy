import { IBranch } from './types';

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
