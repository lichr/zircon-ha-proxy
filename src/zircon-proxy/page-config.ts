import axios from 'axios';
import { Request, Response } from 'express';
import _ from 'lodash';
import { Agent } from 'https'
import { IOptions } from '../types';

export function pageConfig(options: IOptions, agent?: Agent ) {
  const { zircon: { baseUrl, email, password, group, project, mpiUrl }} = options;
  return async (req: Request, res: Response) => {
    try {
      const ingressPath = req.headers['x-ingress-path'];
      const response = await axios.get(`${baseUrl}/designer/config/page.json`, {
        httpsAgent: agent
      });

      console.log('>>> original page config: ', response.data);
      console.log('>>> ingressPath: ', ingressPath);
      console.log('>>> headers: ', req.headers);

      // Add login info to received JSON data
      const pageConfig = response.data;
      const pageBaseUrl = ingressPath ?? ''
      pageConfig.page.baseUrl = pageBaseUrl;

      // override api, xpi and mpi config
      pageConfig.page.apiBaseUrl = `${pageBaseUrl}/api`;
      pageConfig.page.xpiBaseUrl = `${pageBaseUrl}/xpi`;
      pageConfig.page.mpi = {
        "mode": "proxy",
        "config": {
          "path": `${pageBaseUrl}/mpi/ws`,
          "url": mpiUrl
        }
      };

      // auto-login: user don't need to login
      pageConfig.page.autoLogin = {
        name: email,
        password
      };

      // auto-location: user don't need to specify group and project in url
      pageConfig.project = {
        groupId: group,
        projectId: project
      };

      res.json(pageConfig);
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred.');
    }
  }
}
