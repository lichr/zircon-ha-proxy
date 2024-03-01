import { ProjectPackage, ProxyCore } from '../../services';

  // before pushing project to online branch, we need to make sure the local bundle is newer
  export async function pushProject(
    core: ProxyCore,
    pack: ProjectPackage
  ) {
    const session = core.zirconClient.getSession();
    const groupId = pack.groupId();
    const projectId = pack.projectId();
    const planId = pack.planId();

    const projectUrl = `pub/groups/${groupId}/projects/${projectId}`
    console.log('>>> push project to: ', projectUrl);
    await session.apiPut(
      projectUrl,
      pack.data.project
    );

    const planUrl = `pub/groups/${groupId}/projects/${projectId}/space_plans/${planId}`
    console.log('>>> push space-plan to: ', planUrl);
    await session.apiPut(
      planUrl,
      pack.data.spacePlan
    );
  }
