import { Agent } from 'https';
import { IOptions, IUserInfo } from '../../types';
import { Bundler } from '../bundler';
import { makeAgentPemStrings } from '../../tools';
import { ZirconClient, ZirconSession } from '../zircon-client';
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
  settings: Settings;
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
    this.settings = new Settings(() => this.db);

    // create zircon client
    const clientConfig = {
      db: () => this.db,
      clientCert: options.zircon.clientCert
    };
    this.zirconClient = new ZirconClient(clientConfig, this.settings);

    // create bundler
    this.bundler = new Bundler(
      {
        db: () => this.db,
        client: () => this.zirconClient
      },
      this.settings
    );
  }

  async init() {
    await this.db.init();
    await this.settings.load();
    await this.zirconClient.init();
  }

  async getUserInfo(): Promise<IUserInfo | null> {
    const user = this.settings.user();
    const accessToken = await this.db.setting.get('access_token');
    if (accessToken) {
      const tokenId: string = accessToken.split('.')[0];
      return {
        ...user,
        tokenId
      };
    }
    return null
  }

  async getActiveProject() {
    const data = await this.db.setting.get('active_project');
    return data ?? null;
  }

  async setActiveProject(groupId: string, projectId: string) {
    await this.db.setting.upsert('active_project', { groupId, projectId });
  }

  async _getProjects() {
    const session = this.zirconClient.getSession();
    // do parallel requests
    const [onlineProjects, localProjects] = await Promise.all([
      // get online projects from zircon api
      session.apiGet('pub/current_user/projects'),
      // get offline projects from local store
      this.bundler.getLocalProjects()
    ]);
    return { onlineProjects, localProjects };
  }

  async getActiveProjectInfo() {
    const currentProject = await this.getActiveProject();
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
    const currentProject = await this.getActiveProject();

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
