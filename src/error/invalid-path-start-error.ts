import Method from '../types/methods';

export class InvalidPathStartError extends Error {
  constructor(method: Method, path: string) {
    super(`Route declaration for ${method}: '${path}' needs to start with '/'`);
  }
}
