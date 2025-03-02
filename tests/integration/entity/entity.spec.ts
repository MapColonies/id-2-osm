import httpStatusCodes from 'http-status-codes';
import { DependencyContainer } from 'tsyringe';
import { faker } from '@faker-js/faker';
import { Application } from 'express';
import { QueryFailedError, Repository } from 'typeorm';
import { getApp } from '@src/app';
import { SERVICES } from '@src/common/constants';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { CleanupRegistry } from '@map-colonies/cleanup-registry';
import { ConfigType, getConfig } from '@src/common/config';
import { Entity, ENTITY_REPOSITORY_SYMBOL } from '../../../src/entity/models/entity';
import { BulkActions, BulkCreateRequestBody, BulkDeleteRequestBody, BulkRequestBody } from '../../../src/entity/models/operations';
import { createFakeEntity, createOsmId } from '../../helpers/helpers';
import * as requestSender from './helpers/requestSender';
import { createDbEntity } from './helpers/db';

describe('entity', function () {
  let app: Application;
  let container: DependencyContainer;
  let configInstance: ConfigType;

  beforeAll(async function () {
    configInstance = getConfig();

    const [initializedApp, initializedContainer] = await getApp({
      override: [
        {
          token: SERVICES.CONFIG,
          provider: { useValue: configInstance },
        },
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        {
          token: SERVICES.TRACER,
          provider: {
            useValue: trace.getTracer('test-tracer'),
          },
        },
      ],
      useChild: true,
    });

    app = initializedApp;
    container = initializedContainer;
  });

  beforeEach(function () {
    jest.resetAllMocks();
  });

  afterAll(async function () {
    const registry = container.resolve<CleanupRegistry>(SERVICES.CLEANUP_REGISTRY);
    await registry.trigger();
    container.reset();
  });

  describe('POST /entity', function () {
    describe('Happy Path 🙂', function () {
      it('should return 201 status code', async function () {
        const response = await requestSender.createEntity(app, createFakeEntity());

        expect(response.status).toBe(httpStatusCodes.CREATED);
      });

      it('should return 201 status code even if there is an existing entity with the same osmId', async function () {
        const existingEntity = await createDbEntity(container);
        const newEntity = createFakeEntity();
        const response = await requestSender.createEntity(app, { externalId: newEntity.externalId, osmId: existingEntity.osmId });

        expect(response.status).toBe(httpStatusCodes.CREATED);
      });
    });

    describe('Bad Path 😡', function () {
      it('should return 400 status code and error message if osm id is missing', async function () {
        const response = await requestSender.createEntity(app, { externalId: faker.string.uuid() });

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message', "request/body must have required property 'osmId'");
      });

      it('should return 400 status code and error message if osm id is not valid', async function () {
        const response = await requestSender.createEntity(app, { externalId: faker.string.uuid(), osmId: faker.lorem.word() });

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message', 'request/body/osmId must be integer');
      });

      it('should return 400 status code and error message if external id is missing', async function () {
        const response = await requestSender.createEntity(app, { osmId: createOsmId() });

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message', "request/body must have required property 'externalId'");
      });

      it('should return 400 status code and error message if external id is not valid', async function () {
        const response = await requestSender.createEntity(app, { externalId: {}, osmId: createOsmId() });

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message', 'request/body/externalId must be string');
      });
    });

    describe('Sad Path 😥', function () {
      it('should return 422 status code if an entity with the same externalId exists while osmId is different', async function () {
        const existingEntity = await createDbEntity(container);
        const newEntity = createFakeEntity();
        const response = await requestSender.createEntity(app, { externalId: existingEntity.externalId, osmId: newEntity.osmId });

        expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(response.body).toHaveProperty('message', `externalId=${existingEntity.externalId} already exists`);
      });

      it('should return 500 status code if an db exception happens', async function () {
        const findMock = jest.fn().mockRejectedValue(new QueryFailedError('select *', [], new Error('failed')));

        const [app, container] = await getApp({
          override: [
            {
              token: ENTITY_REPOSITORY_SYMBOL,
              provider: {
                useValue: {
                  findOne: findMock,
                },
              },
            },
            { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
          ],
          useChild: true,
        });

        const response = await requestSender.createEntity(app, createFakeEntity());

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', 'failed');

        await container.dispose();
      });
    });
  });

  describe('POST /entity/bulk Action: CREATE', function () {
    describe('Happy Path 🙂', function () {
      it('should return 201 status code', async function () {
        const requestBody: BulkCreateRequestBody = { action: BulkActions.CREATE, payload: [createFakeEntity()] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.OK);
      });

      it('should return 201 status for entities with the same osmId while different externalId', async function () {
        const entity1 = createFakeEntity();
        const entity2 = createFakeEntity();
        const requestBody: BulkCreateRequestBody = { action: BulkActions.CREATE, payload: [entity1, { ...entity2, osmId: entity1.osmId }] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.OK);
      });

      it('should return 201 status code even if there is an existing entity with the same osmId', async function () {
        const existingEntity = await createDbEntity(container);
        const newEntity = createFakeEntity();
        const requestBody: BulkCreateRequestBody = {
          action: BulkActions.CREATE,
          payload: [{ externalId: newEntity.externalId, osmId: existingEntity.osmId }],
        };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.OK);
      });
    });

    describe('Bad Path 😡', function () {
      it('should return 400 status code and error message if osm id is missing', async function () {
        const requestBody = { action: BulkActions.CREATE, payload: [{ externalId: faker.string.uuid() }] } as unknown as BulkCreateRequestBody;
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHavePropertyThatContains('message', `request/body/payload/0 must have required property 'osmId'`);
      });

      it('should return 400 status code and error message if osm id is not valid', async function () {
        const requestBody = {
          action: BulkActions.CREATE,
          payload: [{ externalId: faker.string.uuid(), osmId: faker.lorem.word() }],
        } as unknown as BulkCreateRequestBody;
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHavePropertyThatContains('message', 'request/body/payload/0/osmId must be integer');
      });

      it('should return 400 status code and error message if external id is missing', async function () {
        const requestBody = { action: BulkActions.CREATE, payload: [{ osmId: createOsmId() }] } as unknown as BulkCreateRequestBody;
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHavePropertyThatContains('message', "request/body/payload/0 must have required property 'externalId'");
      });

      it('should return 400 status code and error message if external id is not valid', async function () {
        const requestBody = { action: BulkActions.CREATE, payload: [{ externalId: {}, osmId: createOsmId() }] } as unknown as BulkCreateRequestBody;
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHavePropertyThatContains('message', 'request/body/payload/0/externalId must be string');
      });

      it('should return 400 status code and error message if action is delete', async function () {
        const requestBody = { action: BulkActions.DELETE, payload: [{ externalId: faker.string.uuid() }] } as unknown as BulkDeleteRequestBody;
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHavePropertyThatContains('message', 'request/body/payload/0 must be string');
      });

      it('should return 400 status code and error message if action is invalid', async function () {
        const requestBody = { action: 'badAction', payload: [{ externalId: faker.string.uuid() }] } as unknown as BulkCreateRequestBody;
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHavePropertyThatContains('message', 'request/body/action must be equal to one of the allowed values');
      });

      it('should return 400 status code and error message if payload is empty', async function () {
        const requestBody: BulkCreateRequestBody = { action: BulkActions.CREATE, payload: [] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'single operation request payload must NOT have fewer than 1 items');
      });
    });

    describe('Sad Path 😥', function () {
      it('should return 422 status code if an entity with the same ids exists', async function () {
        const existingEntity = await createDbEntity(container);
        const requestBody: BulkCreateRequestBody = { action: BulkActions.CREATE, payload: [createFakeEntity(), existingEntity, createFakeEntity()] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(response.body).toHaveProperty('message', `an entity with the following ids: ${JSON.stringify(existingEntity)} already exists`);
      });

      it('should return 422 status code if an entity with the same external exists', async function () {
        const existingEntity = await createDbEntity(container);
        const newEntity = createFakeEntity();
        const requestBody: BulkCreateRequestBody = {
          action: BulkActions.CREATE,
          payload: [{ externalId: existingEntity.externalId, osmId: newEntity.osmId }],
        };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(response.body).toHaveProperty('message', `an entity with the following ids: ${JSON.stringify(existingEntity)} already exists`);
      });

      it('should return 500 status code if an db exception happens', async function () {
        const findMock = jest.fn().mockRejectedValue(new QueryFailedError('select *', [], new Error('failed')));

        const [app, container] = await getApp({
          override: [
            {
              token: ENTITY_REPOSITORY_SYMBOL,
              provider: {
                useValue: {
                  findOne: findMock,
                },
              },
            },
            { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
          ],
          useChild: true,
        });

        const requestBody: BulkCreateRequestBody = { action: BulkActions.CREATE, payload: [createFakeEntity()] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', 'failed');

        await container.dispose();
      });
    });
  });

  describe('POST /entity/bulk Action: DELETE', function () {
    describe('Happy Path 🙂', function () {
      it('should return 200 status code', async function () {
        const entity = await createDbEntity(container);
        const requestBody: BulkDeleteRequestBody = { action: BulkActions.DELETE, payload: [entity.externalId] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.OK);
      });

      it('should return 200 status code for entities consisting of the same osmIds while different externalId', async function () {
        const { osmId } = createFakeEntity();
        const entity1 = await createDbEntity(container, { osmId });
        const entity2 = await createDbEntity(container, { osmId });

        const requestBody: BulkDeleteRequestBody = { action: BulkActions.DELETE, payload: [entity1.externalId, entity2.externalId] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.OK);
      });
    });

    describe('Bad Path 😡', function () {
      it('should return 400 status code and error message if external id is too long', async function () {
        const requestBody: BulkDeleteRequestBody = { action: BulkActions.DELETE, payload: [faker.string.alphanumeric(69)] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHavePropertyThatContains('message', 'request/body/payload/0 must NOT have more than 68 characters');
      });

      it('should return 400 status code and error message if external id is not valid', async function () {
        const requestBody = { action: BulkActions.DELETE, payload: [faker.number.int()] } as unknown as BulkDeleteRequestBody;
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHavePropertyThatContains('message', 'request/body/payload/0 must be string');
      });

      it('should return 400 status code and error message if action is create', async function () {
        const requestBody = { action: BulkActions.CREATE, payload: [faker.string.uuid()] } as unknown as BulkCreateRequestBody;
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHavePropertyThatContains('message', 'request/body/payload/0 must be object');
      });

      it('should return 400 status code and error message if action is invalid', async function () {
        const requestBody = { action: 'badAction', payload: [{ externalId: faker.string.uuid() }] } as unknown as BulkCreateRequestBody;
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);

        expect(response.body).toHavePropertyThatContains('message', 'request/body/action must be equal to one of the allowed values');
      });

      it('should return 400 status code and error message if payload is empty', async function () {
        const requestBody: BulkDeleteRequestBody = { action: BulkActions.DELETE, payload: [] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'single operation request payload must NOT have fewer than 1 items');
      });
    });

    describe('Sad Path 😥', function () {
      it('should return 404 if an entity with the requested id does not exist', async function () {
        const randomId = faker.string.alphanumeric(20);
        const requestBody: BulkDeleteRequestBody = { action: BulkActions.DELETE, payload: [randomId] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
        expect(response.body).toHaveProperty('message', `couldn't find one of the specified ids: ${JSON.stringify([randomId])}`);
      });

      it('should return 500 status code if an db exception happens', async function () {
        const findByMock = jest.fn().mockRejectedValue(new QueryFailedError('select *', [], new Error('failed')));
        const [app, container] = await getApp({
          override: [
            {
              token: ENTITY_REPOSITORY_SYMBOL,
              provider: {
                useValue: {
                  findBy: findByMock,
                },
              },
            },
            { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
          ],
          useChild: true,
        });
        const requestBody: BulkDeleteRequestBody = { action: BulkActions.DELETE, payload: [createFakeEntity().externalId] };
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', 'failed');

        await container.dispose();
      });
    });
  });

  describe('POST /entity/bulk Action: Multi Operation', function () {
    describe('Happy Path 🙂', function () {
      it('should return 200 status code', async function () {
        const entityForCreation = createFakeEntity();
        const entityForDeletion = await createDbEntity(container);
        const requestBody: BulkRequestBody = [
          { action: BulkActions.CREATE, payload: [entityForCreation] },
          { action: BulkActions.DELETE, payload: [entityForDeletion.externalId] },
        ];
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.OK);

        const getCreatedResponse = await requestSender.getEntity(app, entityForCreation.externalId);
        expect(getCreatedResponse.status).toBe(httpStatusCodes.OK);

        const getDeletedResponse = await requestSender.getEntity(app, entityForDeletion.externalId);
        expect(getDeletedResponse.status).toBe(httpStatusCodes.NOT_FOUND);
      });

      it('should return 200 status code for payloads consisting of the same osmId on different externalIds', async function () {
        const { osmId: createOsmId } = createFakeEntity();
        const { osmId: deleteOsmId } = createFakeEntity();
        const entityForCreation1 = createFakeEntity({ osmId: createOsmId });
        const entityForCreation2 = createFakeEntity({ osmId: createOsmId });
        const entityForDeletion1 = await createDbEntity(container, { osmId: deleteOsmId });
        const entityForDeletion2 = await createDbEntity(container, { osmId: deleteOsmId });

        const requestBody: BulkRequestBody = [
          { action: BulkActions.CREATE, payload: [entityForCreation1, entityForCreation2] },
          { action: BulkActions.DELETE, payload: [entityForDeletion1.externalId, entityForDeletion2.externalId] },
        ];
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.OK);

        const getCreatedResponse1 = await requestSender.getEntity(app, entityForCreation1.externalId);
        expect(getCreatedResponse1.status).toBe(httpStatusCodes.OK);

        const getCreatedResponse2 = await requestSender.getEntity(app, entityForCreation2.externalId);
        expect(getCreatedResponse2.status).toBe(httpStatusCodes.OK);

        const getDeletedResponse1 = await requestSender.getEntity(app, entityForDeletion1.externalId);
        expect(getDeletedResponse1.status).toBe(httpStatusCodes.NOT_FOUND);

        const getDeletedResponse2 = await requestSender.getEntity(app, entityForDeletion1.externalId);
        expect(getDeletedResponse2.status).toBe(httpStatusCodes.NOT_FOUND);
      });

      it('should return 200 status code for a tuple of delete and then create', async function () {
        const entityForCreation = createFakeEntity();
        const entityForDeletion = await createDbEntity(container);
        const requestBody: BulkRequestBody = [
          { action: BulkActions.DELETE, payload: [entityForDeletion.externalId] },
          { action: BulkActions.CREATE, payload: [entityForCreation] },
        ];
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.OK);

        const getCreatedResponse = await requestSender.getEntity(app, entityForCreation.externalId);
        expect(getCreatedResponse.status).toBe(httpStatusCodes.OK);

        const getDeletedResponse = await requestSender.getEntity(app, entityForDeletion.externalId);
        expect(getDeletedResponse.status).toBe(httpStatusCodes.NOT_FOUND);
      });

      it('should return 200 status code for a tuple of create and empty delete', async function () {
        const entityForCreation = createFakeEntity();
        const requestBody: BulkRequestBody = [
          { action: BulkActions.CREATE, payload: [entityForCreation] },
          { action: BulkActions.DELETE, payload: [] },
        ];
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.OK);

        const getCreatedResponse = await requestSender.getEntity(app, entityForCreation.externalId);
        expect(getCreatedResponse.status).toBe(httpStatusCodes.OK);
      });

      it('should return 200 status code for a tuple of empty create and delete', async function () {
        const entityForDeletion = await createDbEntity(container);
        const requestBody: BulkRequestBody = [
          { action: BulkActions.DELETE, payload: [entityForDeletion.externalId] },
          { action: BulkActions.CREATE, payload: [] },
        ];
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.OK);

        const getDeletedResponse = await requestSender.getEntity(app, entityForDeletion.externalId);
        expect(getDeletedResponse.status).toBe(httpStatusCodes.NOT_FOUND);
      });
    });

    describe('Bad Path 😡', function () {
      it('should return 400 status code for a tuple of two creations', async function () {
        const entityForCreation1 = createFakeEntity();
        const entityForCreation2 = createFakeEntity();
        const requestBody: BulkRequestBody = [
          { action: BulkActions.CREATE, payload: [entityForCreation1] },
          { action: BulkActions.CREATE, payload: [entityForCreation2] },
        ];
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'multi operation request payload must be a tuple of create bulk and delete bulk');
      });

      it('should return 400 status code for a tuple of two deletions', async function () {
        const entityForDeletion1 = await createDbEntity(container);
        const entityForDeletion2 = await createDbEntity(container);

        const requestBody: BulkRequestBody = [
          { action: BulkActions.DELETE, payload: [entityForDeletion1.externalId] },
          { action: BulkActions.DELETE, payload: [entityForDeletion2.externalId] },
        ];
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'multi operation request payload must be a tuple of create bulk and delete bulk');
      });

      it('should return 400 status code for a tuple of fewer than 2 items', async function () {
        const entityForDeletion1 = await createDbEntity(container);

        const requestBody = [{ action: BulkActions.DELETE, payload: [entityForDeletion1.externalId] }] as unknown as BulkRequestBody;
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHavePropertyThatContains('message', 'must NOT have fewer than 2 items');
      });

      it('should return 400 status code for a tuple of more than 2 items', async function () {
        const entityForCreation1 = createFakeEntity();
        const entityForCreation2 = createFakeEntity();
        const entityForCreation3 = createFakeEntity();

        const requestBody = [
          { action: BulkActions.CREATE, payload: [entityForCreation1] },
          { action: BulkActions.CREATE, payload: [entityForCreation2] },
          { action: BulkActions.CREATE, payload: [entityForCreation3] },
        ] as unknown as BulkRequestBody;
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHavePropertyThatContains('message', 'must NOT have more than 2 items');
      });

      it('should return 400 status code for multi request consisting the same ids', async function () {
        const entity = createFakeEntity();

        const requestBody: BulkRequestBody = [
          { action: BulkActions.CREATE, payload: [entity] },
          { action: BulkActions.DELETE, payload: [entity.externalId] },
        ];
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHavePropertyThatContains('message', 'duplicate externalId found in multi operation request payload');
      });

      it('should return 400 status code for multi request consisting empty payloads', async function () {
        const requestBody: BulkRequestBody = [
          { action: BulkActions.CREATE, payload: [] },
          { action: BulkActions.DELETE, payload: [] },
        ];
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'multi operation request payloads must NOT have fewer than 1 items');
      });
    });

    describe('Sad Path 😥', function () {
      it('should in multi operation bulks rollback and return 404 if an entity for deletion not found', async function () {
        const randomId = faker.string.alphanumeric(20);
        const entityForCreation = createFakeEntity();
        const requestBody: BulkRequestBody = [
          { action: BulkActions.CREATE, payload: [entityForCreation] },
          { action: BulkActions.DELETE, payload: [randomId] },
        ];
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
        expect(response.body).toHaveProperty('message', `couldn't find one of the specified ids: ${JSON.stringify([randomId])}`);

        const getResponse = await requestSender.getEntity(app, entityForCreation.externalId);
        expect(getResponse.status).toBe(httpStatusCodes.NOT_FOUND);
      });

      it('should in multi operation bulks rollback and return 404 if an entity for creation already exist', async function () {
        const entityForCreation = await createDbEntity(container);
        const entityForDeletion = await createDbEntity(container);
        const requestBody: BulkRequestBody = [
          { action: BulkActions.DELETE, payload: [entityForDeletion.externalId] },
          { action: BulkActions.CREATE, payload: [entityForCreation] },
        ];
        const response = await requestSender.postBulk(app, requestBody);

        expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(response.body).toHaveProperty('message', `an entity with the following ids: ${JSON.stringify(entityForCreation)} already exists`);

        const getResponse = await requestSender.getEntity(app, entityForDeletion.externalId);
        expect(getResponse.status).toBe(httpStatusCodes.OK);
      });

      it('should rollback and return 500 status code if an db exception happens in the first operation', async function () {
        const entityRepository = container.resolve<Repository<Entity>>(ENTITY_REPOSITORY_SYMBOL);

        const findByMock = jest.fn().mockRejectedValue(new QueryFailedError('select *', [], new Error('failed')));
        const findOneMock = jest.fn().mockResolvedValue(undefined);
        const insertMock = jest.fn().mockResolvedValue(undefined);
        const deleteMock = jest.fn();
        const [mockedApp, mockedContainer] = await getApp({
          override: [
            {
              token: ENTITY_REPOSITORY_SYMBOL,
              provider: {
                useValue: {
                  findOne: findOneMock,
                  insert: insertMock,
                  findBy: findByMock,
                  delete: deleteMock,
                },
              },
            },
            { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
          ],
          useChild: true,
        });

        const entityForCreation = createFakeEntity();
        const entityForDeletion = createFakeEntity();
        const requestBody: BulkRequestBody = [
          { action: BulkActions.DELETE, payload: [entityForDeletion.externalId] },
          { action: BulkActions.CREATE, payload: [entityForCreation] },
        ];
        const response = await requestSender.postBulk(mockedApp, requestBody);

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', 'failed');

        expect(findOneMock).toHaveBeenCalledTimes(1);
        expect(insertMock).toHaveBeenCalledTimes(1);
        expect(findByMock).toHaveBeenCalledTimes(1);
        expect(deleteMock).not.toHaveBeenCalled();

        const creationCheck = await entityRepository.findOneBy({ externalId: entityForCreation.externalId });
        expect(creationCheck).toBeNull();

        await mockedContainer.dispose();
      });

      it('should rollback and return 500 status code if an db exception happens in the second operation', async function () {
        const entityRepository = container.resolve<Repository<Entity>>(ENTITY_REPOSITORY_SYMBOL);

        const findByMock = jest.fn().mockRejectedValue(new QueryFailedError('select *', [], new Error('failed')));
        const findOneMock = jest.fn().mockResolvedValue(undefined);
        const insertMock = jest.fn().mockResolvedValue(undefined);
        const deleteMock = jest.fn();
        const [mockedApp, mockedContainer] = await getApp({
          override: [
            {
              token: ENTITY_REPOSITORY_SYMBOL,
              provider: {
                useValue: {
                  findOne: findOneMock,
                  insert: insertMock,
                  findBy: findByMock,
                  delete: deleteMock,
                },
              },
            },
            { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
          ],
          useChild: true,
        });

        const entityForCreation = createFakeEntity();
        const entityForDeletion = createFakeEntity();
        const requestBody: BulkRequestBody = [
          { action: BulkActions.CREATE, payload: [entityForCreation] },
          { action: BulkActions.DELETE, payload: [entityForDeletion.externalId] },
        ];
        const response = await requestSender.postBulk(mockedApp, requestBody);

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', 'failed');

        expect(findOneMock).toHaveBeenCalledTimes(1);
        expect(insertMock).toHaveBeenCalledTimes(1);
        expect(findByMock).toHaveBeenCalledTimes(1);
        expect(deleteMock).not.toHaveBeenCalled();

        const creationCheck = await entityRepository.findOneBy({ externalId: entityForCreation.externalId });
        expect(creationCheck).toBeNull();

        await mockedContainer.dispose();
      });
    });
  });

  describe('GET /entity', function () {
    describe('Happy Path 🙂', function () {
      it('should return 200 status code and the entity', async function () {
        const entity = await createDbEntity(container);
        const response = await requestSender.getEntity(app, entity.externalId);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.headers).toHaveProperty('content-type', 'application/json; charset=utf-8');
        expect(response.body).toMatchObject(entity);
      });

      it('should return 200 status code and only the osmId with header of content-type text/plain', async function () {
        const responseType = 'text/plain';
        const entity = await createDbEntity(container);
        const response = await requestSender.getEntity(app, entity.externalId, responseType);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.headers).toHaveProperty('content-type', 'text/plain; charset=utf-8');
        expect(response.text).toEqual(entity.osmId.toString());
      });

      describe('Bad Path 😡', function () {
        it('should return 400 status code and error message if external id is too long', async function () {
          const response = await requestSender.getEntity(app, faker.string.alphanumeric(69));

          expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
          expect(response.body).toHaveProperty('message', 'request/params/externalId must NOT have more than 68 characters');
        });
      });

      describe('Sad Path 😥', function () {
        it('should return 404 if an entity with the requested id does not exist', async function () {
          const response = await requestSender.getEntity(app, faker.string.alphanumeric(20));

          expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
          expect(response.body).toHaveProperty('message', `Entity with given id was not found.`);
        });

        it('should return 500 status code if an db exception happens', async function () {
          const findMock = jest.fn().mockRejectedValue(new QueryFailedError('select *', [], new Error('failed')));
          const [app, container] = await getApp({
            override: [
              {
                token: ENTITY_REPOSITORY_SYMBOL,
                provider: {
                  useValue: {
                    findOneBy: findMock,
                  },
                },
              },
              { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
            ],
            useChild: true,
          });
          const response = await requestSender.getEntity(app, createFakeEntity().externalId);

          expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
          expect(response.body).toHaveProperty('message', 'failed');

          await container.dispose();
        });
      });
    });
  });

  describe('DELETE /entity', function () {
    describe('Happy Path 🙂', function () {
      it('should return 204 status code', async function () {
        const entity = await createDbEntity(container);
        const response = await requestSender.deleteEntity(app, entity.externalId);

        expect(response.status).toBe(httpStatusCodes.NO_CONTENT);
      });
    });
    describe('Bad Path 😡', function () {
      it('should return 400 status code and error message if external id is too long', async function () {
        const response = await requestSender.deleteEntity(app, faker.string.alphanumeric(69));

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request/params/externalId must NOT have more than 68 characters');
      });
    });
    describe('Sad Path 😥', function () {
      it('should return 404 if an entity with the requested id does not exist', async function () {
        const response = await requestSender.deleteEntity(app, faker.string.alphanumeric(20));

        expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
        expect(response.body).toHaveProperty('message', "couldn't find an entity with the given id to delete");
      });

      it('should return 500 status code if an db exception happens', async function () {
        const findMock = jest.fn().mockRejectedValue(new QueryFailedError('select *', [], new Error('failed')));
        const [app] = await getApp({
          override: [
            {
              token: ENTITY_REPOSITORY_SYMBOL,
              provider: {
                useValue: {
                  findOneBy: findMock,
                },
              },
            },
            { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
          ],
          useChild: true,
        });
        const response = await requestSender.deleteEntity(app, createFakeEntity().externalId);

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
      const requestBody: BulkCreateRequestBody = { action: BulkActions.CREATE, payload: entities };
      const postResponse = await requestSender.postBulk(app, requestBody);

      expect(postResponse.status).toBe(httpStatusCodes.OK);

      await Promise.all(
        entities.map(async (entity) => {
          const getResponse = await requestSender.getEntity(app, entity.externalId);
          expect(getResponse.status).toBe(httpStatusCodes.OK);
          expect(getResponse.body).toEqual(entity);
        })
      );

      const deleteResponse = await requestSender.postBulk(app, {
        action: BulkActions.DELETE,
        payload: entities.map((entity) => entity.externalId),
      });
      expect(deleteResponse.status).toBe(httpStatusCodes.OK);

      await Promise.all(
        entities.map(async (entity) => {
          const getResponse = await requestSender.getEntity(app, entity.externalId);
          expect(getResponse.status).toBe(httpStatusCodes.NOT_FOUND);
        })
      );
    });
  });
});
