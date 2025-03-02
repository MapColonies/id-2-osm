import { Repository } from 'typeorm';
import { DependencyContainer } from 'tsyringe';
import { Entity, ENTITY_REPOSITORY_SYMBOL } from '../../../../src/entity/models/entity';
import { createFakeEntity } from '../../../helpers/helpers';
import { IEntity } from '../../../../src/entity/models/interfaces';

export const createDbEntity = async (container: DependencyContainer, params?: Partial<IEntity>): Promise<IEntity> => {
  const repo = container.resolve<Repository<Entity>>(ENTITY_REPOSITORY_SYMBOL);
  const entity = repo.create(createFakeEntity(params));
  const createdEntity = await repo.save(entity);
  return createdEntity;
};
