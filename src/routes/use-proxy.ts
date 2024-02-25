import express from 'express';
import { ProxyCore } from '../services';
import { IOptions } from '../types';
import { proxyUiPageConfig } from './proxy-ui-page-config';

export function useProxy(
  options: IOptions,
  core: ProxyCore
) {
  const router = express.Router();
  router.get('/config/page.json', proxyUiPageConfig(options));

  router.get(
    '/api/active-project',
    async (req, res) => {
    }
  );

  router.get(
    '/api/projects',
    async (req, res) => {
      const projects = await core.getProjects();
      res.json(projects);
    }
  );

  router.put(
    '/api/project',
    async (req, res) => {
    }
  );

  return router;
}
