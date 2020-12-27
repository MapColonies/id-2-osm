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
    const insert = jest.fn();
    const find = jest.fn();
    beforeEach(() => {
      const repository = ({ insert, find } as unknown) as Repository<Entity>;
      entityManager = new EntityManager(repository, { log: jest.fn() });
    });
    afterEach(() => {
      insert.mockClear();
      find.mockClear();
    });
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

  describe('#getEntity', () => {
    const findOne = jest.fn();
    beforeEach(() => {
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
});
