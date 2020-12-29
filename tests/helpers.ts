import faker from 'faker';
import { IEntity } from '../src/entity/models/entity';

export const createFakeEntity = (): IEntity => {
  return { externalId: faker.random.uuid(), osmId: faker.random.number() };
};
