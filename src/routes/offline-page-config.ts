import { Request, Response } from 'express';
import { IOptions } from '../types';

export function offlinePageConfig(options: IOptions): any {
  const { zircon: { group, project } } = options;

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
        groupId: group,
        projectId: project
      }      
    };
    // prevent caching
    res.setHeader('Cache-Control', 'no-store');
    res.json(config);
  }
}
