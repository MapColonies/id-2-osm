import { container } from 'tsyringe';
import config from 'config';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import jsLogger from '@map-colonies/js-logger';
import { Services } from '../../src/common/constants';
import { Entity } from '../../src/entity/models/entity';

async function registerTestValues(): Promise<void> {
  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: jsLogger({ enabled: false }) });

  const connectionOptions = config.get<ConnectionOptions>('db');
  const connection = await createConnection({ entities: ['src/entity/models/*.ts'], ...connectionOptions });
  await connection.synchronize();
  const repo = connection.getRepository(Entity);
  container.register(Connection, { useValue: connection });
  container.register('EntityRepository', { useValue: repo });
}

export { registerTestValues };
