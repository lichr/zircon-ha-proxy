import { IBundle } from './bundle';
import { IProjectEntity, ISpacePlanEntity, IGroupEntity, ISpaceEntity } from './zircon-entities';


export interface IProjectLocation {
  groupId: string;
  projectId: string;
}

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
  name: string | null;
  updateTime: string | null;
}

export interface IProjectEntry {
  projectId: string;
  groupId: string;
  localOnly: boolean;
  bundleId: string;
}

export interface ILocalBranchData {
  groupId: string;
  projectId: string;
  active: boolean;
  entry: IProjectEntry;
  bundle: IBundle;
  project: IProjectEntity;
  spacePlan: ISpacePlanEntity;
}

export interface IOnlineBranchData {
  groupId: string;
  projectId: string;
  project: IProjectEntity;
}
