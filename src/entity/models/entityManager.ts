import client from 'prom-client';
import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { In, Repository } from 'typeorm';
import { METRICS_REGISTRY, SERVICES } from '../../common/constants';
import { Entity, IEntity } from './entity';
import { EntityNotFoundError, IdAlreadyExistsError } from './errors';

@injectable()
export class EntityManager {
  private readonly entityCounter: client.Counter<'status' | 'externalid'>;
  private readonly currentEntityCounter: client.Gauge;

  public constructor(
    @inject('EntityRepository') private readonly repository: Repository<Entity>,
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(METRICS_REGISTRY) registry: client.Registry
  ) {
    this.entityCounter = new client.Counter({
      name: 'entity_count',
      help: 'The overall entity stats',
      labelNames: ['status', 'externalid'] as const,
      registers: [registry],
    });
    this.currentEntityCounter = new client.Gauge({
      name: 'current_entity_count',
      help: 'The total number of current entities',
      registers: [registry],
    });
  }

  public async getEntity(externalId: string): Promise<Entity | null> {
    this.logger.info({ msg: 'getting entity', externalId });

    return this.repository.findOneBy({ externalId });
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

      this.entityCounter.inc({ status: 'failed', externalid: dbEntity.externalId });
      throw new IdAlreadyExistsError(message);
    }

    this.entityCounter.inc({ status: 'created', externalid: newEntity.externalId });
    this.currentEntityCounter.inc();
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
      this.entitiesMetric('failed', newEntities);
      throw new IdAlreadyExistsError(message);
    }

    this.entitiesMetric('created', newEntities);
    this.currentEntityCounter.inc(newEntities.length);
    await this.repository.insert(newEntities);
  }

  public async deleteEntity(externalId: string): Promise<void> {
    this.logger.info({ msg: 'deleting entity', externalId });

    const entity = await this.repository.findOneBy({ externalId });

    if (!entity) {
      this.logger.error({ msg: 'could not find the entity for deletion', externalId });

      this.entityCounter.inc({ status: 'failed', externalid: externalId });
      throw new EntityNotFoundError("couldn't find an entity with the given id to delete");
    }

    this.entityCounter.inc({ status: 'deleted', externalid: entity.externalId });
    this.currentEntityCounter.dec();
    await this.repository.delete(externalId);
  }

  public async deleteEntities(externalIds: string[]): Promise<void> {
    this.logger.info({ msg: 'deleting bulk entities', amount: externalIds.length });

    const entities = await this.repository.findByIds(externalIds);

    if (entities.length !== externalIds.length) {
      this.logger.error({
        msg: `could not find ${externalIds.length - entities.length} of the specified ids`,
        expected: externalIds.length,
        received: entities.length,
      });

      this.entitiesMetric('failed', entities);
      throw new EntityNotFoundError(`couldn't find one of the specified ids: ${JSON.stringify(externalIds)}`);
    }

    this.entitiesMetric('deleted', entities);
    this.currentEntityCounter.dec(entities.length);
    await this.repository.delete(externalIds);
  }

  public entitiesMetric(entityStatus: string, entities: Entity[]): void {
    for (let i = 0; i < entities.length; i++) {
      this.entityCounter.inc({ status: entityStatus, externalid: entities[i].externalId });
    }
  }
}
