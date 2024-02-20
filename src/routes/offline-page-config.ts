import { Request, Response } from 'express';

export function offlinePageConfig(): any {
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
        groupId: "FrCOUUzBcuCS",
        projectId: "smxhtZa6arCt"
      }      
    };
    res.json(config);
  }
}
