import fs from 'fs';
import _ from 'lodash';
import minimist from 'minimist';
import { IOptions } from './types';

export function useOptions(): IOptions {
  // parse command line arguments
  const argv = minimist(process.argv.slice(2));
  const optionFile = argv.options;
  if (_.isEmpty(optionFile)) {
    throw new Error('Please specify options file with --options option.');
  }
  const options = JSON.parse(fs.readFileSync(optionFile).toString()) as IOptions;

  return options;
}
