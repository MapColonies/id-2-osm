import { faker } from '@faker-js/faker';
import { IEntity } from '../src/entity/models/entity';

export const createFakeEntity = (): IEntity => {
  return { externalId: faker.datatype.uuid(), osmId: faker.datatype.number() };
};
