import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { DependencyContainer } from 'tsyringe';
import { CleanupRegistry } from '@map-colonies/cleanup-registry';
import { getApp } from '@src/app';
import { SERVICES } from '@src/common/constants';
import { DocsRequestSender } from './helpers/docsRequestSender';

describe('docs', function () {
  let requestSender: DocsRequestSender;
  let container: DependencyContainer;

  beforeEach(async function () {
    const [app, initializedContainer] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: true,
    });
    requestSender = new DocsRequestSender(app);

    container = initializedContainer;
  });

  afterAll(async function () {
    const registry = container.resolve<CleanupRegistry>(SERVICES.CLEANUP_REGISTRY);
    await registry.trigger();
    container.reset();
  });

  describe('Happy Path', function () {
    it('should return 200 status code and the resource', async function () {
      const response = await requestSender.getDocs();

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.type).toBe('text/html');
    });

    it('should return 200 status code and the json spec', async function () {
      const response = await requestSender.getDocsJson();

      expect(response.status).toBe(httpStatusCodes.OK);

      expect(response.type).toBe('application/json');
      expect(response.body).toHaveProperty('openapi');
    });
  });
});
