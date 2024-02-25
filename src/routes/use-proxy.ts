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
    '/api/user_info',
    async (req, res, next) => {
      try {
        const data = await core.getUserInfo();
        if (data) {
          res.json(data);
        } else {
          res.status(404).json({ status: 'no user' });
        }
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/api/active_project_info',
    async (req, res, next) => {
      try {
        const data = await core.getActiveProjectInfo();
        if (data) {
          res.json(data);
        } else {
          res.status(404).json({ status: 'no active project' });
        }
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
