import config from 'config';
import { initConnection } from '../../src/common/db/connection';
import { DbConfig } from '../../src/common/interfaces';

export default async (): Promise<void> => {
  const dataSourceOptions = config.get<DbConfig>('db');
  const connection = await initConnection({ entities: ['src/entity/models/*.ts'], ...dataSourceOptions });
  await connection.destroy();
};
