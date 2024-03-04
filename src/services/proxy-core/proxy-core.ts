import { Agent } from 'https';
import { IOptions } from '../../types';
import { Bundler } from '../bundler';
import { makeAgentPemStrings } from '../../tools';
import { IZirconClientConfig, ZirconClient } from '../zircon-client';
import _ from 'lodash';
import { ZirconDB, getLocalProject, getLocalProjects } from '../../db';
import { Settings } from '../settings';
import { IOnlineBranchData, IProjectEntity, IProjectPackage, ProjectPackage } from '../../schema';
import { OnlineBranch } from './online-branch';
import { LocalBranch } from './local-branch';

export class ProxyCore {
  options: IOptions;
  db: ZirconDB;
  bundler: Bundler;
  zirconClient: ZirconClient;
  getDb = () => this.db;
  getSettings = async () => {
    const settings = new Settings(this.getDb);
    await settings.load();
    return settings;
  }
  agent: Agent | null = null;

  constructor(options: IOptions) {
    this.options = options;

    // make https agent if client-certificate is provided
    const { zircon: { clientCert } } = options;
    if (clientCert) {
      this.agent = makeAgentPemStrings(clientCert.key, clientCert.cert);
    }

    // create zircon db
    this.db = new ZirconDB(options.database);

    // create zircon client
    const clientConfig: IZirconClientConfig = {
      zirconBaseUrl: options.zircon.baseUrl,
      db: () => this.db,
      clientCert: options.zircon.clientCert
    };
    this.zirconClient = new ZirconClient(clientConfig, this.getSettings);

    // create bundler
    this.bundler = new Bundler(
      {
        db: () => this.db,
        client: () => this.zirconClient
      },
      this.getSettings
    );
  }

  async init() {
    await this.db.init();
    await this.zirconClient.init();
  }

  async getProjectEntry(projectId: string) {
    const entry = await this.getDb().projectEntry.get(projectId);
    return entry;
  }

  // active project
  async activeProjectId(): Promise<{ groupId: string, projectId: string } | null> {
    return this.db.setting.get('active_project');
  }

  async activeBundle() {
    const active = await this.activeProjectId();
    if (active) {
      return await this.bundler.getBundle(active.projectId);
    }
    throw new Error('No active project');
  }

  async isActiveProject(projectId: string) {
    const active = await this.activeProjectId();
    return active?.projectId === projectId;
  }

  // local branches
  async getLocalBranches() {
    const data = await getLocalProjects(this.getDb().getDB());
    const branches = _.map(data, (d) => new LocalBranch(d));
    return branches;
  }

  async getLocalBranch(projectId: string) {
    const data = await getLocalProject(this.getDb().getDB(), projectId);    
    return data ? new LocalBranch(data) : null;
  }

  // project entry
  async deleteProjectEntry(projectId: string) {
    return await this.getDb().projectEntry.delete(projectId);
  }

  // online branches
  async getOnlineBranch(groupId: string, projectId: string): Promise<OnlineBranch | null> {
    const session = this.zirconClient.session;
    if (session) {
      try {
        const project = await session.apiGet<IProjectEntity>(
          `pub/groups/${groupId}/projects/${projectId}`
        )
        return new OnlineBranch({
          groupId,
          projectId,
          project
        });
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  async getOnlineBranches(): Promise<OnlineBranch[]> {
    const session = this.zirconClient.session;
    if (session) {
      try {
        const r = await session.apiGet<IProjectEntity[]>(
          'pub/current_user/projects'
        )
        return _.map(
          r,
          (project) => new OnlineBranch({
            groupId: project.project.group,
            projectId: project.info.id,
            project
          })
        );
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  async updateOnlineBranch(groupId: string, projectId: string, project: IProjectEntity) {
    const session = this.zirconClient.getSession();
    await session.apiPut(
      `pub/groups/${groupId}/projects/${projectId}`,
      project
    );
  }

  async deleteOnlineBranch(groupId: string, projectId: string) {
    const session = this.zirconClient.getSession();
    // api should delete the project and all related data
    // including: space-plans, dashboards, etc.
    await session.apiDelete(
      `pub/groups/${groupId}/projects/${projectId}`
    );
  }

  async pushBranch(groupId: string, projectId: string) {
    const session = this.zirconClient.getSession();

    const pack = await this.getLocalProjectPackage(projectId);
    const planId = pack.planId();

    await session.apiPut(
      `pub/groups/${groupId}/projects/${projectId}`,
      pack.data.project
    );
  
    await session.apiPut(
      `pub/groups/${groupId}/projects/${projectId}/space_plans/${planId}`,
      pack.data.spacePlan
    );    
  }

  async pullBranch(groupId: string, projectId: string) {
    const session = this.zirconClient.getSession();
    const packageData = await session.apiGet<IProjectPackage>(
      `pub/methods/load_designer`,
      { params: { group: groupId, project: projectId } }
    );
    const pack = new ProjectPackage(packageData);
    const manifest = pack.makeBundleManifest();
    return await this.bundler.createBundle(manifest);
  }

  async getLocalProjectPackage(projectId: string) {
    const bundle = await this.bundler.getBundle(projectId);
    const data: IProjectPackage = {
      project: await bundle.getJson('parts/project'),
      spacePlan: await bundle.getJson('parts/spacePlan'),
      user: await bundle.getJson('parts/user'),
      group: await bundle.getJson('parts/group'),
      tags: await bundle.getJson('parts/tags'),
      tagGroups: await bundle.getJson('parts/tagGroups'),
      quotas: await bundle.getJson('parts/quotas'),
      system: await bundle.getJson('parts/system'),
    } ;
    return new ProjectPackage(data);
  }

  /**
   * NOTE: this function should not fail that's why we catch errors fro each step
   */
  async checkBranches(groupId: string, projectId: string) {
    const entry = await this.getProjectEntry(projectId);
    const localBranch = await this.getLocalBranch(projectId);
    const onlineBranch = await this.getOnlineBranch(groupId, projectId);
    const isLocalOnly = entry?.localOnly ?? false;

    if (!localBranch && onlineBranch) {
      // pull from online
      try {
        await this.pullBranch(groupId, projectId);
      } catch (e) {
        console.error('>>>>>> error pulling branch: ', e);
      }
    }

    if (localBranch && !onlineBranch && !isLocalOnly) {
      // push to online
      try {
        await this.pushBranch(groupId, projectId);
      } catch (e) {
        console.error('>>>>>> error pushing branch: ', e);
      }
    }

    if (onlineBranch && isLocalOnly) {
      try {
        // delete online
        await this.deleteOnlineBranch(groupId, projectId);
      } catch (e) {
        console.error('>>>>>> error deleting online branch: ', e);
      } 
    }
  }
}
