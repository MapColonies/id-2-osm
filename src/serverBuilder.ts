import express from 'express';
import bodyParser from 'body-parser';
import { initAsync as validatorInit } from 'openapi-validator-middleware';
import { container, inject, injectable } from 'tsyringe';
import { middleware as OpenApiMiddleware} from 'express-openapi-validator'
import { RequestLogger } from './common/middlewares/RequestLogger';
import { ErrorHandler } from './common/middlewares/ErrorHandler';
import { Services } from './common/constants';
import { IConfig, ILogger } from './common/interfaces';
import { routes } from './routes';

@injectable()
export class ServerBuilder {
  private readonly serverInstance = express();

  public constructor(
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(Services.CONFIG) private readonly config: IConfig,
    private readonly requestLogger: RequestLogger,
    private readonly errorHandler: ErrorHandler
  ) {
    this.serverInstance = express();
  }

  public build(): express.Application {
    //initiate swagger validator
    // await validatorInit(this.config.get('swaggerConfig.filePath'), {contentTypeValidation: true});

    this.registerMiddleware();
    this.buildRoutes();

    return this.serverInstance;
  }

  private buildRoutes(): void {
    routes.forEach((route) => {
      const middlewares = route.middlewares ?? [];
      this.serverInstance.use(route.path, ...middlewares, route.routerFactory(container));
    });
  }

  private registerMiddleware(): void {
    this.serverInstance.use(bodyParser.json());
    this.serverInstance.use(OpenApiMiddleware({apiSpec: this.config.get('swaggerConfig.filePath'), validateRequests: true}))
    this.serverInstance.use(this.requestLogger.getLoggerMiddleware());
    this.serverInstance.use(this.errorHandler.getErrorHandlerMiddleware());
  }
}
