import express from 'express';
import { ProxyCore } from '../services';
import { proxyUiPageConfig } from './proxy-ui-page-config';
import { getActiveProjectInfo, getProjectInfo, getProjects, getUserInfo, upsertProject } from './handlers';
import { setAccessToken } from './handlers/set-access-token';
import { setActiveProject } from './handlers/set-active-project';

export function useProxy(
  core: ProxyCore
) {
  const jsonParser = express.json();
  const router = express.Router();
  router.get('/config/page.json', proxyUiPageConfig(core.options));

  router.put(
    '/api/access_token',
    jsonParser,
    async (req, res, next) => {
      try {
        const { accessToken } = req.body;
        // set access token and try to start a zircon session
        await setAccessToken(core, accessToken);

        // return user info
        const userInfo = await getUserInfo(core);
        if (userInfo) {
          res.json(userInfo);
        } else {
          res.status(404).json({ status: 'no user' });
        }
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/api/user_info',
    async (req, res, next) => {
      try {
        const data = await getUserInfo(core);
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
        const data = await getActiveProjectInfo(core);
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
        await setActiveProject(core, groupId, projectId);
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
        const projects = await getProjects(core);
        res.json(projects);
      } catch (error) {
        next(error);
      }      
    }
  );

  router.get(
    '/api/projects/:groupId/:projectId',
    async (req, res, next) => {
      try {
        const { groupId, projectId } = req.params;
        const projects = await getProjectInfo(core, groupId, projectId);
        res.json(projects);
      } catch (error) {
        next(error);
      }      
    }
  );

  router.put(
    '/api/upsert_project',
    jsonParser,
    async (req, res, next) => {
      try {
        const payload = req.body;
        await upsertProject(core, payload);
        res.json({ status: 'ok' });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
