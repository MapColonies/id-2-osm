import { DependencyContainer } from 'tsyringe';
import { DataSource } from 'typeorm';
import { Entity, IEntity } from '../../../../src/entity/models/entity';
import { createFakeEntity } from '../../../helpers/helpers';

export const createDbEntity = async (depContainer: DependencyContainer): Promise<IEntity> => {
  const conn = depContainer.resolve(DataSource);
  const repo = conn.getRepository(Entity);
  const entity = repo.create(createFakeEntity());
  const createdEntity = await repo.save(entity);
  return createdEntity;
};
