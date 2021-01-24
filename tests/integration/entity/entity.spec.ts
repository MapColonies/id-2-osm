import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import faker from 'faker';
import { Application } from 'express';
import { QueryFailedError } from 'typeorm';
import { registerTestValues } from '../testContainerConfig';
import { createFakeEntity, createOsmId } from '../../helpers/helpers';
import * as requestSender from './helpers/requestSender';
import { createDbEntity } from './helpers/db';

describe('entity', function () {
  let app: Application;
  beforeAll(async function () {
    await registerTestValues();
    app = requestSender.getApp();
  });

  afterAll(function () {
    container.reset();
  });
  describe('POST /entity', function () {
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
        const response = await requestSender.createEntity(app, { osmId: createOsmId() });

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message', "request.body should have required property 'externalId'");
      });

      it('should return 400 status code and error message if external id is not valid', async function () {
        const response = await requestSender.createEntity(app, { externalId: {}, osmId: createOsmId() });

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message', 'request.body.externalId should be string');
      });
    });

    describe('Sad Path 😥', function () {
      it('should return 422 status code if an entity with the same id exists', async function () {
        const entity = await createDbEntity();
        const response = await requestSender.createEntity(app, entity);

        expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(response.body).toHaveProperty('message', `externalId=${entity.externalId} already exists`);
      });

      it('should return 500 status code if an db exception happens', async function () {
        const findMock = jest.fn().mockRejectedValue(new QueryFailedError('select *', [], new Error('failed')));

        const mockedApp = requestSender.getMockedRepoApp({ findOne: findMock });

        const response = await requestSender.createEntity(mockedApp, createFakeEntity());

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', 'failed');
      });
    });
  });

  describe('POST /entities', function () {
    describe('Happy Path 🙂', function () {
      it('should return 201 status code', async function () {
        const response = await requestSender.createEntities(app, [createFakeEntity()]);

        expect(response.status).toBe(httpStatusCodes.CREATED);
      });
    });

    describe('Bad Path 😡', function () {
      it('should return 400 status code and error message if osm id is missing', async function () {
        const response = await requestSender.createEntities(app, [{ externalId: faker.random.uuid() }]);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message', "request.body[0] should have required property 'osmId'");
      });

      it('should return 400 status code and error message if osm id is not valid', async function () {
        const response = await requestSender.createEntities(app, [{ externalId: faker.random.uuid(), osmId: faker.lorem.word() }]);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message', 'request.body[0].osmId should be integer');
      });

      it('should return 400 status code and error message if external id is missing', async function () {
        const response = await requestSender.createEntities(app, [{ osmId: createOsmId() }]);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message', "request.body[0] should have required property 'externalId'");
      });

      it('should return 400 status code and error message if external id is not valid', async function () {
        const response = await requestSender.createEntities(app, [{ externalId: {}, osmId: createOsmId() }]);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message', 'request.body[0].externalId should be string');
      });
    });

    describe('Sad Path 😥', function () {
      it('should return 422 status code if an entity with the same id exists', async function () {
        const entity = await createDbEntity();
        const response = await requestSender.createEntities(app, [entity]);

        expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(response.body).toHaveProperty('message', `an entity with the following ids: ${JSON.stringify(entity)} already exists`);
      });

      it('should return 500 status code if an db exception happens', async function () {
        const findMock = jest.fn().mockRejectedValue(new QueryFailedError('select *', [], new Error('failed')));

        const mockedApp = requestSender.getMockedRepoApp({ findOne: findMock });

        const response = await requestSender.createEntities(mockedApp, [createFakeEntity()]);

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', 'failed');
      });
    });
  });

  describe('GET /entity', function () {
    describe('Happy Path 🙂', function () {
      it('should return 200 status code and the entity', async function () {
        const entity = await createDbEntity();
        const response = await requestSender.getEntity(app, entity.externalId);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.headers).toHaveProperty('content-type', 'application/json; charset=utf-8');
        expect(response.body).toMatchObject(entity);
      });

      describe('Bad Path 😡', function () {
        it('should return 400 status code and error message external id is too long', async function () {
          const response = await requestSender.getEntity(app, faker.random.alphaNumeric(69));

          expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
          expect(response.body).toHaveProperty('message', 'request.params.externalId should NOT be longer than 68 characters');
        });
      });

      describe('Sad Path 😥', function () {
        it('should return 404 if an entity with the requested id does not exist', async function () {
          const response = await requestSender.getEntity(app, faker.random.alphaNumeric(20));

          expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
          expect(response.body).toHaveProperty('message', `Entity with given id was not found.`);
        });

        it('should return 500 status code if an db exception happens', async function () {
          const findMock = jest.fn().mockRejectedValue(new QueryFailedError('select *', [], new Error('failed')));
          const mockedApp = requestSender.getMockedRepoApp({ findOne: findMock });
          const response = await requestSender.getEntity(mockedApp, createFakeEntity().externalId);

          expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
          expect(response.body).toHaveProperty('message', 'failed');
        });
      });
    });
  });

  describe('DELETE /entity', function () {
    describe('Happy Path 🙂', function () {
      it('should return 204 status code', async function () {
        const entity = await createDbEntity();
        const response = await requestSender.deleteEntity(app, entity.externalId);

        expect(response.status).toBe(httpStatusCodes.NO_CONTENT);
      });
    });
    describe('Bad Path 😡', function () {
      it('should return 400 status code and error message external id is too long', async function () {
        const response = await requestSender.deleteEntity(app, faker.random.alphaNumeric(69));

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request.params.externalId should NOT be longer than 68 characters');
      });
    });
    describe('Sad Path 😥', function () {
      it('should return 404 if an entity with the requested id does not exist', async function () {
        const response = await requestSender.deleteEntity(app, faker.random.alphaNumeric(20));

        expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
        expect(response.body).toHaveProperty('message', "couldn't find an entity with the given id to delete");
      });

      it('should return 500 status code if an db exception happens', async function () {
        const findMock = jest.fn().mockRejectedValue(new QueryFailedError('select *', [], new Error('failed')));
        const mockedApp = requestSender.getMockedRepoApp({ findOne: findMock });
        const response = await requestSender.deleteEntity(mockedApp, createFakeEntity().externalId);

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', 'failed');
      });
    });
  });
});
