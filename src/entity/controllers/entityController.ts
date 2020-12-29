import { Request, RequestHandler, Response } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';
import { HttpError } from '../../common/errors';
import { ILogger } from '../../common/interfaces';

import { EntityManager } from '../models/entityManager';
import { IdAlreadyExistsError } from '../models/errors';

@injectable()
export class EntityController {
  public constructor(@inject(EntityManager) private readonly manager: EntityManager, @inject(Services.LOGGER) private readonly logger: ILogger) {}

  public post: RequestHandler = async (req: Request, res: Response, next) => {
    try {
      await this.manager.createEntity(req.body);
    } catch (error) {
      if (error instanceof IdAlreadyExistsError) {
        (error as HttpError).status = httpStatus.UNPROCESSABLE_ENTITY;
      }
      return next(error);
    }
    return res.sendStatus(httpStatus.CREATED);
  };
}
