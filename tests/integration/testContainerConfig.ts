import { container } from 'tsyringe';
import config from 'config';
import { DataSource, DataSourceOptions } from 'typeorm';
import jsLogger from '@map-colonies/js-logger';
import { SERVICES } from '../../src/common/constants';
import { Entity } from '../../src/entity/models/entity';

async function registerTestValues(): Promise<void> {
  container.register(SERVICES.CONFIG, { useValue: config });
  container.register(SERVICES.LOGGER, { useValue: jsLogger({ enabled: false }) });

  const connectionOptions = config.get<DataSourceOptions>('db');
  const dataSource = new DataSource({ entities: ['src/entity/models/*.ts'], ...connectionOptions });
  const connection = await dataSource.connect();
  await connection.synchronize();
  const repo = connection.getRepository(Entity);
  container.register(DataSource, { useValue: connection });
  container.register('EntityRepository', { useValue: repo });
}

export { registerTestValues };
