import axios from 'axios';
import { Request, Response } from 'express';
import _ from 'lodash';
import { ProxyCore } from '../services';

export function onlinePageConfig(core: ProxyCore) {
  return async (req: Request, res: Response) => {
    try {
      const settings = await core.getSettings();
      const ingressPath = req.headers['x-ingress-path'];
      console.log('>>> ingressPath: ', ingressPath);

      const session = core.zirconClient.getSession();
      const pageConfig = await session.apiGet('designer/config/page.json', null, false);

      // Add login info to received JSON data
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
          "url": core.options.zircon.mpiUrl
        }
      };

      // auto-login: user don't need to login
      const zirconAccessToken = settings.accessToken();
      const [tokenId, token] = zirconAccessToken.split('.');
      // call zircon-api to get a firebase custom token, which can be used by app to login
      const customToken = (await session.apiPost(
        'pub/methods/make_custom_token',
        {
          id: tokenId,
          token
        }
      )).custom_token;
      pageConfig.page.autoLogin = {
        customToken
      };

      // auto-location: user don't need to specify group and project in url
      pageConfig.project = {
        groupId: settings.groupId(),
        projectId: settings.projectId()
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
