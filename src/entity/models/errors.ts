export class IdAlreadyExistsError extends Error {
  public constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, IdAlreadyExistsError.prototype);
  }
}