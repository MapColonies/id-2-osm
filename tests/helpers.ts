import faker from 'faker';
import { IEntity } from '../src/entity/models/entity';

export const createFakeEntity = (): IEntity => {
  return { externalId: faker.datatype.uuid(), osmId: faker.datatype.number() };
};
