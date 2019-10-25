import RadixResult from './radix/result';
import RadixTree from './radix/tree';

/**
 * Wraps around a RadixTree<T> instance to
 * allow route caching.
 */
export default class ArgoNavisCachedRadix<T> {
  private tree: RadixTree<T> = new RadixTree<T>();
  private cache: Map<string, RadixResult<T>> = new Map();

  public add(path: string, payload: T) {
    this.tree.add(path, payload);
  }

  public find(path: string): RadixResult<T> {
    /**
     * get cached route
     */
    const cached = this.cache.get(path);

    /**
     * Check if the cache exists
     */
    if (cached) {
      /**
       * Return cached result
       */
      return cached;
    }

    /**
     * Parse route to get result
     */
    const result = this.tree.find(path);

    /**
     * Only cache paths that are not named or glob.
     */
    if (result.found && result.params.size === 0) {
      this.cache.set(path, result);
    }

    return result;
  }
}
