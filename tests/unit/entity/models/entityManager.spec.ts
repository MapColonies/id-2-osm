import { QueryFailedError, Repository } from 'typeorm';
import { Entity } from '../../../../src/entity/models/entity';
import { EntityManager } from '../../../../src/entity/models/entityManager';
import { IdAlreadyExistsError } from '../../../../src/entity/models/errors';
import { createFakeEntity } from '../../../helpers/helpers';

let entityManager: EntityManager;

describe('EntityManager', () => {
  let insert: jest.Mock;
  let findOne: jest.Mock;

  beforeEach(() => {
    insert = jest.fn();
    findOne = jest.fn();
    const repository = ({ insert, findOne } as unknown) as Repository<Entity>;
    entityManager = new EntityManager(repository, { log: jest.fn() });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#createEntity', () => {
    it("resolves without errors if id's are not used", async () => {
      findOne.mockResolvedValue(undefined);
      insert.mockResolvedValue(undefined);
      const entity = createFakeEntity();

      const createPromise = entityManager.createEntity(entity);

      await expect(createPromise).resolves.not.toThrow();
    });

    it('rejects on DB error', async () => {
      findOne.mockRejectedValue(new QueryFailedError('select *', [], new Error()));
      const entity = createFakeEntity();

      const createPromise = entityManager.createEntity(entity);

      await expect(createPromise).rejects.toThrow(QueryFailedError);
    });

    it('rejects if any id already exists', async () => {
      const entity = createFakeEntity();
      findOne.mockResolvedValue(entity);
      insert.mockResolvedValue(undefined);

      const createPromise = entityManager.createEntity(entity);

      await expect(createPromise).rejects.toThrow(IdAlreadyExistsError);
    });
  });

  describe('#createEntities', () => {
    it("resolves without errors if id's are not used", async () => {
      findOne.mockResolvedValue(undefined);
      insert.mockResolvedValue(undefined);
      const entities = [createFakeEntity(), createFakeEntity()];

      const createPromise = entityManager.createEntities(entities);

      await expect(createPromise).resolves.not.toThrow();
    });

    it('rejects on DB error', async () => {
      findOne.mockRejectedValue(new QueryFailedError('select *', [], new Error()));
      const entities = [createFakeEntity(), createFakeEntity()];

      const createPromise = entityManager.createEntities(entities);

      await expect(createPromise).rejects.toThrow(QueryFailedError);
    });

    it('rejects if any id already exists', async () => {
      const entities = [createFakeEntity(), createFakeEntity()];
      findOne.mockResolvedValue(entities);
      insert.mockResolvedValue(undefined);

      const createPromise = entityManager.createEntities(entities);

      await expect(createPromise).rejects.toThrow(IdAlreadyExistsError);
    });
  });

  describe('#getEntity', () => {
    let findOne: jest.Mock;
    beforeEach(() => {
      findOne = jest.fn();
      const repository = ({ findOne } as unknown) as Repository<Entity>;
      entityManager = new EntityManager(repository, { log: jest.fn() });
    });
    afterEach(() => {
      findOne.mockClear();
    });
    it('returns the entity', async () => {
      const entity = createFakeEntity();
      findOne.mockResolvedValue(entity);

      const getPromise = entityManager.getEntity(entity.externalId);

      await expect(getPromise).resolves.toStrictEqual(entity);
    });

    it('rejects on DB error', async () => {
      findOne.mockRejectedValue(new QueryFailedError('select *', [], new Error()));
      const entity = createFakeEntity();

      const getPromise = entityManager.getEntity(entity.externalId);

      await expect(getPromise).rejects.toThrow(QueryFailedError);
    });

    it('returns undefined if id not found', async () => {
      const entity = createFakeEntity();
      findOne.mockReturnValue(undefined);

      const getPromise = entityManager.getEntity(entity.externalId);

      await expect(getPromise).resolves.toBeUndefined();
    });
  });

  describe('#deleteEntity', () => {
    let findOne: jest.Mock;
    let deleteEntity: jest.Mock;
    beforeEach(() => {
      findOne = jest.fn();
      deleteEntity = jest.fn();
      const repository = ({ findOne, delete: deleteEntity } as unknown) as Repository<Entity>;
      entityManager = new EntityManager(repository, { log: jest.fn() });
    });
    afterEach(() => {
      findOne.mockClear();
      deleteEntity.mockClear();
    });
    it('should resolve if the entity is deleted', async () => {
      const entity = createFakeEntity();
      findOne.mockResolvedValue(entity);
      deleteEntity.mockResolvedValue(undefined);

      const deletePromise = entityManager.deleteEntity(entity.externalId);

      await expect(deletePromise).resolves.not.toThrow();
    });

    it('rejects on DB error', async () => {
      findOne.mockRejectedValue(new QueryFailedError('select *', [], new Error()));
      const entity = createFakeEntity();

      const deletePromise = entityManager.deleteEntity(entity.externalId);

      await expect(deletePromise).rejects.toThrow(QueryFailedError);
    });

    it('should reject with error if entitiy does not exist', async () => {
      const entity = createFakeEntity();
      findOne.mockReturnValue(undefined);

      const deletePromise = entityManager.deleteEntity(entity.externalId);

      await expect(deletePromise).rejects.toThrow("couldn't find an entity with the given id to delete");
    });
  });

  describe('#deleteEntities', () => {
    let findByIds: jest.Mock;
    let deleteEntity: jest.Mock;
    beforeEach(() => {
      findByIds = jest.fn();
      deleteEntity = jest.fn();
      const repository = ({ findByIds, delete: deleteEntity } as unknown) as Repository<Entity>;
      entityManager = new EntityManager(repository, { log: jest.fn() });
    });
    afterEach(() => {
      findByIds.mockClear();
      deleteEntity.mockClear();
    });
    it('should resolve if the entities are deleted', async () => {
      const entities = [createFakeEntity(), createFakeEntity()];
      findByIds.mockResolvedValue(entities);
      deleteEntity.mockResolvedValue(undefined);

      const deletePromise = entityManager.deleteEntities(entities.map((ent) => ent.externalId));

      await expect(deletePromise).resolves.not.toThrow();
    });

    it('rejects on DB error', async () => {
      const entities = [createFakeEntity(), createFakeEntity()];
      findByIds.mockRejectedValue(new QueryFailedError('select *', [], new Error()));

      const deletePromise = entityManager.deleteEntities(entities.map((ent) => ent.externalId));

      await expect(deletePromise).rejects.toThrow(QueryFailedError);
    });

    it('should reject with error if entitiy does not exist', async () => {
      const entities = [createFakeEntity(), createFakeEntity()];
      findByIds.mockReturnValue([]);
      const ids = entities.map((ent) => ent.externalId);

      const deletePromise = entityManager.deleteEntities(ids);

      await expect(deletePromise).rejects.toThrow(`couldn't find one of the specified ids: ${JSON.stringify(ids)}`);
    });
  });
});
