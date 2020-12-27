import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import faker from 'faker';
import { Application } from 'express';
import { QueryFailedError } from 'typeorm';
import { createFakeEntity } from '../../helpers';
import { exampleEntity, registerTestValues } from '../testContainerConfig';
import * as requestSender from './helpers/requestSender';

describe('POST /entity', function () {
  let app: Application;
  beforeAll(async function () {
    await registerTestValues();
    app = requestSender.getApp();
  });

  afterAll(function () {
    container.reset();
  });

  describe('Happy Path 🙂', function () {
    it('should return 201 status code', async function () {
      const response = await requestSender.createEntity(app, createFakeEntity());

      expect(response.status).toBe(httpStatusCodes.CREATED);
    });
  });
  describe('Bad Path 😡', function () {
    it('should return 400 status code and error message if osm id is missing', async function () {
      const response = await requestSender.createEntity(app, { externalId: faker.random.uuid() });

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

      expect(response.body).toHaveProperty('message', "request.body should have required property 'osmId'");
    });

    it('should return 400 status code and error message if osm id is not valid', async function () {
      const response = await requestSender.createEntity(app, { externalId: faker.random.uuid(), osmId: faker.lorem.word() });

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

      expect(response.body).toHaveProperty('message', 'request.body.osmId should be integer');
    });

    it('should return 400 status code and error message if external id is missing', async function () {
      const response = await requestSender.createEntity(app, { osmId: faker.random.number() });

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

      expect(response.body).toHaveProperty('message', "request.body should have required property 'externalId'");
    });

    it('should return 400 status code and error message if external id is not valid', async function () {
      const response = await requestSender.createEntity(app, { externalId: {}, osmId: faker.random.number() });

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

      expect(response.body).toHaveProperty('message', 'request.body.externalId should be string');
    });
  });
  describe('Sad Path 😥', function () {
    it('should return 422 status code if an entity with the same id exists', async function () {
      const response = await requestSender.createEntity(app, exampleEntity);

      expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(response.body).toHaveProperty('message', `externalId=${exampleEntity.externalId} already exists`);
    });

    it('should return 500 status code if an db exception happens', async function () {
      const findMock = jest.fn().mockRejectedValue(new QueryFailedError('select *', [], new Error('failed')));
      const mockedApp = requestSender.getMockedRepoApp({ find: findMock });
      const response = await requestSender.createEntity(mockedApp, exampleEntity);

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body).toHaveProperty('message', 'failed');
    });
  });
});
