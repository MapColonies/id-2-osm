import { getOtelMixin } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import jsLogger, { Logger } from '@map-colonies/js-logger';
import { HealthCheck } from '@godaddy/terminus';
import { Registry } from 'prom-client';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import { InjectionObject, registerDependencies } from '@common/dependencyRegistration';
import { HEALTHCHECK, ON_SIGNAL, SERVICES, SERVICE_NAME } from '@common/constants';
import { getTracing } from '@common/tracing';
import { instancePerContainerCachingFactory } from 'tsyringe';
import { DataSource, Repository } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { CleanupRegistry } from '@map-colonies/cleanup-registry';
import { ENTITY_ROUTER_SYMBOL, entityRouterFactory } from './entity/routes/entityRouter';
import { ConfigType, getConfig } from './common/config';
import { DATA_SOURCE_PROVIDER, dataSourceFactory, getDbHealthCheckFunction } from './common/db/connection';
import { Entity, ENTITY_REPOSITORY_SYMBOL } from './entity/models/entity';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const cleanupRegistry = new CleanupRegistry();

  try {
    const configInstance = getConfig();
    const loggerConfig = configInstance.get('telemetry.logger');
    const logger = jsLogger({ ...loggerConfig, mixin: getOtelMixin() });

    const dependencies: InjectionObject<unknown>[] = [
      { token: SERVICES.CONFIG, provider: { useValue: configInstance } },
      { token: SERVICES.LOGGER, provider: { useValue: logger } },
      {
        token: SERVICES.CLEANUP_REGISTRY,
        provider: { useValue: cleanupRegistry },
        postInjectionHook(container): void {
          const logger = container.resolve<Logger>(SERVICES.LOGGER);
          const cleanupRegistryLogger = logger.child({ subComponent: 'cleanupRegistry' });

          cleanupRegistry.on('itemFailed', (id, error, msg) => cleanupRegistryLogger.error({ msg, itemId: id, err: error }));
          cleanupRegistry.on('itemCompleted', (id) => cleanupRegistryLogger.info({ itemId: id, msg: 'cleanup finished for item' }));
          cleanupRegistry.on('finished', (status) => cleanupRegistryLogger.info({ msg: `cleanup registry finished cleanup`, status }));
        },
      },
      {
        token: SERVICES.TRACER,
        provider: {
          useFactory: instancePerContainerCachingFactory((container) => {
            const cleanupRegistry = container.resolve<CleanupRegistry>(SERVICES.CLEANUP_REGISTRY);
            cleanupRegistry.register({ id: SERVICES.TRACER, func: getTracing().stop.bind(getTracing()) });
            const tracer = trace.getTracer(SERVICE_NAME);
            return tracer;
          }),
        },
      },
      {
        token: SERVICES.METRICS,
        provider: {
          useFactory: instancePerContainerCachingFactory((container) => {
            const metricsRegistry = new Registry();
            const config = container.resolve<ConfigType>(SERVICES.CONFIG);
            config.initializeMetrics(metricsRegistry);
            return metricsRegistry;
          }),
        },
      },
      { token: ENTITY_ROUTER_SYMBOL, provider: { useFactory: entityRouterFactory } },
      {
        token: ON_SIGNAL,
        provider: {
          useValue: cleanupRegistry.trigger.bind(cleanupRegistry),
        },
      },
      {
        token: DATA_SOURCE_PROVIDER,
        provider: {
          useFactory: instancePerContainerCachingFactory(dataSourceFactory),
        },
        postInjectionHook: async (deps: DependencyContainer): Promise<void> => {
          const dataSource = deps.resolve<DataSource>(DATA_SOURCE_PROVIDER);
          if (!dataSource.isInitialized) {
            await dataSource.initialize();
            initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });
            addTransactionalDataSource(dataSource);
            cleanupRegistry.register({ id: DATA_SOURCE_PROVIDER, func: dataSource.destroy.bind(dataSource) });
          }
        },
      },
      {
        token: ENTITY_REPOSITORY_SYMBOL,
        provider: {
          useFactory(container): Repository<Entity> {
            const dataSource = container.resolve<DataSource>(DATA_SOURCE_PROVIDER);
            return dataSource.getRepository(Entity);
          },
        },
      },
      {
        token: HEALTHCHECK,
        provider: {
          useFactory: (depContainer): HealthCheck => {
            const dataSource = depContainer.resolve<DataSource>(DATA_SOURCE_PROVIDER);
            return getDbHealthCheckFunction(dataSource);
          },
        },
      },
    ];

    const container = await registerDependencies(dependencies, options?.override, options?.useChild);
    return container;
  } catch (error) {
    await cleanupRegistry.trigger();
    throw error;
  }
};
