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
});
