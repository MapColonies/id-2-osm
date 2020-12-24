import express from 'express';
import bodyParser from 'body-parser';
import { container, inject, injectable } from 'tsyringe';
import { middleware as OpenApiMiddleware } from 'express-openapi-validator';
import { RequestLogger } from './common/middlewares/RequestLogger';
import { ErrorHandler } from './common/middlewares/ErrorHandler';
import { Services } from './common/constants';
import { IConfig } from './common/interfaces';
import { entityRouterFactory } from './entity/routes/entityRouter';
import { swaggerRouterFactory } from './common/routes/swagger';

@injectable()
export class ServerBuilder {
  private readonly serverInstance = express();

  public constructor(
    @inject(Services.CONFIG) private readonly config: IConfig,
    private readonly requestLogger: RequestLogger,
    private readonly errorHandler: ErrorHandler
  ) {
    this.serverInstance = express();
  }

  public build(): express.Application {
    this.registerPreRoutesMiddleware();
    this.buildRoutes();
    this.registerPostRoutesMiddleware();

    return this.serverInstance;
  }

  private buildRoutes(): void {
    this.serverInstance.use('/entity', entityRouterFactory(container));
    this.serverInstance.use('/', swaggerRouterFactory(container));
  }

  private registerPreRoutesMiddleware(): void {
    this.serverInstance.use(bodyParser.json());

    const ignorePathRegex = new RegExp(`^${this.config.get<string>('swaggerConfig.basePath')}/.*`, 'i');
    const apiSpecPath = this.config.get<string>('swaggerConfig.filePath');
    this.serverInstance.use(OpenApiMiddleware({ apiSpec: apiSpecPath, validateRequests: true, ignorePaths: ignorePathRegex }));

    this.serverInstance.use(this.requestLogger.getLoggerMiddleware());
  }

  private registerPostRoutesMiddleware(): void {
    this.serverInstance.use(this.errorHandler.getErrorHandlerMiddleware());
  }
}
