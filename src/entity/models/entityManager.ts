import { inject, injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { Entity, IEntity } from './entity';
import { IdAlreadyExistsError } from './errors';

@injectable()
export class EntityManager {
  public constructor(
    @inject('EntityRepository') private readonly repository: Repository<Entity>,
    @inject(Services.LOGGER) private readonly logger: ILogger
  ) {}

  public async getEntity(externalId: string): Promise<Entity | undefined> {
    return this.repository.findOne(externalId);
  }

  public async createEntity(newEntity: IEntity): Promise<void> {
    this.logger.log('info', `creating new entity ${JSON.stringify(newEntity)}`);

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
}
