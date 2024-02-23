import express from 'express';
import { Bundler } from '../services';
import { IOptions } from '../types';
import { proxyUiPageConfig } from './proxy-ui-page-config';

export function useProxy(
  options: IOptions,
  bundler: Bundler
) {
  const router = express.Router();
  router.get('/config/page.json', proxyUiPageConfig(options));

  router.get(
    '/api/active-project',
    async (req, res) => {
    }
  );

  router.get(
    '/api/projects',
    async (req, res) => {
    }
  );

  router.put(
    '/api/project',
    async (req, res) => {
    }
  );

}
