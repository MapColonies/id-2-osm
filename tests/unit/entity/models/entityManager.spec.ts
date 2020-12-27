import { QueryFailedError, Repository } from 'typeorm';
import { Entity } from '../../../../src/entity/models/entity';
import { EntityManager } from '../../../../src/entity/models/entityManager';
import { IdAlreadyExistsError } from '../../../../src/entity/models/errors';
import { createFakeEntity } from '../../../helpers';

let entityManager: EntityManager;

describe('EntityManager', () => {
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
  describe('#createEntity', () => {
    it("resolves without errors if id's are not used", async () => {
      find.mockResolvedValue([]);
      insert.mockResolvedValue(undefined);
      const entity = createFakeEntity();

      const createPromise = entityManager.createEntity(entity);

      await expect(createPromise).resolves.not.toThrow();
    });

    it('rejects on DB error', async () => {
      find.mockRejectedValue(new QueryFailedError('select *', [], new Error()));
      const entity = createFakeEntity();

      const createPromise = entityManager.createEntity(entity);

      await expect(createPromise).rejects.toThrow(QueryFailedError);
    });

    it('rejects if any id already exists', async () => {
      const entity = createFakeEntity();
      find.mockResolvedValue([entity]);
      insert.mockResolvedValue(undefined);

      const createPromise = entityManager.createEntity(entity);

      await expect(createPromise).rejects.toThrow(IdAlreadyExistsError);
    });
  });
});
