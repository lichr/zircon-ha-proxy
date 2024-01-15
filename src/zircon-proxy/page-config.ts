import axios from 'axios';
import { Request, Response } from 'express';
import _ from 'lodash';
import { Agent } from 'https'
import { IOptions } from '../types';

export function pageConfig(options: IOptions, agent?: Agent ) {
  const { baseUrl, email, password, group, project } = options;
  return async (req: Request, res: Response) => {
    try {
      // get ingress path from header
      const ingressPath = req.headers['x-ingress-path'];
      const response = await axios.get(`${baseUrl}/designer/config/page.json`, {
        httpsAgent: agent
      });
  
      // Add login info to received JSON data
      const modifiedData = {
        ...response.data,
        page: {
          baseUrl: ingressPath ?? '/',
          apiBaseUrl: 'zircon/api',
          xpiBaseUrl: 'zircon/xpi',
          "mpi": {
            "mode": "proxy",
            "config": {
              "url": `ws://${ingressPath ?? 'localhost:3100'}/mpi/ws`
            }
          }           
        },
        // set for auto login
        autoLogin: {
          name: email,
          password
        },
        // set project and group
        location: {
          group,
          project
        }
      };
  
      res.json(modifiedData);
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred.');
    }
  }
}
