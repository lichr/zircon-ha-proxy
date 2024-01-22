import { Express } from 'express';
import { Options, createProxyMiddleware } from 'http-proxy-middleware';

export function useZirconProxy(app: Express, baseUrl: string, agent?: any) {

  // make default proxy options
  const proxyOptions: Options = {
    target: baseUrl, // Target host
    changeOrigin: true, // Needed for virtual hosted sites
    ws: false,
    secure: true,
    agent,
    logLevel: 'debug'
  };

  // proxy to zircon services
  app.use(
    '/api',
    createProxyMiddleware(proxyOptions)
  );

  // app.use(
  //   '/mpi',
  //   createProxyMiddleware(proxyOptions)
  // );

  app.use(
    '/xpi',
    createProxyMiddleware(proxyOptions)
  );

  // proxy to zircon designer page
  app.use(
    '/',
    createProxyMiddleware({
      ...proxyOptions,
      pathRewrite: {
        '^/': '/designer/'
      }
    })
  );

}
