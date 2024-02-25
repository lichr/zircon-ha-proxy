import express from 'express';
import _ from 'lodash';
import { ProxyCore } from '../services';
import { offlinePageConfig } from './offline-page-config';
import { IOptions } from '../types';


const pathRegex = /^\/(?<path>.*)$/;

export function useOffline(options: IOptions, core: ProxyCore) {
  const router = express.Router();
  router.get('/designer/config/page.json', offlinePageConfig(options));
  router.get('/viewer/config/page.json', offlinePageConfig(options));

  router.use(
    '/api',
    async (req, res) => {
      // include query string
      const path = req.url.match(pathRegex)?.groups?.path;
      if (path) {
        const r = await core.bundler.getResource(`api/${path}`);
        console.log('>>>> get resource: ', r?.url);
        if (r) {
          _.each(
            r.headers,
            (value, key) => {
              res.setHeader(key, value);
            }
          );
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.end(r.body);
          return;
        }
      }
      res.status(404).send('Not found');
    }
  );

  router.use(
    '/',
    async (req, res) => {
      // ignore query string
      const path = req.path.match(pathRegex)?.groups?.path;
      if (path) {
        const r = await core.bundler.getResource(path);
        console.log('>>>> get resource: ', r?.url);
        if (r) {
          _.each(
            r.headers,
            (value, key) => {
              res.setHeader(key, value);
            }
          );
          res.setHeader('Access-Control-Allow-Origin', '*');
          // encourage browser to cache s3 resources
          if (path.startsWith('s3/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
          res.end(r.body);
          return;
        }
      }
      res.status(404).json({ code: 'resource-not-found', data: { path } });
    }
  );

  return router;
}
