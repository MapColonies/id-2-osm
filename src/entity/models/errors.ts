export class IdAlreadyExistsError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, IdAlreadyExistsError.prototype);
  }
}

export class EntityNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, EntityNotFoundError.prototype);
  }
}

export class BulkRequestValidationError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, BulkRequestValidationError.prototype);
  }
}
