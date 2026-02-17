import { HttpError } from '@map-colonies/error-express-handler';
import { StatusCodes } from 'http-status-codes';

export abstract class BaseHttpError extends Error implements HttpError {
  public constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class IdAlreadyExistsError extends BaseHttpError {
  public constructor(message: string) {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY);
  }
}

export class EntityNotFoundError extends BaseHttpError {
  public constructor(message: string) {
    super(message, StatusCodes.NOT_FOUND);
  }
}

export class BulkRequestValidationError extends BaseHttpError {
  public constructor(message: string) {
    super(message, StatusCodes.BAD_REQUEST);
  }
}
