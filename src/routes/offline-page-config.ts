import { Request, Response } from 'express';
import { ProxyCore } from '../services';

export function offlinePageConfig(core: ProxyCore): any {
  return async (req: Request, res: Response) => {
    const config = {
      mode: 'offline',
      page: {
        baseUrl: "/offline",
        apiBaseUrl: "/offline/api",
        xpiBaseUrl: "/offline/xpi",
        mpi: {
          mode: "proxy",
          config: {
            url: "/mpi/ws"
          }
        }
      },
      project: {
        groupId: core.settings.groupId(),
        projectId: core.settings.projectId()
      }      
    };
    // prevent caching
    res.setHeader('Cache-Control', 'no-store');
    res.json(config);
  }
}
