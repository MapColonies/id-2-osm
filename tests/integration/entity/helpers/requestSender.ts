import * as supertest from 'supertest';
import { Application } from 'express';

import { container } from 'tsyringe';
import { ServerBuilder } from '../../../../src/serverBuilder';

export function getApp(): Application {
  const builder = container.resolve<ServerBuilder>(ServerBuilder);
  return builder.build();
}

export function getMockedRepoApp(repo: unknown): Application {
  container.register('EntityRepository', { useValue: repo });
  const builder = container.resolve<ServerBuilder>(ServerBuilder);
  return builder.build();
}

export async function createEntity(app: Application, entity: { osmId?: unknown; externalId?: unknown }): Promise<supertest.Response> {
  return supertest.agent(app).post('/entity').set('Content-Type', 'application/json').send(entity);
}
