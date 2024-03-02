import { Agent } from 'https';
import { IOptions } from '../../types';
import { Bundler } from '../bundler';
import { makeAgentPemStrings } from '../../tools';
import { IZirconClientConfig, ZirconClient } from '../zircon-client';
import _ from 'lodash';
import { ZirconDB, getLocalProject, getLocalProjects } from '../../db';
import { Settings } from '../settings';
import { IOnlineBranchData, IProjectEntity } from '../../schema';
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

  async getActiveProjectId(): Promise<{ groupId: string, projectId: string } | null> {
    return this.db.setting.get('active_project');
  }

  async isActiveProject(projectId: string) {
    const active = await this.getActiveProjectId();
    return active?.projectId === projectId;
  }

  async getLocalBranches() {
    const data = await getLocalProjects(this.getDb().getDB());
    const branches = _.map(data, (d) => new LocalBranch(d));
    return branches;
  }

  async getProjectEntry(projectId: string) {
    const entry = await this.getDb().projectEntry.get(projectId);
    return entry;
  }

  async getLocalBranch(projectId: string) {
    const data = await getLocalProject(this.getDb().getDB(), projectId);    
    return data ? new LocalBranch(data) : null;
  }

  async getOnlineBranch(groupId: string, projectId: string): Promise<OnlineBranch | null> {
    const session = this.zirconClient.session;
    if (session) {
      try {
        const r = await session.apiGet(
          `pub/methods/load_designer?group=${groupId}&project=${projectId}`
        )
        return new OnlineBranch({
          groupId,
          projectId,
          project: r.project,
          // spacePlan: r.spacePlan
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

  async updateOnlineProject(groupId: string, projectId: string, project: IProjectEntity) {
    const session = this.zirconClient.getSession();
    await session.apiPut(
      `pub/groups/${groupId}/projects/${projectId}`,
      project
    );
  }

}
