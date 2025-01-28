import { faker } from '@faker-js/faker';
import { IEntity } from '../../src/entity/models/interfaces';

export const createOsmId = (): number => {
  return faker.number.int({ min: 1, max: 2147483647 });
};

export const createFakeEntity = (): IEntity => {
  return { externalId: faker.string.uuid(), osmId: createOsmId() };
};
