export interface IInfoComponent {
  id: string;
  kind: string;
  name: string;
  status: string;
  description?: string;
  createTime: string;
  updateTime: string;
}

export interface ISpaceEntity {
  info: IInfoComponent;
  position?: any;
  shape?: any;
  space: any;
}

export interface IPlanComponent {
  isPrimary: boolean;
  project: string;
  root: string;
  spaces: Record<string, ISpaceEntity>;
}

export interface IProjectEntity {
  info: IInfoComponent;
  members: Record<string, any>;
  project: {
    group: string;
    spacePlan: string;
  }
}

export interface ISpacePlanEntity {
  info: IInfoComponent;
  plan: IPlanComponent;
}

export interface IGroupEntity {
  info: IInfoComponent;
  group: {
    owner: string;
    type: string;
 }
}