import { hostname } from 'os';
import { readFileSync } from 'fs';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import { DbConfig } from '../interfaces';

export const createConnectionOptions = (dbConfig: DbConfig): ConnectionOptions => {
  const { enableSslAuth, sslPaths, ...connectionOptions } = dbConfig;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  connectionOptions.extra = { application_name: `${hostname()}-${process.env.NODE_ENV ?? 'unknown_env'}` };
  if (enableSslAuth && connectionOptions.type === 'postgres') {
    connectionOptions.password = undefined;
    connectionOptions.ssl = { key: readFileSync(sslPaths.key), cert: readFileSync(sslPaths.cert), ca: readFileSync(sslPaths.ca) };
  }
  return connectionOptions;
};

export const initConnection = async (dbConfig: DbConfig): Promise<Connection> => {
  return createConnection(createConnectionOptions(dbConfig));
};
