import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { In, Repository } from 'typeorm';
import { Services } from '../../common/constants';
import { Entity, IEntity } from './entity';
import { EntityNotFoundError, IdAlreadyExistsError } from './errors';

@injectable()
export class EntityManager {
  public constructor(
    @inject('EntityRepository') private readonly repository: Repository<Entity>,
    @inject(Services.LOGGER) private readonly logger: Logger
  ) {}

  public async getEntity(externalId: string): Promise<Entity | undefined> {
    return this.repository.findOne(externalId);
  }

  public async createEntity(newEntity: IEntity): Promise<void> {
    this.logger.info(`creating new entity ${JSON.stringify(newEntity)}`);

    const dbEntity = await this.repository.findOne({ where: [{ externalId: newEntity.externalId }, { osmId: newEntity.osmId }] });

    if (dbEntity) {
      let message: string;
      if (dbEntity.externalId === newEntity.externalId) {
        message = `externalId=${newEntity.externalId} already exists`;
      } else {
        message = `osmId=${newEntity.osmId} already exists`;
      }
      throw new IdAlreadyExistsError(message);
    }

    await this.repository.insert(newEntity);
  }

  public async createEntities(newEntities: IEntity[]): Promise<void> {
    this.logger.info(`creating bulk entities`);

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
      throw new IdAlreadyExistsError(message);
    }

    await this.repository.insert(newEntities);
  }

  public async deleteEntity(externalId: string): Promise<void> {
    const entity = await this.repository.findOne(externalId);

    if (!entity) {
      throw new EntityNotFoundError("couldn't find an entity with the given id to delete");
    }

    await this.repository.delete(externalId);
  }

  public async deleteEntities(externalIds: string[]): Promise<void> {
    const entities = await this.repository.findByIds(externalIds);

    if (entities.length !== externalIds.length) {
      throw new EntityNotFoundError(`couldn't find one of the specified ids: ${JSON.stringify(externalIds)}`);
    }

    await this.repository.delete(externalIds);
  }
}
