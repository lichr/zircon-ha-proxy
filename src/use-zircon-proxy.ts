import { Express } from 'express';
import { Options, createProxyMiddleware } from 'http-proxy-middleware';

export function useZirconProxy(app: Express, baseUrl: string, agent?: any) {

  // make default proxy options
  const proxyOptions: Options = {
    target: baseUrl, // Target host
    changeOrigin: true, // Needed for virtual hosted sites
    ws: true,
    secure: true,
    agent,
    logLevel: 'debug'
  };

  // proxy to zircon services
  app.use(
    '/zircon',
    createProxyMiddleware({
      ...proxyOptions,
      pathRewrite: {
        '^/zircon': ''
      }
    })
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
