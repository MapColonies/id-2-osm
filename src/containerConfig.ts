import { getOtelMixin } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import jsLogger from '@map-colonies/js-logger';
import { HealthCheck } from '@godaddy/terminus';
import { Registry } from 'prom-client';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import { InjectionObject, registerDependencies } from '@common/dependencyRegistration';
import { HEALTHCHECK, ON_SIGNAL, SERVICES, SERVICE_NAME } from '@common/constants';
import { getTracing } from '@common/tracing';
import { DataSource } from 'typeorm';
import { ENTITY_ROUTER_SYMBOL, entityRouterFactory } from './entity/routes/entityRouter';
import { getConfig } from './common/config';
import { getDbHealthCheckFunction, initConnection } from './common/db/connection';
import { ENTITY_REPOSITORY_SYMBOL } from './entity/models/entityManager';
import { Entity } from './entity/models/entity';
import { DbConfig } from './common/interfaces';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const configInstance = getConfig();

  const loggerConfig = configInstance.get('telemetry.logger');

  const logger = jsLogger({ ...loggerConfig, mixin: getOtelMixin() });

  const tracer = trace.getTracer(SERVICE_NAME);
  const metricsRegistry = new Registry();
  configInstance.initializeMetrics(metricsRegistry);

  const connectionOptions = configInstance.get('db') as DbConfig;
  const connection = await initConnection(connectionOptions);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: configInstance } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METRICS, provider: { useValue: metricsRegistry } },
    { token: ENTITY_ROUTER_SYMBOL, provider: { useFactory: entityRouterFactory } },
    {
      token: ON_SIGNAL,
      provider: {
        useValue: {
          useValue: async (): Promise<void> => {
            await Promise.all([getTracing().stop(), connection.destroy()]);
          },
        },
      },
    },
    {
      token: HEALTHCHECK,
      provider: {
        useFactory: (depContainer): HealthCheck => {
          const dataSource = depContainer.resolve<DataSource>(DataSource);
          return getDbHealthCheckFunction(dataSource);
        },
      },
    },
    { token: DataSource, provider: { useValue: connection } },
    { token: ENTITY_REPOSITORY_SYMBOL, provider: { useValue: connection.getRepository(Entity) } },
  ];

  return Promise.resolve(registerDependencies(dependencies, options?.override, options?.useChild));
};
