import { Logger } from '@map-colonies/js-logger';
import { RequestHandler } from 'express';
import httpStatus, { StatusCodes } from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { HttpError, NotFoundError } from '../../common/errors';
import { Entity, IEntity } from '../models/entity';
import { EntityManager } from '../models/entityManager';
import { EntityNotFoundError, IdAlreadyExistsError } from '../models/errors';

interface EntityParams {
  externalId: string;
}

enum BulkActions {
  CREATE = 'create',
  DELETE = 'delete',
}

interface BulkCreateRequestBody {
  action: BulkActions.CREATE;
  payload: IEntity[];
}

interface BulkDeleteRequestBody {
  action: BulkActions.DELETE;
  payload: string[];
}

type BulkRequestBody = BulkCreateRequestBody | BulkDeleteRequestBody;

type GetEntityHandler = RequestHandler<EntityParams, Entity | string>;
type PostEntityHandler = RequestHandler<undefined, undefined, IEntity>;
type PostBulkEntitiesHandler = RequestHandler<undefined, undefined, BulkRequestBody>;
type DeleteEntityHandler = RequestHandler<EntityParams>;
@injectable()
export class EntityController {
  public constructor(
    @inject(EntityManager) private readonly manager: EntityManager,
    @inject(SERVICES.LOGGER) private readonly logger: Logger
  ) {}

  public get: GetEntityHandler = async (req, res, next) => {
    const { externalId } = req.params;
    const { accept } = req.headers;

    let entity: Entity | null;
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
    try {
      if (req.body.action === BulkActions.CREATE) {
        await this.manager.createEntities(req.body.payload);
      } else {
        await this.manager.deleteEntities(req.body.payload);
      }
    } catch (error) {
      if (error instanceof IdAlreadyExistsError) {
        (error as HttpError).status = httpStatus.UNPROCESSABLE_ENTITY;
      } else if (error instanceof EntityNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
    return res.sendStatus(StatusCodes.OK);
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
