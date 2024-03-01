import { IProjectEntity, ISpacePlanEntity, IGroupEntity } from './zircon-entities';

export interface IProjectData {
  project: IProjectEntity;
  spacePlan: ISpacePlanEntity;
}

export interface IProjectPackage {
  project: IProjectEntity;
  spacePlan: ISpacePlanEntity;
  user: any;
  group: IGroupEntity;
  tags: Record<string, any>;
  tagGroups: Record<string, any>;
  quotas: any;
  system: any;
}

export interface ILocalProject {
  groupId: string;
  projectId: string;
  bundleId: string;
  name: string;
  updateTime: string;
}

export interface IDesignerDependencies {
  user: any;
  group: IGroupEntity;
  tags: Record<string, any>;
  tagGroups: Record<string, any>;
  quotas: any;
  system: any;
}

export interface IProjectInfo {
  groupId: string;
  projectId: string;
  active: boolean;
  localOnly: boolean;
  onlineBranch: boolean;
  localBranch: boolean;
  bundleId: string | null;
  name: string | null;
  updateTime: string | null;
}

export interface IProjectEntry {
  id: string;
  localOnly: boolean;
  bundleId?: string;
}
