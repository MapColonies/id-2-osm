import { inject, injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { Entity, IEntity } from './entity';

@injectable()
export class EntityManager {
  public constructor(
    @inject('EntityRepository') private readonly repository: Repository<Entity>,
    @inject(Services.LOGGER) private readonly logger: ILogger
  ) {}
  public async createEntity(entity: Entity): Promise<void> {
    this.logger.log('info', `creating new entity ${JSON.stringify(entity)}`);
    const createdEntity = this.repository.create(entity);
    console.log(entity)
    await this.repository.save(createdEntity);
  }
}
