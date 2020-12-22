import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { validate } from 'openapi-validator-middleware';
import { EntityController } from '../controllers/entityController';

const entityRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(EntityController);

  router.get('/', validate, controller.get.bind(controller));

  return router;
};

export { entityRouterFactory };
