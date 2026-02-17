import jsLogger from '@map-colonies/js-logger';
import { QueryFailedError, Repository } from 'typeorm';
import { Entity } from '../../../../src/entity/models/entity';
import { EntityManager } from '../../../../src/entity/models/entityManager';
import { EntityNotFoundError, IdAlreadyExistsError } from '../../../../src/entity/models/errors';
import { createFakeEntity } from '../../../helpers/helpers';
import { BulkActions } from '../../../../src/entity/models/operations';

jest.mock('typeorm-transactional', (): object => ({
  ...jest.requireActual('typeorm-transactional'),
  runInTransaction: jest.fn().mockImplementation(async (fn: () => Promise<unknown>) => fn()),
}));

describe('EntityManager', () => {
  const insertMock = jest.fn();
  const findOneMock = jest.fn();
  const findOneByMock = jest.fn();
  const findByMock = jest.fn();
  const deleteMock = jest.fn();
  const upsertMock = jest.fn();

  let entityManager: EntityManager;

  beforeAll(() => {
    const repository = {
      insert: insertMock,
      findOneBy: findOneByMock,
      findOne: findOneMock,
      findBy: findByMock,
      delete: deleteMock,
      upsert: upsertMock,
    } as unknown as Repository<Entity>;
    entityManager = new EntityManager(repository, jsLogger({ enabled: false }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#createEntity', () => {
    it('resolves without errors if external id is not used', async () => {
      findOneMock.mockResolvedValue(undefined);
      insertMock.mockResolvedValue(undefined);
      const entity = createFakeEntity();

      const createPromise = entityManager.createEntity(entity);

      await expect(createPromise).resolves.not.toThrow();
    });

    it('rejects if any externalId already exists', async () => {
      const entity = createFakeEntity();
      findOneMock.mockResolvedValue(entity);
      insertMock.mockResolvedValue(undefined);

      const createPromise = entityManager.createEntity(entity);

      await expect(createPromise).rejects.toThrow(IdAlreadyExistsError);
    });

    it('rejects if any osmId already exists', async () => {
      const existingEntity = createFakeEntity();
      const entity = createFakeEntity();
      findOneMock.mockResolvedValue(existingEntity);
      insertMock.mockResolvedValue(undefined);

      const createPromise = entityManager.createEntity({ ...entity, osmId: existingEntity.osmId });

      await expect(createPromise).rejects.toThrow(IdAlreadyExistsError);
    });

    it('rejects on DB error', async () => {
      findOneMock.mockRejectedValue(new QueryFailedError('select *', [], new Error()));
      const entity = createFakeEntity();

      const createPromise = entityManager.createEntity(entity);

      await expect(createPromise).rejects.toThrow(QueryFailedError);
    });
  });

  describe('#createEntities', () => {
    it('resolves without errors if external ids are not used', async () => {
      findOneMock.mockResolvedValue(null);
      upsertMock.mockResolvedValue(undefined);
      const entities = [createFakeEntity(), createFakeEntity()];

      const createPromise = entityManager.createEntities(entities);

      await expect(createPromise).resolves.not.toThrow();

      expect(upsertMock).toHaveBeenCalledTimes(1);
      expect(upsertMock).toHaveBeenCalledWith(entities, {
        conflictPaths: ['externalId'],
        skipUpdateIfNoValuesChanged: true,
      });
    });

    it('rejects if found conflicting entity', async () => {
      const entities = [createFakeEntity(), createFakeEntity()];
      findOneMock.mockResolvedValue(entities);

      const createPromise = entityManager.createEntities(entities);

      await expect(createPromise).rejects.toThrow(IdAlreadyExistsError);
      expect(upsertMock).not.toHaveBeenCalled();
    });

    it('rejects on DB error', async () => {
      findOneMock.mockRejectedValue(new QueryFailedError('select *', [], new Error()));
      const entities = [createFakeEntity(), createFakeEntity()];

      const createPromise = entityManager.createEntities(entities);

      await expect(createPromise).rejects.toThrow(QueryFailedError);
      expect(upsertMock).not.toHaveBeenCalled();
    });
  });

  describe('#getEntity', () => {
    it('returns the entity', async () => {
      const entity = createFakeEntity();
      findOneByMock.mockResolvedValue(entity);

      const getPromise = entityManager.getEntity(entity.externalId);

      await expect(getPromise).resolves.toStrictEqual(entity);
    });

    it('rejects with if id not found', async () => {
      const entity = createFakeEntity();
      findOneByMock.mockReturnValue(null);

      const getPromise = entityManager.getEntity(entity.externalId);

      await expect(getPromise).rejects.toThrow(EntityNotFoundError);
    });

    it('rejects on DB error', async () => {
      findOneByMock.mockRejectedValue(new QueryFailedError('select *', [], new Error()));
      const entity = createFakeEntity();

      const getPromise = entityManager.getEntity(entity.externalId);

      await expect(getPromise).rejects.toThrow(QueryFailedError);
    });
  });

  describe('#deleteEntity', () => {
    it('should resolve if the entity is deleted', async () => {
      const entity = createFakeEntity();
      findOneByMock.mockResolvedValue(entity);
      deleteMock.mockResolvedValue(undefined);

      const deletePromise = entityManager.deleteEntity(entity.externalId);

      await expect(deletePromise).resolves.not.toThrow();
      expect(findOneByMock).toHaveBeenCalledTimes(1);
      expect(deleteMock).toHaveBeenCalledTimes(1);
    });

    it('should resolve if the entity is already deleted if validateExists if falsy', async () => {
      const entity = createFakeEntity();

      const deletePromise = entityManager.deleteEntity(entity.externalId, false);

      await expect(deletePromise).resolves.not.toThrow();
      expect(findOneByMock).not.toHaveBeenCalled();
      expect(deleteMock).toHaveBeenCalledTimes(1);
    });

    it('should reject with error if entitiy does not exist', async () => {
      const entity = createFakeEntity();
      findOneByMock.mockReturnValue(null);

      const deletePromise = entityManager.deleteEntity(entity.externalId);

      await expect(deletePromise).rejects.toThrow("couldn't find an entity with the given id to delete");
    });

    it('rejects on DB error', async () => {
      findOneByMock.mockRejectedValue(new QueryFailedError('select *', [], new Error()));
      const entity = createFakeEntity();

      const deletePromise = entityManager.deleteEntity(entity.externalId);

      await expect(deletePromise).rejects.toThrow(QueryFailedError);
    });
  });

  describe('#deleteEntities', () => {
    it('should resolve if the entities are deleted', async () => {
      const entities = [createFakeEntity(), createFakeEntity()];
      findByMock.mockResolvedValue(entities);
      deleteMock.mockResolvedValue(undefined);

      const deletePromise = entityManager.deleteEntities(entities.map((ent) => ent.externalId));

      await expect(deletePromise).resolves.not.toThrow();
      expect(findByMock).toHaveBeenCalledTimes(1);
      expect(deleteMock).toHaveBeenCalledTimes(1);
    });

    it('should resolve if the entities are already deleted and validateExistance is falsy', async () => {
      const entities = [createFakeEntity(), createFakeEntity()];

      const ids = entities.map((ent) => ent.externalId);

      const deletePromise = entityManager.deleteEntities(ids, false);

      await expect(deletePromise).resolves.not.toThrow();
      expect(findByMock).not.toHaveBeenCalled();
      expect(deleteMock).toHaveBeenCalledTimes(1);
    });

    it('should reject with error if entitiy does not exist', async () => {
      const entities = [createFakeEntity(), createFakeEntity()];
      findByMock.mockReturnValue([]);

      const ids = entities.map((ent) => ent.externalId);

      const deletePromise = entityManager.deleteEntities(ids);

      await expect(deletePromise).rejects.toThrow(`couldn't find one of the specified ids: ${JSON.stringify(ids)}`);
    });

    it('rejects on DB error', async () => {
      const entities = [createFakeEntity(), createFakeEntity()];
      findByMock.mockRejectedValue(new QueryFailedError('select *', [], new Error()));

      const deletePromise = entityManager.deleteEntities(entities.map((ent) => ent.externalId));

      await expect(deletePromise).rejects.toThrow(QueryFailedError);
    });
  });

  describe('#multiOperationBulks', () => {
    it('resolves without errors if for creations ids are not conflicting', async () => {
      const createEntities = [createFakeEntity(), createFakeEntity()];
      const deleteEntities = [createFakeEntity(), createFakeEntity()];

      findOneMock.mockResolvedValue(null);

      const multiPromise = entityManager.multiOperationBulks([
        { action: BulkActions.CREATE, payload: createEntities },
        { action: BulkActions.DELETE, payload: deleteEntities.map((e) => e.externalId) },
      ]);

      await expect(multiPromise).resolves.not.toThrow();

      expect(upsertMock).toHaveBeenCalledTimes(1);
      expect(upsertMock).toHaveBeenCalledWith(createEntities, {
        conflictPaths: ['externalId'],
        skipUpdateIfNoValuesChanged: true,
      });
      expect(findByMock).not.toHaveBeenCalled();
      expect(deleteMock).toHaveBeenCalledTimes(1);
      expect(deleteMock).toHaveBeenCalledWith(deleteEntities.map((e) => e.externalId));
    });

    it('resolves without errors for valid request where delete bulk is first', async () => {
      const createEntities = [createFakeEntity(), createFakeEntity()];
      const deleteEntities = [createFakeEntity(), createFakeEntity()];

      findOneMock.mockResolvedValue(null);

      const multiPromise = entityManager.multiOperationBulks([
        { action: BulkActions.DELETE, payload: deleteEntities.map((e) => e.externalId) },
        { action: BulkActions.CREATE, payload: createEntities },
      ]);

      await expect(multiPromise).resolves.not.toThrow();

      expect(upsertMock).toHaveBeenCalledTimes(1);
      expect(upsertMock).toHaveBeenCalledWith(createEntities, {
        conflictPaths: ['externalId'],
        skipUpdateIfNoValuesChanged: true,
      });
      expect(findByMock).not.toHaveBeenCalled();
      expect(deleteMock).toHaveBeenCalledTimes(1);
      expect(deleteMock).toHaveBeenCalledWith(deleteEntities.map((e) => e.externalId));
    });

    it('should reject with error if entitiy for creation already exist', async () => {
      const createEntities = [createFakeEntity(), createFakeEntity()];
      const deleteEntities = [createFakeEntity(), createFakeEntity()];

      findOneMock.mockResolvedValue(createEntities[0]);
      upsertMock.mockResolvedValue(undefined);
      findByMock.mockResolvedValue(deleteEntities);
      deleteMock.mockResolvedValue(undefined);

      const multiPromise = entityManager.multiOperationBulks([
        { action: BulkActions.CREATE, payload: createEntities },
        { action: BulkActions.DELETE, payload: deleteEntities.map((e) => e.externalId) },
      ]);

      await expect(multiPromise).rejects.toThrow(IdAlreadyExistsError);
    });

    it('rejects on DB error caused in creation', async () => {
      const createEntities = [createFakeEntity(), createFakeEntity()];
      const deleteEntities = [createFakeEntity(), createFakeEntity()];
      findOneMock.mockRejectedValue(new QueryFailedError('select *', [], new Error()));

      const multiPromise = entityManager.multiOperationBulks([
        { action: BulkActions.CREATE, payload: createEntities },
        { action: BulkActions.DELETE, payload: deleteEntities.map((e) => e.externalId) },
      ]);

      await expect(multiPromise).rejects.toThrow(QueryFailedError);
    });

    it('rejects on DB error caused in deletion', async () => {
      const createEntities = [createFakeEntity(), createFakeEntity()];
      const deleteEntities = [createFakeEntity(), createFakeEntity()];
      findOneMock.mockResolvedValue(null);
      deleteMock.mockRejectedValue(new QueryFailedError('select *', [], new Error()));

      const multiPromise = entityManager.multiOperationBulks([
        { action: BulkActions.CREATE, payload: createEntities },
        { action: BulkActions.DELETE, payload: deleteEntities.map((e) => e.externalId) },
      ]);

      await expect(multiPromise).rejects.toThrow(QueryFailedError);
    });
  });
});
