import { makeNow, makeUid } from '../tools';
import { IProjectData } from './project';


export function makeNewProject(
  props: {
    groupId: string;
    name: string;
  }
): IProjectData {
  const { groupId, name } = props;
  const projectId = makeUid();
  const spacePlanId = makeUid();
  const siteId = makeUid();
  const now = makeNow();  

  return {
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
    }    
  }
}
