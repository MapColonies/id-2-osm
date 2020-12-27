import { container } from 'tsyringe';
import config from 'config';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import faker from 'faker';
import { Services } from '../../src/common/constants';
import { Entity, IEntity } from '../../src/entity/models/entity';

const exampleEntity: IEntity = { externalId: faker.random.uuid(), osmId: faker.random.number() };

async function registerTestValues(): Promise<void> {
  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: { log: jest.fn() } });

  const connectionOptions = config.get<ConnectionOptions>('db');
  const connection = await createConnection({ entities: ['src/entity/models/*.ts'], ...connectionOptions });
  await connection.synchronize();
  const repo = connection.getRepository(Entity);
  const entity = repo.create(exampleEntity);
  await repo.save(entity);
  container.register(Connection, { useValue: connection });
  container.register('EntityRepository', { useValue: repo });
}

export { registerTestValues, exampleEntity };
