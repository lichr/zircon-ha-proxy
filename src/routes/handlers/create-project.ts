import { IDesignerDependencies, ProjectPackage, makeNewProject } from '../../schema';
import { ProxyCore } from '../../services';
import { pushProject } from './push-project';
import { setActiveProject } from './set-active-project';

export async function createProject(
  core: ProxyCore,
  props: {
    groupId: string;
    name: string;
    localOnly: boolean;
    setActive: boolean;
  }
) {
  const { groupId, name, localOnly, setActive } = props;
  const session = core.zirconClient.getSession();

  // get designer dependencies
  const deps = await session.apiGet<IDesignerDependencies>(`pub/methods/load_designer_deps`, { params: { group: groupId } });

  // make new project entity
  const pack = new ProjectPackage({ ...deps, ...makeNewProject({ groupId, name }) });

  // create offline bundle from project entity
  const manifest = pack.makeBundleManifest();
  await core.bundler.createBundle(manifest);
  console.log('>>>>>>>>> bundle created');

  // push it to online branch
  if (!localOnly) {
    try {
      await pushProject(core, pack);
    } catch (e) {
      console.error('>>> error creating online branch', e);
    }
  }

  // set as active project
  if (setActive) {
    await setActiveProject(core, groupId, pack.projectId());
  }
}
