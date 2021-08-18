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
        const response = await requestSender.createEntity(app, { externalId: faker.datatype.uuid() });

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message', "request.body should have required property 'osmId'");
      });

      it('should return 400 status code and error message if osm id is not valid', async function () {
        const response = await requestSender.createEntity(app, { externalId: faker.datatype.uuid(), osmId: faker.lorem.word() });

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

  describe('POST /entity/bulk Action: CREATE', function () {
    describe('Happy Path 🙂', function () {
      it('should return 201 status code', async function () {
        const requestBody = { action: 'create', payload: [createFakeEntity()] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.CREATED);
      });
    });

    describe('Bad Path 😡', function () {
      it('should return 400 status code and error message if osm id is missing', async function () {
        const requestBody = { action: 'create', payload: [{ externalId: faker.datatype.uuid() }] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHavePropertyThatContains('message', `request.body.payload[0] should have required property 'osmId'`);
      });

      it('should return 400 status code and error message if osm id is not valid', async function () {
        const requestBody = { action: 'create', payload: [{ externalId: faker.datatype.uuid(), osmId: faker.lorem.word() }] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHavePropertyThatContains('message', 'request.body.payload[0].osmId should be integer');
      });

      it('should return 400 status code and error message if external id is missing', async function () {
        const requestBody = { action: 'create', payload: [{ osmId: createOsmId() }] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHavePropertyThatContains('message', "request.body.payload[0] should have required property 'externalId'");
      });

      it('should return 400 status code and error message if external id is not valid', async function () {
        const requestBody = { action: 'create', payload: [{ externalId: {}, osmId: createOsmId() }] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHavePropertyThatContains('message', 'request.body.payload[0].externalId should be string');
      });

      it('should return 400 status code and error message if action is delete', async function () {
        const requestBody = { action: 'delete', payload: [{ externalId: faker.datatype.uuid() }] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHavePropertyThatContains('message', 'request.body.payload[0] should be string');
      });

      it('should return 400 status code and error message if action is invalid', async function () {
        const requestBody = { action: 'badAction', payload: [{ externalId: faker.datatype.uuid() }] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHavePropertyThatContains('message', 'request.body.action should be equal to one of the allowed values');
      });

      it('should return 400 status code and error message if payload is empty', async function () {
        const requestBody = { action: 'create', payload: [] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHavePropertyThatContains('message', 'request.body.payload should NOT have fewer than 1 items');
      });
    });

    describe('Sad Path 😥', function () {
      it('should return 422 status code if an entity with the same id exists', async function () {
        const entity = await createDbEntity();
        const requestBody = { action: 'create', payload: [entity] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(response.body).toHaveProperty('message', `an entity with the following ids: ${JSON.stringify(entity)} already exists`);
      });

      it('should return 500 status code if an db exception happens', async function () {
        const findMock = jest.fn().mockRejectedValue(new QueryFailedError('select *', [], new Error('failed')));

        const mockedApp = requestSender.getMockedRepoApp({ findOne: findMock });

        const requestBody = { action: 'create', payload: [createFakeEntity()] };
        const response = await requestSender.postBulk(mockedApp, requestBody);

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', 'failed');
      });
    });
  });

  describe('POST /entity/bulk Action: DELETE', function () {
    describe('Happy Path 🙂', function () {
      it('should return 204 status code', async function () {
        const entity = await createDbEntity();
        const requestBody = { action: 'delete', payload: [entity.externalId] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.NO_CONTENT);
      });
    });
    describe('Bad Path 😡', function () {
      it('should return 400 status code and error message if external id is too long', async function () {
        const requestBody = { action: 'delete', payload: [faker.random.alphaNumeric(69)] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHavePropertyThatContains('message', 'request.body.payload[0] should NOT be longer than 68 characters');
      });

      it('should return 400 status code and error message if external id is not valid', async function () {
        const requestBody = { action: 'delete', payload: [faker.datatype.number()] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHavePropertyThatContains('message', 'request.body.payload[0] should be string');
      });

      it('should return 400 status code and error message if action is create', async function () {
        const requestBody = { action: 'create', payload: [faker.datatype.uuid()] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHavePropertyThatContains('message', 'request.body.payload[0] should be object');
      });

      it('should return 400 status code and error message if action is invalid', async function () {
        const requestBody = { action: 'badAction', payload: [{ externalId: faker.datatype.uuid() }] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHavePropertyThatContains('message', 'request.body.action should be equal to one of the allowed values');
      });

      it('should return 400 status code and error message if payload is empty', async function () {
        const requestBody = { action: 'delete', payload: [] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHavePropertyThatContains('message', 'request.body.payload should NOT have fewer than 1 items');
      });
    });
    describe('Sad Path 😥', function () {
      it('should return 404 if an entity with the requested id does not exist', async function () {
        const randomId = faker.random.alphaNumeric(20);
        const requestBody = { action: 'delete', payload: [randomId] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
        expect(response.body).toHaveProperty('message', `couldn't find one of the specified ids: ${JSON.stringify([randomId])}`);
      });

      it('should return 500 status code if an db exception happens', async function () {
        const findMock = jest.fn().mockRejectedValue(new QueryFailedError('select *', [], new Error('failed')));
        const mockedApp = requestSender.getMockedRepoApp({ findByIds: findMock });
        const requestBody = { action: 'delete', payload: [createFakeEntity().externalId] };
        const response = await requestSender.postBulk(mockedApp, requestBody);

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

      it('should return 200 status code and only the osmId with header of content-type text/plain', async function () {
        const responseType = 'text/plain';
        const entity = await createDbEntity();
        const response = await requestSender.getEntity(app, entity.externalId, responseType);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.headers).toHaveProperty('content-type', 'text/plain; charset=utf-8');
        expect(response.text).toEqual(entity.osmId.toString());
      });

      describe('Bad Path 😡', function () {
        it('should return 400 status code and error message if external id is too long', async function () {
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
      it('should return 400 status code and error message if external id is too long', async function () {
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

  describe('Flow 🌊', function () {
    it('single 1️⃣', async function () {
      const entity = createFakeEntity();
      const postResponse = await requestSender.createEntity(app, entity);

      expect(postResponse.status).toBe(httpStatusCodes.CREATED);

      let getResponse = await requestSender.getEntity(app, entity.externalId);
      expect(getResponse.status).toBe(httpStatusCodes.OK);
      expect(getResponse.body).toEqual(entity);

      const deleteResponse = await requestSender.deleteEntity(app, entity.externalId);
      expect(deleteResponse.status).toBe(httpStatusCodes.NO_CONTENT);

      getResponse = await requestSender.getEntity(app, entity.externalId);
      expect(getResponse.status).toBe(httpStatusCodes.NOT_FOUND);
    });

    it('bulk 📦', async function () {
      const entities = [createFakeEntity(), createFakeEntity()];
      const requestBody = { action: 'create', payload: entities };
      const postResponse = await requestSender.postBulk(app, requestBody);

      expect(postResponse.status).toBe(httpStatusCodes.CREATED);

      await Promise.all(
        entities.map(async (entity) => {
          const getResponse = await requestSender.getEntity(app, entity.externalId);
          expect(getResponse.status).toBe(httpStatusCodes.OK);
          expect(getResponse.body).toEqual(entity);
        })
      );

      const deleteResponse = await requestSender.postBulk(app, {
        action: 'delete',
        payload: entities.map((entity) => entity.externalId),
      });
      expect(deleteResponse.status).toBe(httpStatusCodes.NO_CONTENT);

      await Promise.all(
        entities.map(async (entity) => {
          const getResponse = await requestSender.getEntity(app, entity.externalId);
          expect(getResponse.status).toBe(httpStatusCodes.NOT_FOUND);
        })
      );
    });
  });
});
