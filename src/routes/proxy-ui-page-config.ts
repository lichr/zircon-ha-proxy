import { Request, Response } from 'express';
import { IOptions } from '../types';


/**
 * Serve page config for proxy ui
 */
export function proxyUiPageConfig(options: IOptions): any {
  return async (req: Request, res: Response) => {
    const config = {
    };
    // prevent caching
    res.setHeader('Cache-Control', 'no-store');
    res.json(config);
  }
}
