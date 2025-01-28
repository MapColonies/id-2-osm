import { DataSource } from 'typeorm';
import { createDataSourceOptions } from '../../src/common/db/connection';
import { getConfig, initConfig } from '../../src/common/config';
import { DbConfig } from '../../src/common/interfaces';
import { Entity } from '../../src/entity/models/entity';

export default async (): Promise<void> => {
  await initConfig(true);

  const config = getConfig();
  const dbConfig = config.get('db') as DbConfig;
  const dataSource = new DataSource(createDataSourceOptions(dbConfig));
  await dataSource.initialize();

  const entityRepository = dataSource.getRepository(Entity);
  await entityRepository.clear();

  await dataSource.destroy();
  return;
};
