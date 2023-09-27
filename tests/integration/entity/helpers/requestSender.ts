import config from 'config';
import client from 'prom-client';
import { Application } from 'express';
import * as supertest from 'supertest';
import { getApp } from '../../../../src/app';
import { DbConfig } from '../../../../src/common/interfaces';
import { initConnection } from '../../../../src/common/db/connection';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { SERVICES, METRICS_REGISTRY } from '../../../../src/common/constants';
import { DataSource } from 'typeorm';
import { Entity } from '../../../../src/entity/models/entity';

export class EntityRequestSender {
  public async createEntity(app: Application, entity: { osmId?: unknown; externalId?: unknown }): Promise<supertest.Response> {
    return supertest.agent(app).post('/entity').set('Content-Type', 'application/json').send(entity);
  }

  public async postBulk(
    app: Application,
    body: { action: unknown; payload: { osmId?: unknown; externalId?: unknown } | unknown[] }
  ): Promise<supertest.Response> {
    return supertest.agent(app).post('/entity/bulk').set('Content-Type', 'application/json').send(body);
  }

  public async getEntity(app: Application, externalId: string, responseType = 'application/json'): Promise<supertest.Response> {
    return supertest.agent(app).get(`/entity/${externalId}`).set('Content-Type', 'application/json').accept(responseType);
  }

  public async deleteEntity(app: Application, externalId: string): Promise<supertest.Response> {
    return supertest.agent(app).delete(`/entity/${externalId}`).set('Content-Type', 'application/json');
  }

  public async getMockedRepoApp(repo: unknown) {
    const connectionOptions = config.get<DbConfig>('db');
    const connection = await initConnection({ entities: ['src/entity/models/*.ts'], ...connectionOptions });
    connection.synchronize();
    const app = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
        { token: DataSource, provider: { useValue: connection } },
        { token: 'EntityRepository', provider: { useValue: repo } },
        { token: METRICS_REGISTRY, provider: { useValue: new client.Registry() } },
      ],
      useChild: true,
    });
    return app.app;
  }

  public async getApp() {
    const connectionOptions = config.get<DbConfig>('db');
    const connection = await initConnection({ entities: ['src/entity/models/*.ts'], ...connectionOptions });
    connection.synchronize();
    const app = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
        { token: DataSource, provider: { useValue: connection } },
        { token: 'EntityRepository', provider: { useValue: connection.getRepository(Entity) } },
        { token: METRICS_REGISTRY, provider: { useValue: new client.Registry() } },
      ],
      useChild: true,
    });
    return app;
  }
}
