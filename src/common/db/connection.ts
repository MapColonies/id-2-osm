import { readFileSync } from 'fs';
import { DataSource, DataSourceOptions } from 'typeorm';
import { DbConfig } from '../interfaces';

export const createConnectionOptions = (dbConfig: DbConfig): DataSourceOptions => {
  const { enableSslAuth, sslPaths, ...dataSourceOptions } = dbConfig;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  if (enableSslAuth && dataSourceOptions.type === 'postgres') {
    dataSourceOptions.password = undefined;
    dataSourceOptions.ssl = { key: readFileSync(sslPaths.key), cert: readFileSync(sslPaths.cert), ca: readFileSync(sslPaths.ca) };
  }
  return dataSourceOptions;
};

export const initConnection = async (dbConfig: DbConfig): Promise<DataSource> => {
  const dataSource = new DataSource(createConnectionOptions(dbConfig));
  await dataSource.initialize();
  return dataSource;
};
