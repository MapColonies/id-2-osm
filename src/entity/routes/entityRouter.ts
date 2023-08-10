import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { EntityController } from '../controllers/entityController';

const entityRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(EntityController);

  router.post('/', controller.post);
  router.post('/bulk', controller.postBulk);
  router.get('/:externalId', controller.get);
  router.delete('/:externalId', controller.delete);

  return router;
};

export const ENTITY_ROUTER_SYMBOL = Symbol('entityRouterFactory');

export { entityRouterFactory };
