import { RequestHandler, Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { swaggerRouterFactory } from './common/routes/swagger';
import { entityRouterFactory } from './entity/routes/entityRouter';

interface Route {
  name: string;
  path: string;
  middlewares?: RequestHandler[];
  routerFactory: FactoryFunction<Router>;
}

export enum RouteNames {
  SWAGGER = 'swagger',
  ENTITY = 'entity',
}

const routes: Route[] = [
  { name: RouteNames.ENTITY, path: '/entity', routerFactory: entityRouterFactory },
  { name: RouteNames.SWAGGER, path: '/', routerFactory: swaggerRouterFactory },
];
export { routes };
