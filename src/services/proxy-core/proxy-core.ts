import { Agent } from 'https';
import { IOptions } from '../../types';
import { Bundler } from '../bundler';
import { makeAgentPemStrings } from '../../tools';
import { ZirconClient } from '../zircon-client';
import { LocalBranch, OnlineBranch, Project } from './project';
import _ from 'lodash';

export class ProxyCore {
  options: IOptions;
  bundler: Bundler;
  zirconClient: ZirconClient;
  agent: Agent | null = null;

  constructor(options: IOptions) {
    this.options = options;

    // make https agent if client-certificate is provided
    const { zircon: { clientCert } } = options;
    if (clientCert) {
      this.agent = makeAgentPemStrings(clientCert.key, clientCert.cert);
    }

    // create zircon client
    const clientConfig = {
      zirconAccessToken: options.zircon.zirconAccessToken,
      baseUrl: options.zircon.baseUrl,
      group: options.zircon.group,
      project: options.zircon.project,
      clientCert: options.zircon.clientCert
    };
    this.zirconClient = new ZirconClient(clientConfig);
    this.bundler = new Bundler({
      db: { path: 'data/zircon.db' },
      client: () => this.zirconClient
    });
  }

  async init() {
    await this.bundler.init();
  }

  async getProjects() {
    const session = await this.zirconClient.makeSession();

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

    // do parallel requests
    const [onlineProjects, localProjects] = await Promise.all([
      // get online projects from zircon api
      session.apiGet('pub/current_user/projects'),
      // get offline projects from local store
      this.bundler.getLocalProjects()
    ]);
  
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
    return _.keyBy(
      _.map(
        projects,
        (project) => project.get()
      ),
      'uid'
    );
  }
}
