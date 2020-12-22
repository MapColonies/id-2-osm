import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';

import { registerTestValues } from '../testContainerConfig';
import * as requestSender from './helpers/requestSender';

describe('resourceName', function () {
  beforeAll(async function () {
    registerTestValues();
    await requestSender.init();
  });
  afterEach(function () {
    container.clearInstances()
  });

  describe('Happy Path', function () {
    it('should return 200 status code and the resource', async function () {
      const response = await requestSender.getHello();

      expect(response.status).toBe(httpStatusCodes.OK);

      const resource = response.body as Record<string, unknown>;
      expect(resource.hellow).toEqual('world');
    });
  });
  describe('Bad Path', function () {
    // All requests with status code of 400
  });
  describe('Sad Path', function () {
    // All requests with status code 4XX-5XX
  });
});
