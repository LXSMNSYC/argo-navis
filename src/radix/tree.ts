/**
 * @license
 * MIT License
 *
 * Copyright (c) 2019 Alexis Munsayac
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 *
 * @author Alexis Munsayac <alexis.munsayac@gmail.com>
 * @copyright Alexis Munsayac 2019
 */
/**
 * Core dependency
 */
import RadixNode from './node';

/**
 * Exceptions
 */
import DuplicateError from './exceptions/duplicate-error';
import SharedKeyError from './exceptions/shared-key-error';

/**
 * Utilities
 */
import { Reader } from '../utils/reader';
import RadixResult from './result';

function isSameKey(path: string, key: string): boolean {
  const pr = new Reader(path);
  const kr = new Reader(key);

  let different = false;

  while ((pr.hasNext && pr.current !== '/') && (kr.hasNext && kr.current !== '/')) {
    if (pr.current !== kr.current) {
      different = true;
      break;
    }
    pr.next();
    kr.next();
  }

  return (!different) && (pr.current === '/' || !pr.hasNext);
}

function checkMarkers(char: string): boolean {
  return (char === '/' || char === ':' || char === '*');
}

function isSharedKey(path: string, key: string): boolean {
  const pr = new Reader(path);
  const kr = new Reader(key);

  if (pr.current !== kr.current && checkMarkers(kr.current)) {
    return false;
  }

  let different = false;

  while ((pr.hasNext && !checkMarkers(pr.current)) && (kr.hasNext && !checkMarkers(kr.current))) {
    if (pr.current !== kr.current) {
      different = true;
      break;
    }

    pr.next();
    kr.next();
  }

  return (!different) && (!kr.hasNext || checkMarkers(kr.current));
}

function detectParamSize(reader: Reader) {
  const oldPos = reader.pos;

  while (reader.hasNext) {
    if (reader.current === '/') {
      break;
    }

    reader.next();
  }

  const count = reader.pos - oldPos;

  reader.pos = oldPos;

  return count;
}

function innerAdd<T>(path: string, payload: T, node: RadixNode<T>) {
  const kr = new Reader(node.key);
  const pr = new Reader(path);

  while (kr.hasNext && pr.hasNext) {
    if (pr.current !== kr.current) {
      break;
    }

    pr.next();
    kr.next();
  }

  if (pr.pos === 0 || (pr.pos < pr.size && pr.pos >= kr.size)) {
    let added = false;

    const newKey = path.slice(pr.pos);

    for (const child of node.children) {
      if (child.key[0] === ':' && newKey[0] === ':') {
        if (!isSameKey(newKey, child.key)) {
          throw new SharedKeyError(newKey, child.key);
        }
      } else if (child.key[0] !== newKey[0]) {
        continue;
      }

      added = true;
      innerAdd(newKey, payload, child);
      break;
    }

    if (!added) {
      node.children.push(new RadixNode<T>(newKey, payload));
    }

    node.sort();
  } else if (pr.pos === pr.size && pr.pos === kr.size) {
    if (node.payload) {
      throw new DuplicateError(path);
    }

    node.payload = payload;
  } else if (pr.pos > 0 && pr.pos < kr.size) {
    const newNode = new RadixNode<T>(
      node.key.slice(pr.pos),
      node.payload,
    );

    newNode.children = [...node.children];

    node.key = path.slice(0, pr.pos);
    node.children = [ newNode ];

    if (pr.pos < pr.size) {
      node.children.push(new RadixNode<T>(path.slice(pr.pos), payload));

      node.sort();

      node.payload = undefined;
    } else {
      node.payload = payload;
    }
  }
}

function innerFind<T>(
  path: string,
  result: RadixResult<T>,
  node: RadixNode<T>,
  first: boolean = false,
) {
  if (first && (path.length === node.key.length && path === node.key) && node.payload) {
    result.use(node);

    return;
  }

  const kr = new Reader(node.key);
  const pr = new Reader(path);

  while (kr.hasNext && pr.hasNext
    && (kr.current === '*' || kr.current === ':' || pr.current === kr.current)
  ) {
    switch (kr.current) {
      case '*':
        result.params[node.key.slice(kr.pos + 1)] = path.slice(pr.pos);
        result.use(node);

        return;
      case ':':
        const keySize = detectParamSize(kr);
        const pathSize = detectParamSize(pr);

        result.params[node.key.slice(kr.pos + 1, keySize - 1)] = path.slice(pr.pos, pathSize);

        kr.pos += keySize;
        pr.pos += pathSize;

        break;
      default:
        kr.next();
        pr.next();
        break;
    }
  }

  if (!(pr.hasNext || kr.hasNext)) {
    if (node.payload) {
      result.use(node);

      return;
    }
  }

  if (pr.hasNext) {
    if (kr.size > 0
      && (pr.pos + 1 === pr.size)
      && (pr.current === '/')
    ) {
      result.use(node);

      return;
    }

    const newPath = path.slice(pr.pos);

    for (const child of node.children) {
      if ((child.key[0] === '*' || child.key[0] === ':') || isSharedKey(newPath, child.key)) {
        result.use(node, false);

        innerFind(newPath, result, child);

        return;
      }
    }

    return;
  }

  if (kr.hasNext) {
    if (kr.pos + 1 === kr.size && kr.current === '/') {
      result.use(node);

      return;
    }

    if (kr.pos < kr.size && (
      (kr.current === '/' && kr.peekNext === '*') || kr.current === '*'
    )) {
      if (kr.current !== '*') {
        kr.next();
      }

      result.params[node.key.slice(kr.pos + 1)] = '';

      result.use(node);

      return;
    }
  }
}

export default class RadixTree<T> {
  public get root(): RadixNode<T> {
    return this.nodeRoot;
  }

  private nodeRoot: RadixNode<T>;

  constructor() {
    this.nodeRoot = new RadixNode<T>('', undefined, true);
  }

  public add(path: string, payload: T) {
    if (this.nodeRoot.placeholder) {
      this.nodeRoot = new RadixNode<T>(path, payload);
    } else {
      innerAdd<T>(path, payload, this.nodeRoot);
    }
  }

  public find(path: string): RadixResult<T> {
    const result = new RadixResult<T>();

    innerFind(path, result, this.nodeRoot, true);

    return result;
  }
}
