import faker from 'faker';
import { IEntity } from '../../src/entity/models/entity';

export const createOsmId = (): number => {
  return faker.random.number({ min: 1, max: 2147483647 });
};

export const createFakeEntity = (): IEntity => {
  return { externalId: faker.random.uuid(), osmId: createOsmId() };
};
