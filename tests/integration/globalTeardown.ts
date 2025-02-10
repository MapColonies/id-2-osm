import { Entity } from '../../src/entity/models/entity';
import { initConnection } from '../../src/common/db/connection';
import { getConfig, initConfig } from '../../src/common/config';
import { DbConfig } from '../../src/common/interfaces';

export default async (): Promise<void> => {
  await initConfig(true);

  const config = getConfig();
  const dbConfig = config.get('db') as DbConfig;
  const appDataSource = await initConnection(dbConfig);
  const entityRepository = appDataSource.getRepository(Entity);

  await entityRepository.clear();
  await appDataSource.destroy();
  return;
};
