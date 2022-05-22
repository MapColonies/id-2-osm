// this import must be called before the first import of tsyring
import 'reflect-metadata';
import http from 'http';
import { container } from 'tsyringe';
import config from 'config';
import { createTerminus, HealthCheck } from '@godaddy/terminus';
import { Logger } from '@map-colonies/js-logger';
import { DEFAULT_SERVER_PORT, SERVICES } from './common/constants';
import { IServerConfig } from './common/interfaces';
import { getApp } from './app';

const serverConfig = config.get<IServerConfig>('server');
const port: number = parseInt(serverConfig.port) || DEFAULT_SERVER_PORT;

void getApp()
  .then((app) => {
    const logger = container.resolve<Logger>(SERVICES.LOGGER);
    const healthCheck = container.resolve<HealthCheck>(SERVICES.HEALTHCHECK);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const server = createTerminus(http.createServer(app), { healthChecks: { '/liveness': healthCheck, onSignal: container.resolve('onSignal') } });

    server.listen(port, () => {
      logger.info(`app started on port ${port}`);
    });
  })
  .catch((error: Error) => {
    console.error('😢 - failed initializing the server');
    console.error(error.message);
  });
