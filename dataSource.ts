import { DataSource } from 'typeorm';
import { createConnectionOptions } from './src/common/db/connection';
import { DbConfig } from './src/common/interfaces';
import { getConfig, initConfig } from './src/common/config';

const dataSourceFactory = async (): Promise<DataSource> => {
  await initConfig(true);
  const config = getConfig();

  const connectionOptions = config.get('db') as DbConfig;

  const appDataSource = new DataSource({
    ...createConnectionOptions(connectionOptions),
    entities: ['src/entity/models/*.ts'],
    migrationsTableName: 'custom_migration_table',
    migrations: ['db/migration/*.ts'],
  });

  return appDataSource;
};

export default dataSourceFactory();
