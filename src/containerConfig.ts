import { container } from 'tsyringe';
import config from 'config';
import { Connection } from 'typeorm';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { logMethod, Metrics } from '@map-colonies/telemetry';
import { HealthCheck } from '@godaddy/terminus';
import { Services } from './common/constants';
import { Entity } from './entity/models/entity';
import { promiseTimeout } from './common/utils/promiseTimeout';
import { DbConfig } from './common/interfaces';
import { initConnection } from './common/db/connection';
import { tracing } from './common/tracing';

const dbTimeout = 5000;

const healthCheck = (connection: Connection): HealthCheck => {
  return async (): Promise<void> => {
    const check = connection.query('SELECT 1').then(() => {
      return;
    });
    return promiseTimeout<void>(dbTimeout, check);
  };
};

const beforeShutdown = (connection: Connection): (() => Promise<void>) => {
  return async (): Promise<void> => {
    await connection.close();
  };
};

async function registerExternalValues(): Promise<void> {
  const loggerConfig = config.get<LoggerOptions>('logger');
  // @ts-expect-error the signature is wrong
  const logger = jsLogger({ ...loggerConfig, prettyPrint: false, hooks: { logMethod } });

  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: logger });

  const connectionOptions = config.get<DbConfig>('db');
  const connection = await initConnection({ entities: ['entity/models/*.js'], ...connectionOptions });

  container.register(Services.HEALTHCHECK, { useValue: healthCheck(connection) });

  container.register(Connection, { useValue: connection });
  container.register('EntityRepository', { useValue: connection.getRepository(Entity) });

  const tracer = tracing.start();
  container.register(Services.TRACER, { useValue: tracer });

  const metrics = new Metrics('change-merger');
  const meter = metrics.start();
  container.register(Services.METER, { useValue: meter });

  container.register('onSignal', {
    useValue: async (): Promise<void> => {
      await Promise.all([tracing.stop(), metrics.stop(), beforeShutdown(connection)]);
    },
  });
}

export { registerExternalValues };
