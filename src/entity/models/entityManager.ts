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
  public async createEntity(newEntity: IEntity): Promise<void> {
    this.logger.log('info', `creating new entity ${JSON.stringify(newEntity)}`);

    const dbEntities = await this.repository.find({ where: [{ externalId: newEntity.externalId }, { osmId: newEntity.osmId }] });

    if (dbEntities.length > 0) {
      let message: string
      if (dbEntities[0].externalId === newEntity.externalId){
        message = `externalId=${newEntity.externalId} already exists`
      } else {
        message = `osmId=${newEntity.osmId} already exists`;
      }
      throw new IdAlreadyExistsError(message)
    }
    
    await this.repository.insert(newEntity);
  }
}
