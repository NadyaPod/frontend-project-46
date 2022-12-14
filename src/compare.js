import { readFileSync } from 'fs';
import path from 'path';
import { cwd } from 'process';
import _ from 'lodash';
import parser from './parsers.js';
import getFormatter from '../formatters/index.js';
import {
  plus, minus, eq, upd,
} from './symbols.js';

const getFullPath = (filePath) => path.resolve(cwd(), filePath);

const getFileData = (filePath) => {
  try {
    return readFileSync(getFullPath(filePath), 'utf-8');
  } catch {
    throw new Error('Sorry, can\'t find the file');
  }
};

const getFileType = (filePath) => {
  const extension = path.extname(filePath);
  return extension.slice(1);
};

export const diff = (minuend, subtrahend) => {
  const keys = _.sortBy(_.union(Object.keys(minuend), Object.keys(subtrahend)));

  const difference = keys.map((key) => {
    if (!_.has(minuend, key)) {
      return ([plus, key, subtrahend[key], undefined]);
    }
    if (!_.has(subtrahend, key)) {
      return ([minus, key, minuend[key], undefined]);
    }
    if (minuend[key] !== subtrahend[key]) {
      if (_.isObject(minuend[key]) && _.isObject(subtrahend[key])) {
        const child = diff(minuend[key], subtrahend[key]);
        return ([eq, key, child, undefined]);
      }
      return ([upd, key, minuend[key], subtrahend[key]]);
    }
    return ([eq, key, minuend[key], undefined]);
  });
  return difference;
};

export default (filePath1, filePath2, format = 'stylish') => {
  const minuend = getFileData(filePath1);
  const minuendExt = getFileType(getFullPath(filePath1));
  const minuendParsed = parser(minuend, minuendExt);

  const subtrahend = getFileData(filePath2);
  const subtrahendExt = getFileType(getFullPath(filePath2));
  const subtrahendParsed = parser(subtrahend, subtrahendExt);
  const formatter = getFormatter(format);
  return formatter(diff(minuendParsed, subtrahendParsed));
};
