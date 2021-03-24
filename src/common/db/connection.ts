import { readFileSync } from 'fs';
import { Connection, createConnection } from 'typeorm';
import { DbConfig } from '../interfaces';

export const initConnection = async (dbConfig: DbConfig): Promise<Connection> => {
  const { enableSslAuth, sslPaths, ...connectionOptions } = dbConfig;
  if (enableSslAuth && connectionOptions.type === 'postgres') {
    connectionOptions.password = undefined;
    connectionOptions.ssl = { key: readFileSync(sslPaths.key), cert: readFileSync(sslPaths.cert), ca: readFileSync(sslPaths.ca) };
  }
  return createConnection(connectionOptions);
};
