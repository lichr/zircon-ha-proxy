import { Request, Response } from 'express';
import { ProxyCore } from '../services';

export function activePageConfig(core: ProxyCore): any {
  return async (req: Request, res: Response) => {
    const settings = await core.getSettings();
    const config = {
      mode: 'active',
      page: {
        baseUrl: "/active",
        apiBaseUrl: "/active/api",
        xpiBaseUrl: "/active/xpi",
        mpi: {
          mode: "proxy",
          config: {
            path: "/mpi/ws"
          }
        }
      },
      project: {
        groupId: settings.groupId(),
        projectId: settings.projectId()
      }      
    };
    // prevent caching
    res.setHeader('Cache-Control', 'no-store');
    res.json(config);
  }
}
