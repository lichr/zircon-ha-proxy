import axios from 'axios';
import { Request, Response } from 'express';
import _ from 'lodash';
import { Agent } from 'https'
import { IOptions } from '../types';

export function onlinePageConfig(options: IOptions, agent?: Agent) {
  const { zircon: { baseUrl, zirconAccessToken, group, project, mpiUrl } } = options;
  return async (req: Request, res: Response) => {
    try {
      const ingressPath = req.headers['x-ingress-path'];
      const response = await axios.get(`${baseUrl}/designer/config/page.json`, {
        httpsAgent: agent
      });

      console.log('>>> ingressPath: ', ingressPath);

      // Add login info to received JSON data
      const pageConfig = response.data;
      const siteBaseUrl = ingressPath ?? '';
      const pageBaseUrl = `${siteBaseUrl}/online`
      pageConfig.page.baseUrl = pageBaseUrl;

      // override api, xpi and mpi config
      pageConfig.page.apiBaseUrl = `${pageBaseUrl}/api`;
      pageConfig.page.xpiBaseUrl = `${pageBaseUrl}/xpi`;
      pageConfig.page.mpi = {
        "mode": "proxy",
        "config": {
          "path": `${siteBaseUrl}/mpi/ws`,
          "url": mpiUrl
        }
      };

      // auto-login: user don't need to login
      const [tokenId, token] = zirconAccessToken.split('.');
      // call zircon-api to get a firebase custom token, which can be used by app to login
      const customToken = (
        await axios.post(
          `${baseUrl}/api/pub/methods/make_custom_token`,
          {
            id: tokenId,
            token
          },
          {
            httpsAgent: agent
          }
        )
      ).data.custom_token;

      pageConfig.page.autoLogin = {
        customToken
      };

      // auto-location: user don't need to specify group and project in url
      pageConfig.project = {
        groupId: group,
        projectId: project
      };

      // prevent caching
      res.setHeader('Cache-Control', 'no-store');
      res.json(pageConfig);
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred.');
    }
  }
}
