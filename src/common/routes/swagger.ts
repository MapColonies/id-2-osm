import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { SwaggerController } from '../controllers/swagger';
import { Services } from '../constants';
import { IConfig, SwaggerConfig } from '../interfaces';

const swaggerRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const controller = dependencyContainer.resolve(SwaggerController);
  const config = dependencyContainer.resolve<IConfig>(Services.CONFIG);
  const swaggerConfig = config.get<SwaggerConfig>('swaggerConfig');

  const swaggerRouter = Router();

  const swaggerJsonPath = swaggerConfig.basePath + swaggerConfig.jsonPath;
  if (swaggerJsonPath && swaggerJsonPath !== '') {
    swaggerRouter.get(swaggerJsonPath, controller.serveJson.bind(controller));
  }

  const openapiUiPath = swaggerConfig.basePath + swaggerConfig.uiPath;
  swaggerRouter.use(openapiUiPath, controller.uiMiddleware, controller.serveUi);

  return swaggerRouter;
};

export { swaggerRouterFactory };
