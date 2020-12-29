import { Request, RequestHandler, Response } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';
import { HttpError, NotFoundError } from '../../common/errors';
import { ILogger } from '../../common/interfaces';
import { Entity } from '../models/entity';

import { EntityManager } from '../models/entityManager';
import { IdAlreadyExistsError } from '../models/errors';

type GetEntityHandler = RequestHandler<{ externalId: string }, Entity>;

@injectable()
export class EntityController {
  public constructor(@inject(EntityManager) private readonly manager: EntityManager, @inject(Services.LOGGER) private readonly logger: ILogger) {}

  public get: GetEntityHandler = async (req: Request, res: Response, next) => {
    const { externalId } = req.params;

    let entity: Entity | undefined;
    try {
      entity = await this.manager.getEntity(externalId);
    } catch (error) {
      return next(error);
    }

    if (!entity) {
      const error = new NotFoundError('Entity with given id was not found.');
      return next(error);
    }

    return res.status(httpStatus.OK).json(entity);
  };

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
