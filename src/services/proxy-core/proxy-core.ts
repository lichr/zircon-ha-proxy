import { Agent } from 'https';
import { IOptions, IUserInfo } from '../../types';
import { Bundler } from '../bundler';
import { makeAgentPemStrings } from '../../tools';
import { IZirconClientConfig, ZirconClient, ZirconSession } from '../zircon-client';
import { LocalBranch, OnlineBranch, Project } from './project';
import _ from 'lodash';
import { ZirconDB } from '../../db';
import { access } from 'fs-extra';
import { Settings } from '../settings';

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

    // create settings
    // this.settings = new Settings(() => this.db);
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

  async getUserInfo(): Promise<IUserInfo | null> {
    const settings = await this.getSettings();
    const user = settings.settings?.user ?? undefined;
    const accessToken = settings.settings?.access_token ?? undefined;
    const tokenId = accessToken?.split('.')[0];
    return {
      user,
      tokenId,
      session: !_.isNil(this.zirconClient.session)
    };
  }

  async setActiveProject(groupId: string, projectId: string) {
    await this.db.setting.upsert('active_project', { groupId, projectId });
  }

  async _getProjects() {
    // do parallel requests
    const [onlineProjects, localProjects] = await Promise.all([
      // get online projects from zircon api
      async () => {
        const session = this.zirconClient.session;
        if (session) {
          return await session.apiGet('pub/current_user/projects')
        };
        return {}
      },
      // get offline projects from local store
      this.bundler.getLocalProjects()
    ]);
    return { onlineProjects, localProjects };
  }

  async getActiveProjectInfo() {
    const settings = await this.getSettings();
    const currentProject = settings.settings?.active_project;
    if (currentProject) {

      const { groupId, projectId } = currentProject as { groupId: string, projectId: string };
      let project: Project | null = null;

      // get online and local projects
      const { onlineProjects, localProjects } = await this._getProjects();

      // find online project
      const onlineProject = _.find(
        onlineProjects,
        (project: any) => project.project.group === groupId && project.info.id === projectId
      );
      if (onlineProject) {
        project = new Project(groupId, projectId);
        project.onlineBranch = new OnlineBranch(onlineProject);
      }

      // find local project
      const localProject = _.find(
        localProjects,
        (project) => project.groupId === groupId && project.projectId === projectId
      );
      if (localProject) {
        if (!project) {
          project = new Project(groupId, projectId);
        }
        project.localBranch = new LocalBranch(localProject);
      }
      if (project) {
        return project.get();
      }
    }
    return null;
  }

  async getProjects() {
    const settings = await this.getSettings();
    const currentProject = settings.settings?.active_project;

    // for receiving projects
    const projects: Record<string, Project> = {};
    const makeProject = (groupId: string, projectId: string) => {
      const id = `${groupId}.${projectId}`;
      let project = projects[id];
      if (!project) {
        project = new Project(groupId, projectId);
        projects[id] = project;
      }
      return project;
    }

    // get online and local projects
    const { onlineProjects, localProjects } = await this._getProjects();

    // merge online and local projects
    _.each(
      onlineProjects,
      (project: any) => {
        const projectId = project.info.id;
        const groupId = project.project.group;
        makeProject(groupId, projectId).onlineBranch = new OnlineBranch(project);
      }
    );
    _.each(
      localProjects,
      (project) => {
        const { groupId, projectId } = project;
        makeProject(groupId, projectId).localBranch = new LocalBranch(project);
      }
    );

    // result
    return _.map(
      projects,
      (project) => {
        const data = project.get();
        return {
          ...data,
          active: data.groupId === currentProject?.groupId && data.projectId === currentProject?.projectId
        }
      }
    );
  }
}
