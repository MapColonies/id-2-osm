import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { EntityController } from '../controllers/entityController';

const entityRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(EntityController);

  router.post('/', controller.post);
  router.get('/:externalId', controller.get);

  return router;
};

export { entityRouterFactory };
