import { Logger } from '@map-colonies/js-logger';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';
import { HttpError, NotFoundError } from '../../common/errors';
import { Entity, IEntity } from '../models/entity';
import { EntityManager } from '../models/entityManager';
import { EntityNotFoundError, IdAlreadyExistsError } from '../models/errors';

type BulkAction = 'create' | 'delete';
interface BulkRequestBody {
  action: BulkAction;
  payload: IEntity | string[];
}

interface EntityParams {
  externalId: string;
}

type GetEntityHandler = RequestHandler<EntityParams, Entity | string>;
type PostEntityHandler = RequestHandler<undefined, undefined, IEntity>;
type PostBulkEntitiesHandler = RequestHandler<undefined, undefined, BulkRequestBody>;
type DeleteEntityHandler = RequestHandler<EntityParams>;
@injectable()
export class EntityController {
  public constructor(@inject(EntityManager) private readonly manager: EntityManager, @inject(Services.LOGGER) private readonly logger: Logger) {}

  public get: GetEntityHandler = async (req, res, next) => {
    const { externalId } = req.params;
    const { accept } = req.headers;

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

    if (accept === 'text/plain') {
      return res.status(httpStatus.OK).set('content-type', 'text/plain').send(entity.osmId.toString());
    }

    return res.status(httpStatus.OK).json(entity);
  };

  public post: PostEntityHandler = async (req, res, next) => {
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

  public postBulk: PostBulkEntitiesHandler = async (req, res, next) => {
    let responseStatusCode;
    const { action, payload } = req.body;
    try {
      if (action === 'create') {
        responseStatusCode = httpStatus.CREATED;
        await this.manager.createEntities((payload as unknown) as IEntity[]);
      } else {
        responseStatusCode = httpStatus.NO_CONTENT;
        await this.manager.deleteEntities((payload as unknown) as string[]);
      }
    } catch (error) {
      if (error instanceof IdAlreadyExistsError) {
        (error as HttpError).status = httpStatus.UNPROCESSABLE_ENTITY;
      } else if (error instanceof EntityNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
    return res.sendStatus(responseStatusCode);
  };

  public delete: DeleteEntityHandler = async (req, res, next) => {
    const { externalId } = req.params;

    try {
      await this.manager.deleteEntity(externalId);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }

    res.sendStatus(httpStatus.NO_CONTENT);
  };
}
