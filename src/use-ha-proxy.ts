import { Express } from 'express';
import { Options, createProxyMiddleware } from 'http-proxy-middleware';

export function useHaProxy(app: Express, baseUrl: string, agent?: any) {
  // make default proxy options
  const proxyOptions: Options = {
    target: baseUrl, // Target host
    changeOrigin: true, // Needed for virtual hosted sites
    ws: false,
    secure: false,
    agent,
    logLevel: 'debug'
  };

  // proxy to ha api
  app.use(
    '/ha/api',
    createProxyMiddleware({
      ...proxyOptions,
      pathRewrite: {
        '^/ha': ''
      }
    })
  );
}
