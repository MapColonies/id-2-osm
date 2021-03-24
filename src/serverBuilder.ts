import express from 'express';
import bodyParser from 'body-parser';
import { container, inject, injectable } from 'tsyringe';
import { middleware as OpenApiMiddleware } from 'express-openapi-validator';
import { getErrorHandlerMiddleware } from '@map-colonies/error-express-handler';
import { OpenapiRouterConfig, OpenapiViewerRouter } from '@map-colonies/openapi-express-viewer';
import { Services } from './common/constants';
import { IConfig, ILogger } from './common/interfaces';
import { entityRouterFactory } from './entity/routes/entityRouter';

@injectable()
export class ServerBuilder {
  private readonly serverInstance: express.Application;

  public constructor(@inject(Services.CONFIG) private readonly config: IConfig, @inject(Services.LOGGER) private readonly logger: ILogger) {
    this.serverInstance = express();
  }

  public build(): express.Application {
    this.registerPreRoutesMiddleware();
    this.buildRoutes();
    this.registerPostRoutesMiddleware();

    return this.serverInstance;
  }

  private buildRoutes(): void {
    this.buildDocsRoutes();
    this.serverInstance.use('/entity', entityRouterFactory(container));
  }

  private buildDocsRoutes(): void {
    const openapiRouter = new OpenapiViewerRouter(this.config.get<OpenapiRouterConfig>('openapiConfig'));
    openapiRouter.setup();
    this.serverInstance.use(this.config.get<string>('openapiConfig.basePath'), openapiRouter.getRouter());
  }

  private registerPreRoutesMiddleware(): void {
    this.serverInstance.use(express.json(this.config.get<bodyParser.Options>('server.request.payload')));

    const ignorePathRegex = new RegExp(`^${this.config.get<string>('openapiConfig.basePath')}/.*`, 'i');
    const apiSpecPath = this.config.get<string>('openapiConfig.filePath');
    this.serverInstance.use(OpenApiMiddleware({ apiSpec: apiSpecPath, validateRequests: true, ignorePaths: ignorePathRegex }));

    this.registerPostRoutesMiddleware();
  }

  private registerPostRoutesMiddleware(): void {
    this.serverInstance.use(getErrorHandlerMiddleware((message) => this.logger.log('error', message)));
  }
}
