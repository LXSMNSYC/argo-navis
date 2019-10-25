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
import { compare, Comparison } from '../utils/compare';
import { Reader } from '../utils/reader';

export enum Kind {
  Normal,
  Named,
  Glob,
}

function computePriority(key: string): [Kind, number] {
  const reader = new Reader(key);

  while (reader.hasNext) {
    const char = reader.current;

    switch (char) {
      case '*':
        return [Kind.Glob, reader.pos];
      case ':':
        return [Kind.Named, reader.pos];
      default:
        reader.next();
        break;
    }
  }

  return [Kind.Normal, reader.pos];
}

export default class RadixNode<T> {
  public get key() {
    return this.nodeKey;
  }

  public set key(newKey: string) {
    const [kind, priority] = computePriority(newKey);

    this.nodeKind = kind;
    this.nodePrio = priority;
    this.nodeKey = newKey;
  }

  public get kind(): Kind {
    return this.nodeKind;
  }

  public get priority(): number {
    return this.nodePrio;
  }

  public get placeholder(): boolean {
    return this.nodePlaceholder;
  }

  public get isNormal(): boolean {
    return this.nodeKind === Kind.Normal;
  }

  public get isNamed(): boolean {
    return this.nodeKind === Kind.Named;
  }

  public get isGlob(): boolean {
    return this.nodeKind === Kind.Glob;
  }

  public payload?: T;
  public children: Array<RadixNode<T>>;
  private nodeKey: string;
  private nodePlaceholder: boolean;
  private nodeKind: Kind;
  private nodePrio: number;

  constructor(key: string, payload?: T, placeholder: boolean = false) {
    const [kind, priority] = computePriority(key);

    this.nodeKey = key;
    this.nodePlaceholder = placeholder;
    this.nodeKind = kind;
    this.nodePrio = priority;

    this.payload = payload;
    this.children = [];
  }

  public compare(other: RadixNode<T>): Comparison {
    const result = compare(this.nodeKind, other.nodeKind);

    if (result !== Comparison.Equal) {
      return result;
    }

    return compare(other.nodePrio, this.nodePrio);
  }

  public sort() {
    this.children.sort((a, b) => a.compare(b));
  }
}
