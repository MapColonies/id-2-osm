import { container } from 'tsyringe';
import { Connection } from 'typeorm';
import { Entity, IEntity } from '../../../../src/entity/models/entity';
import { createFakeEntity } from '../../../helpers/helpers';

export const createDbEntity = async (): Promise<IEntity> => {
  const conn = container.resolve(Connection);
  const repo = conn.getRepository(Entity);
  const entity = repo.create(createFakeEntity());
  const createdEntity = await repo.save(entity);
  return createdEntity;
};
