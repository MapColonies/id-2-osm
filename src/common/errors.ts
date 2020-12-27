import {StatusCodes} from 'http-status-codes'

export interface HttpError extends Error {
  status?: number;
}

export class NotFoundError extends Error {
  public status = StatusCodes.NOT_FOUND;
}
