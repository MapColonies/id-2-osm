import { DataSource } from 'typeorm';
import config from 'config';
import { createConnectionOptions } from './src/common/db/connection';
import { DbConfig } from './src/common/interfaces';

const connectionOptions = config.get<DbConfig>('db');

export const appDataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
  entities: ['src/entity/models/*.ts'],
  migrationsTableName: 'custom_migration_table',
  migrations: ['db/migration/*.ts'],
});
