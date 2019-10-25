import { IncomingMessage } from 'http';

export default class RouteNotFoundError extends Error {
  constructor(request: IncomingMessage) {
    super(`Requested path '${request.method}:${request.url}' was not found.`);
  }
}
