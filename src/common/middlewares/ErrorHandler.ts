import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { inject, injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import { Services } from '../constants';
import { ILogger } from '../interfaces';

@injectable()
export class ErrorHandler {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger) {}

  public getErrorHandlerMiddleware(): ErrorRequestHandler {
    return (
      err: Error,
      req: Request,
      res: Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      next: NextFunction
    ): void => {
      this.logger.log('error', `${req.method} request to ${req.originalUrl}  has failed with error: ${err.message}`);
      // @ts-ignore
      res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err.message });
    };
  }
}
