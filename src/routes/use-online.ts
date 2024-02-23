import { Express } from 'express';
import { Options, createProxyMiddleware } from 'http-proxy-middleware';
import { onlinePageConfig } from './online-page-config';
import _ from 'lodash';
import { ProxyCore } from '../services';

export function useOnline(
  app: Express,
  core: ProxyCore
) {
  const { zircon: { baseUrl } } = core.options;

  app.get('/online/designer/config/page.json', onlinePageConfig(core.options, core.agent ?? undefined));
  app.get('/online/viewer/config/page.json', onlinePageConfig(core.options, core.agent ?? undefined));


  // make default proxy options
  const proxyOptions: Options = {
    target: baseUrl, // Target host
    changeOrigin: true, // Needed for virtual hosted sites
    ws: false,
    secure: true,
    agent: core.agent,
    logLevel: 'debug',
    onProxyRes: (proxyRes, req, res) => {
      // set cors to allow all origins
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    }
  };

  // proxy to zircon services
  app.use(
    '/online/api',
    createProxyMiddleware({
      ...proxyOptions,
      pathRewrite: {'^/online/' : '/'}
    })
  );

  app.use(
    '/online/xpi',
    createProxyMiddleware({
      ...proxyOptions,
      pathRewrite: {'^/online/' : '/'}
    })
  );

  // proxy to zircon designer page
  app.use(
    '/online/',
    createProxyMiddleware({
      ...proxyOptions,
      pathRewrite: {'^/online/' : '/'}
    })
  );

  return app;
}
