import { ServerResponse } from 'http';

export default class CustomError extends Error {
  constructor(response: ServerResponse) {
    super(`Server rendered error with ${response.statusCode}`);
  }
}
