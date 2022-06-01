import { faker } from '@faker-js/faker';
import { IEntity } from '../../src/entity/models/entity';

export const createOsmId = (): number => {
  return faker.datatype.number({ min: 1, max: 2147483647 });
};

export const createFakeEntity = (): IEntity => {
  return { externalId: faker.datatype.uuid(), osmId: createOsmId() };
};
