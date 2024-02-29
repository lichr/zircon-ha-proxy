import { makeNow, makeUid } from '../../tools';
import { ProjectPackage } from './project-package';
import { IDesignerDependencies, IGroupEntity, IProjectPackage } from './types';

export function makeProjectPackage(
  props: {
    deps: IDesignerDependencies;
    name: string;
  }
): ProjectPackage {
  const { deps, name } = props;

  const groupId = deps.group.info.id;
  const projectId = makeUid();
  const spacePlanId = makeUid();
  const siteId = makeUid();
  const now = makeNow();

  const data: IProjectPackage = {
    ...deps,
    project: {
      info: {
        id: projectId,
        kind: 'project',
        name,
        status: 'normal',
        createTime: now,
        updateTime: now
      },
      members: {},
      project: {
        group: groupId,
        spacePlan: spacePlanId
      }
    },
    spacePlan: {
      info: {
        id: spacePlanId,
        kind: 'space_plan',
        name: name,
        status: 'normal',
        createTime: now,
        updateTime: now
      },
      plan: {
        isPrimary: true,
        project: projectId,
        root: siteId,
        spaces: {
          [siteId]: {
            info: {
              id: siteId,
              kind: 'space',
              name: 'Site',
              status: 'normal',
              createTime: now,
              updateTime: now
            },
            position: {
              type: 'identity'
            },
            shape: {
              type: 'identity'
            },
            space: {
              type: 'site'
            }
          }
        }
      }
    },
    tags: {},
    tagGroups: {}
  };
  return new ProjectPackage(data);
}
