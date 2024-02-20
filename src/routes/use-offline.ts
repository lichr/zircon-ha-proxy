import express from 'express';
import _ from 'lodash';
import { Bundler } from '../bundler';
import { offlinePageConfig } from './offline-page-config';


const pathRegex = /^\/(?<path>.*)$/;

export function useOffline(bundler: Bundler) {
  const router = express.Router();
  router.get('/designer/config/page.json', offlinePageConfig());
  router.get('/viewer/config/page.json', offlinePageConfig());

  router.use(
    '/api',
    async (req, res) => {
      // include query string
      const path = req.url.match(pathRegex)?.groups?.path;
      if (path) {
        const r = await bundler.getResource(`api/${path}`);
        console.log('>>>> get resource: ', r?.url);
        if (r) {
          _.each(
            r.headers,
            (value, key) => {
              res.setHeader(key, value);
            }
          );
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
        const r = await bundler.getResource(path);
        console.log('>>>> get resource: ', r?.url);
        if (r) {
          _.each(
            r.headers,
            (value, key) => {
              res.setHeader(key, value);
            }
          );
          res.end(r.body);
          return;
        }
      }
      res.status(404).send('Not found');
    }
  );

  return router;
}
