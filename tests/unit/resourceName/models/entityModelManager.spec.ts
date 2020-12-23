import { EntityManager } from '../../../../src/entity/models/entityManager';

let entityManager: EntityManager;

describe('ResourceNameManager', () => {
  beforeEach(function () {
    entityManager = new EntityManager({ log: jest.fn() });
  });
  describe('#getResource', () => {
    it('return the resource of id 1', function () {
      // action
      const hello = entityManager.getHello();

      // expectation
      expect(hello.hello).toEqual('world');
    });
  });
});
