import { readFileSync } from 'fs';
import { container } from 'tsyringe';
import config from 'config';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import { Probe } from '@map-colonies/mc-probe';
import { MCLogger, ILoggerConfig, IServiceConfig } from '@map-colonies/mc-logger';
import { Services } from './common/constants';
import { Entity } from './entity/models/entity';

async function registerExternalValues(): Promise<void> {
  const loggerConfig = config.get<ILoggerConfig>('logger');
  const packageContent = readFileSync('./package.json', 'utf8');
  const service = JSON.parse(packageContent) as IServiceConfig;
  const logger = new MCLogger(loggerConfig, service);
  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: logger });

  const connectionOptions = config.get<ConnectionOptions>('db');
  const connection = await createConnection({entities: ['entity/models/*.js'] ,...connectionOptions});
  container.register(Connection, { useValue: connection});
  container.register('EntityRepository', {useValue: connection.getRepository(Entity)})

  container.register<Probe>(Probe, { useFactory: (container) => new Probe(container.resolve(Services.LOGGER), {}) });
}

export { registerExternalValues };
