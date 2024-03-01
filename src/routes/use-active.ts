import { Express, NextFunction, Request, Response, json } from 'express';
import { Options, createProxyMiddleware } from 'http-proxy-middleware';
import { activePageConfig } from './active-page-config';
import _ from 'lodash';
import { ProxyCore } from '../services';
import { loadDesigner, saveSpacePlan } from './handlers';

export function useActive(
  app: Express,
  core: ProxyCore
) {
  const { zircon: { baseUrl } } = core.options;
  const jsonParser = json();

  const setAuth = async (req: Request, res: Response, next: NextFunction) => {
    // set id token
    const idToken = await core.zirconClient.getIdToken();
    if (idToken) {
      req.headers['Authorization'] = `Bearer ${idToken}`;
    }
    next();
  }

  // PART I: local resources
  app.get('/active/designer/config/page.json', activePageConfig(core));
  app.get('/active/viewer/config/page.json', activePageConfig(core));

  // viewers

  // access local data
  app.get(
    '/active/api/pub/methods/load_designer',
    async (req, res, next) => {
      try {
        const pack = await loadDesigner(core);
        res.json(pack);
      } catch (error) {
        next(error);
      }
    }
  );

  // save space plan
  app.put(
    '/active/api/pub/groups/:groupId/projects/:projectId/space_plans/:planId',
    jsonParser,
    async (req, res, next) => {
      try {
        const { body, params: { groupId, projectId, planId }} = req;
        await saveSpacePlan(
          core,
          {
          groupId,
          projectId,
          planId,
          spacePlan: body
        });
        res.json({ status: 'ok', message: 'space-plan saved' });
      } catch (error) {
        next(error);
      }
    }
  )


  // PART II: proxy to online services
  // make default proxy options
  const proxyOptions: Options = {
    target: baseUrl, // Target host
    changeOrigin: true, // Needed for virtual hosted sites
    ws: false,
    secure: true,
    agent: core.agent,
    logLevel: 'warn',
    onProxyRes: (proxyRes, req, res) => {
      // set cors to allow all origins
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    }
  };

  // proxy to zircon services
  app.use(
    '/active/api',
    setAuth,
    createProxyMiddleware({
      ...proxyOptions,
      pathRewrite: { '^/active/': '/' }
    })
  );

  app.use(
    '/active/xpi',
    setAuth,
    createProxyMiddleware({
      ...proxyOptions,
      pathRewrite: { '^/active/': '/' }
    })
  );

  // proxy to zircon designer page
  app.use(
    '/active/',
    setAuth,
    createProxyMiddleware({
      ...proxyOptions,
      pathRewrite: { '^/active/': '/' }
    })
  );

  return app;
}
