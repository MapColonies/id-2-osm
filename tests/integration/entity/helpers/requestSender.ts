import * as supertest from 'supertest';

export class EntityRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async createEntity(entity: { osmId?: unknown; externalId?: unknown }): Promise<supertest.Response> {
    return supertest.agent(this.app).post('/entity').set('Content-Type', 'application/json').send(entity);
  }

  public async postBulk(body: { action: unknown; payload: { osmId?: unknown; externalId?: unknown } | unknown[] }): Promise<supertest.Response> {
    return supertest.agent(this.app).post('/entity/bulk').set('Content-Type', 'application/json').send(body);
  }

  public async getEntity(externalId: string, responseType = 'application/json'): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/entity/${externalId}`).set('Content-Type', 'application/json').accept(responseType);
  }

  public async deleteEntity(externalId: string): Promise<supertest.Response> {
    return supertest.agent(this.app).delete(`/entity/${externalId}`).set('Content-Type', 'application/json');
  }
}
