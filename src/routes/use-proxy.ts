import express from 'express';
import { ProxyCore } from '../services';
import { IOptions } from '../types';
import { proxyUiPageConfig } from './proxy-ui-page-config';

export function useProxy(
  options: IOptions,
  core: ProxyCore
) {
  const jsonParser = express.json();
  const router = express.Router();
  router.get('/config/page.json', proxyUiPageConfig(options));

  router.get(
    '/api/active_project',
    async (req, res, next) => {
      try {
        const data = await core.getActiveProject();
        res.json(data);
      } catch (error) {
        next(error);
      }
    }
  );

  router.put(
    '/api/active_project',
    jsonParser,
    async (req, res, next) => {
      try {
        const { groupId, projectId } = req.body;
        await core.setActiveProject(groupId, projectId);
        res.json({ status: 'ok' });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/api/projects',
    async (req, res, next) => {
      try {
        const projects = await core.getProjects();
        res.json(projects);
      } catch (error) {
        next(error);
      }      
    }
  );

  router.put(
    '/api/project',
    async (req, res, next) => {
    }
  );

  return router;
}
