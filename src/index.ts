// this import must be called before the first import of tsyringe
import 'reflect-metadata';
import './common/tracing';
import { createServer } from 'http';
import config from 'config';
import { createTerminus } from '@godaddy/terminus';
import { Logger } from '@map-colonies/js-logger';
import { DEFAULT_SERVER_PORT, SERVICES } from './common/constants';
import { getApp } from './app';

const port: number = config.get<number>('server.port') || DEFAULT_SERVER_PORT;

void getApp()
  .then(({ app, container }) => {
    const logger = container.resolve<Logger>(SERVICES.LOGGER);
    const server = createTerminus(createServer(app), {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      healthChecks: { '/liveness': container.resolve(SERVICES.HEALTHCHECK) },
      onSignal: container.resolve('onSignal'),
    });
    server.listen(port, () => {
      logger.info(`app started on port ${port}`);
    });
  })
  .catch((error: Error) => {
    console.error('😢 - failed initializing the server');
    console.error(error.message);
  });
