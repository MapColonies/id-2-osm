import config, { IConfig } from 'config';
import { DataSource } from 'typeorm';
import { instancePerContainerCachingFactory } from 'tsyringe';
import client from 'prom-client';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { getOtelMixin, Metrics } from '@map-colonies/telemetry';
import { HealthCheck } from '@godaddy/terminus';
import { trace, metrics as OtelMetrics } from '@opentelemetry/api';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import { SERVICES, SERVICE_NAME, DB_CONNECTION_TIMEOUT, CONNECTION, METRICS_REGISTRY } from './common/constants';
import { Entity } from './entity/models/entity';
import { promiseTimeout } from './common/utils/promiseTimeout';
import { DbConfig } from './common/interfaces';
import { initConnection } from './common/db/connection';
import { tracing } from './common/tracing';
import { entityRouterFactory, ENTITY_ROUTER_SYMBOL } from './entity/routes/entityRouter';
import { InjectionObject, Providers, registerDependencies } from './common/dependencyRegistration';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

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
    connection.destroy;
  };
};

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  const logger = jsLogger({ ...loggerConfig, mixin: getOtelMixin() });

  const connectionOptions = config.get<DbConfig>('db');
  const connection = await initConnection({ entities: ['entity/models/*.js'], ...connectionOptions });

  const metrics = new Metrics();
  metrics.start();

  const tracer = trace.getTracer(SERVICE_NAME);
  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: config } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    {
      token: METRICS_REGISTRY,
      provider: {
        useFactory: instancePerContainerCachingFactory((container) => {
          const config = container.resolve<IConfig>(SERVICES.CONFIG);

          client.register.setDefaultLabels({ project: config.get<string>('app.projectName') });
          return client.register;
        }),
      },
    },
    {
      token: CONNECTION,
      provider: {
        useFactory: instancePerContainerCachingFactory(async (container) => {
          const config = container.resolve<IConfig>(SERVICES.CONFIG);
          const connectionOptions = config.get<DbConfig>('db');
          await initConnection({ entities: ['entity/models/*.js'], ...connectionOptions });
        }),
      },
    },
    { token: DataSource, provider: { useValue: connection } },
    {
      token: SERVICES.HEALTHCHECK,
      provider: {
        useFactory: instancePerContainerCachingFactory((container) => {
          const connection = container.resolve<DataSource>(CONNECTION);
          return healthCheck(connection);
        }),
      },
    },
    { token: 'EntityRepository', provider: { useValue: connection.getRepository(Entity) } },
    { token: SERVICES.METER, provider: { useValue: OtelMetrics.getMeterProvider().getMeter(SERVICE_NAME) } },
    { token: ENTITY_ROUTER_SYMBOL, provider: { useFactory: entityRouterFactory } },
    {
      token: 'onSignal',
      provider: {
        useFactory: instancePerContainerCachingFactory(async (container): Promise<void> => {
          const connection = container.resolve<DataSource>(CONNECTION);
          await Promise.all([tracing.stop(), metrics.stop(), beforeShutdown(connection)]);
        }),
      },
    },
  ];
  return registerDependencies(dependencies, options?.override, options?.useChild);
};
