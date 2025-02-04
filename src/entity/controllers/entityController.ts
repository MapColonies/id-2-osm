import { Logger } from '@map-colonies/js-logger';
import { RequestHandler } from 'express';
import httpStatus, { StatusCodes } from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { HttpError } from '../../common/errors';
import { Entity } from '../models/entity';
import { EntityManager } from '../models/entityManager';
import { BulkRequestValidationError, EntityNotFoundError, IdAlreadyExistsError } from '../models/errors';
import { BulkActions, BulkRequestBody } from '../models/operations';
import { IEntity } from '../models/interfaces';

interface EntityParams {
  externalId: string;
}

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

    try {
      const entity = await this.manager.getEntity(externalId);

      if (accept === 'text/plain') {
        return res.status(httpStatus.OK).set('content-type', 'text/plain').send(entity.osmId.toString());
      }

      return res.status(httpStatus.OK).json(entity);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        (error as HttpError).status = StatusCodes.NOT_FOUND;
      }
      return next(error);
    }
  };

  public post: PostEntityHandler = async (req, res, next) => {
    try {
      await this.manager.createEntity(req.body);
      return res.sendStatus(httpStatus.CREATED);
    } catch (error) {
      if (error instanceof IdAlreadyExistsError) {
        (error as HttpError).status = httpStatus.UNPROCESSABLE_ENTITY;
      }
      return next(error);
    }
  };

  public postBulk: PostBulkEntitiesHandler = async (req, res, next) => {
    try {
      // validate the request
      this.validateBulkRequest(req.body);

      // either handle as a milti operation bulks, create bulk or delete bulk
      if (Array.isArray(req.body)) {
        await this.manager.multiOperationBulks(req.body);
      } else if (req.body.action === BulkActions.CREATE) {
        await this.manager.createEntities(req.body.payload);
      } else {
        await this.manager.deleteEntities(req.body.payload);
      }

      return res.sendStatus(StatusCodes.OK);
    } catch (error) {
      if (error instanceof BulkRequestValidationError) {
        (error as HttpError).status = httpStatus.BAD_REQUEST;
      } else if (error instanceof IdAlreadyExistsError) {
        (error as HttpError).status = httpStatus.UNPROCESSABLE_ENTITY;
      } else if (error instanceof EntityNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };

  public delete: DeleteEntityHandler = async (req, res, next) => {
    const { externalId } = req.params;

    try {
      await this.manager.deleteEntity(externalId);
      res.sendStatus(httpStatus.NO_CONTENT);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };

  private validateBulkRequest(bulkReq: BulkRequestBody): void {
    try {
      if (!Array.isArray(bulkReq)) {
        // validate single operation payload is not empty
        if (bulkReq.payload.length === 0) {
          throw new BulkRequestValidationError('single operation request payload must NOT have fewer than 1 items');
        }
        return;
      }

      const [bulkReq1, bulkReq2] = bulkReq;

      // validate double operation action has 2 different actions
      if (bulkReq1.action === bulkReq2.action) {
        throw new BulkRequestValidationError('multi operation request payload must be a tuple of create bulk and delete bulk');
      }

      const createBulk = [bulkReq1, bulkReq2].filter((bulk) => bulk.action === BulkActions.CREATE)[0];
      const deleteBulk = [bulkReq1, bulkReq2].filter((bulk) => bulk.action === BulkActions.DELETE)[0];
      const createEntities = createBulk.payload.map((p) => p.externalId);
      const deleteEntities = deleteBulk.payload;
      const entities = [...createEntities, ...deleteEntities];

      // validate double operation action is not empty
      if (entities.length === 0) {
        throw new BulkRequestValidationError('multi operation request payloads must NOT have fewer than 1 items');
      }

      // validate double operation action has no duplicate entities
      const uniqueEntities = new Set(entities);
      if (uniqueEntities.size !== entities.length) {
        throw new BulkRequestValidationError('duplicate externalId found in multi operation request payload');
      }
    } catch (error) {
      this.logger.error({ msg: 'validation failed', err: error });
      throw error;
    }
  }
}
