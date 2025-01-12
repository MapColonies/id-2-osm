import { DataSource } from 'typeorm';
import { DependencyContainer } from 'tsyringe';
import { Entity, IEntity } from '../../../../src/entity/models/entity';
import { createFakeEntity } from '../../../helpers/helpers';

export const createDbEntity = async (container: DependencyContainer): Promise<IEntity> => {
  const conn = container.resolve(DataSource);
  const repo = conn.getRepository(Entity);
  const entity = repo.create(createFakeEntity());
  const createdEntity = await repo.save(entity);
  return createdEntity;
};
