import { container } from 'tsyringe';
import config from 'config';
import { DataSource } from 'typeorm';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { logMethod, Metrics } from '@map-colonies/telemetry';
import { HealthCheck } from '@godaddy/terminus';
import { trace } from '@opentelemetry/api';
import { SERVICES, SERVICE_NAME, DB_CONNECTION_TIMEOUT } from './common/constants';
import { Entity } from './entity/models/entity';
import { promiseTimeout } from './common/utils/promiseTimeout';
import { DbConfig } from './common/interfaces';
import { initConnection } from './common/db/connection';
import { tracing } from './common/tracing';

const healthCheck = (connection: DataSource): HealthCheck => {
  return async (): Promise<void> => {
    const check = connection.query('SELECT 1').then(() => {
      return;
    });
    return promiseTimeout<void>(DB_CONNECTION_TIMEOUT, check);
  };
};

const beforeShutdown = (connection: DataSource): (() => Promise<void>) => {
  return async (): Promise<void> => {
    await connection.close();
  };
};

async function registerExternalValues(): Promise<void> {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  // @ts-expect-error the signature is wrong
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, hooks: { logMethod } });

  container.register(SERVICES.CONFIG, { useValue: config });
  container.register(SERVICES.LOGGER, { useValue: logger });

  const connectionOptions = config.get<DbConfig>('db');
  const connection = await initConnection({ entities: ['entity/models/*.js'], ...connectionOptions });

  container.register(SERVICES.HEALTHCHECK, { useValue: healthCheck(connection) });

  container.register(DataSource, { useValue: connection });
  container.register('EntityRepository', { useValue: connection.getRepository(Entity) });

  tracing.start();
  const tracer = trace.getTracer(SERVICE_NAME);
  container.register(SERVICES.TRACER, { useValue: tracer });

  const metrics = new Metrics(SERVICE_NAME);
  const meter = metrics.start();
  container.register(SERVICES.METER, { useValue: meter });

  container.register('onSignal', {
    useValue: async (): Promise<void> => {
      await Promise.all([tracing.stop(), metrics.stop(), beforeShutdown(connection)]);
    },
  });
}

export { registerExternalValues };
