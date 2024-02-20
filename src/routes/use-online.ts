import { Express } from 'express';
import { Options, createProxyMiddleware } from 'http-proxy-middleware';
import { onlinePageConfig } from './online-page-config';
import { IOptions } from '../types';
import _ from 'lodash';

export function useOnline(
  app: Express,
  options: IOptions,
  agent?: any
) {
  const { zircon: { baseUrl } } = options;

  app.get('/online/designer/config/page.json', onlinePageConfig(options, agent));
  app.get('/online/viewer/config/page.json', onlinePageConfig(options, agent));


  // make default proxy options
  const proxyOptions: Options = {
    target: baseUrl, // Target host
    changeOrigin: true, // Needed for virtual hosted sites
    ws: false,
    secure: true,
    agent,
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
