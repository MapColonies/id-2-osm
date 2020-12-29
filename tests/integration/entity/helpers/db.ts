import { container } from 'tsyringe';
import { Repository } from 'typeorm';
import { Entity, IEntity } from '../../../../src/entity/models/entity';
import { createFakeEntity } from '../../../helpers/helpers';

export const createDbEntity = async (): Promise<IEntity> => {
  const repo = container.resolve<Repository<Entity>>('EntityRepository');
  const entity = repo.create(createFakeEntity());
  await repo.save(entity);
  return entity;
};
