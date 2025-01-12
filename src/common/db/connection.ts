import { hostname } from 'os';
import { readFileSync } from 'fs';
import { HealthCheck } from '@godaddy/terminus';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Entity } from '../../entity/models/entity';
import { DbConfig } from '../interfaces';
import { promiseTimeout } from '../utils/promiseTimeout';

const DB_TIMEOUT = 5000;

export const createConnectionOptions = (dbConfig: DbConfig): DataSourceOptions => {
  const { enableSslAuth, sslPaths, ...dataSourceOptions } = dbConfig;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  dataSourceOptions.extra = { application_name: `${hostname()}-${process.env.NODE_ENV ?? 'unknown_env'}` };
  if (enableSslAuth && dataSourceOptions.type === 'postgres') {
    dataSourceOptions.password = undefined;
    dataSourceOptions.ssl = { key: readFileSync(sslPaths.key), cert: readFileSync(sslPaths.cert), ca: readFileSync(sslPaths.ca) };
  }
  return { entities: [Entity, '**/models/*.js'], ...dataSourceOptions };
};

export const initConnection = async (dbConfig: DbConfig): Promise<DataSource> => {
  const dataSource = new DataSource(createConnectionOptions(dbConfig));
  await dataSource.initialize();
  return dataSource;
};

export const getDbHealthCheckFunction = (connection: DataSource): HealthCheck => {
  return async (): Promise<void> => {
    const check = connection.query('SELECT 1').then(() => {
      return;
    });
    return promiseTimeout<void>(DB_TIMEOUT, check);
  };
};
