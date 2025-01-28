import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { In, Repository } from 'typeorm';
import { runInTransaction } from 'typeorm-transactional';
import { DEFAULT_TRANSACTION_OPTIONS } from '@src/common/db/connection';
import { SERVICES } from '../../common/constants';
import { Entity, ENTITY_REPOSITORY_SYMBOL } from './entity';
import { EntityNotFoundError, IdAlreadyExistsError } from './errors';
import { BulkActions, MultiOperationBulk, MultiOperationBulksRequestBody } from './operations';
import { IEntity } from './interfaces';

@injectable()
export class EntityManager {
  public constructor(
    @inject(ENTITY_REPOSITORY_SYMBOL) private readonly repository: Repository<Entity>,
    @inject(SERVICES.LOGGER) private readonly logger: Logger
  ) {}

  public async getEntity(externalId: string): Promise<Entity> {
    this.logger.info({ msg: 'getting entity', externalId });

    const entity = await this.repository.findOneBy({ externalId });

    if (entity === null) {
      throw new EntityNotFoundError('Entity with given id was not found.');
    }

    return entity;
  }

  public async createEntity(newEntity: IEntity): Promise<void> {
    const { externalId, osmId } = newEntity;
    this.logger.info({ msg: 'creating new entity', externalId, osmId });

    const dbEntity = await this.repository.findOne({ where: [{ externalId }, { osmId }] });

    if (dbEntity) {
      let message: string;
      if (dbEntity.externalId === newEntity.externalId) {
        message = `externalId=${newEntity.externalId} already exists`;
        this.logger.error({ msg: 'entity with the same externalId already exists', externalId });
      } else {
        message = `osmId=${newEntity.osmId} already exists`;
        this.logger.error({ msg: 'entity with the same osmId already exists', osmId });
      }

      throw new IdAlreadyExistsError(message);
    }

    await this.repository.insert(newEntity);
  }

  public async createEntities(newEntities: IEntity[]): Promise<void> {
    this.logger.info({ msg: `creating bulk entities`, amount: newEntities.length });

    const dbEntity = await this.repository.findOne({
      where: [
        {
          externalId: In(newEntities.map((entity) => entity.externalId)),
        },
        { osmId: In(newEntities.map((entity) => entity.osmId)) },
      ],
    });

    if (dbEntity) {
      const message = `an entity with the following ids: ${JSON.stringify(dbEntity)} already exists`;

      this.logger.error({
        msg: 'could not bulk create bulk, found an entity with already existing id',
        osmId: dbEntity.osmId,
        externalId: dbEntity.externalId,
      });

      throw new IdAlreadyExistsError(message);
    }

    await this.repository.insert(newEntities);
  }

  public async deleteEntity(externalId: string): Promise<void> {
    this.logger.info({ msg: 'deleting entity', externalId });

    const entity = await this.repository.findOneBy({ externalId });

    if (!entity) {
      this.logger.error({ msg: 'could not find the entity for deletion', externalId });

      throw new EntityNotFoundError("couldn't find an entity with the given id to delete");
    }

    await this.repository.delete(externalId);
  }

  public async deleteEntities(externalIds: string[]): Promise<void> {
    this.logger.info({ msg: 'deleting bulk entities', amount: externalIds.length });

    const entities = await this.repository.findBy({ externalId: In(externalIds) });

    if (entities.length !== externalIds.length) {
      this.logger.error({
        msg: `could not find ${externalIds.length - entities.length} of the specified ids`,
        expected: externalIds.length,
        received: entities.length,
      });

      throw new EntityNotFoundError(`couldn't find one of the specified ids: ${JSON.stringify(externalIds)}`);
    }

    await this.repository.delete(externalIds);
  }

  public async multiOperationBulks(multiBulks: MultiOperationBulksRequestBody): Promise<void> {
    this.logger.info({ msg: 'attempting to run multi operation bulk in a single transaction', transactionOptions: DEFAULT_TRANSACTION_OPTIONS });

    const [req1, req2] = multiBulks;
    const [createBulk, deleteBulk] = (req1.action === BulkActions.CREATE ? [req1, req2] : [req2, req1]) as MultiOperationBulk;

    await runInTransaction(async () => {
      await this.createEntities(createBulk.payload);
      await this.deleteEntities(deleteBulk.payload);
    }, DEFAULT_TRANSACTION_OPTIONS);

    return;
  }
}
