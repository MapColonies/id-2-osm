import client from 'prom-client';
import httpStatusCodes from 'http-status-codes';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { getApp } from '../../../src/app';
import { SERVICES, METRICS_REGISTRY } from '../../../src/common/constants';
import { DocsRequestSender } from './helpers/docsRequestSender';

describe('docs', function () {
  let requestSender: DocsRequestSender;
  beforeEach(async function () {
    const app = (
      await getApp({
        override: [
          { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
          { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
          { token: METRICS_REGISTRY, provider: { useValue: new client.Registry() } },
        ],
        useChild: true,
      })
    ).app;
    requestSender = new DocsRequestSender(app);
  });
  describe('Happy Path', function () {
    it('should return 200 status code and the resource', async function () {
      const response = await requestSender.getDocs();
      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.type).toBe('text/html');
    });
  });
  it('should return 200 status code and the json spec', async function () {
    const response = await requestSender.getDocsJson();
    expect(response.status).toBe(httpStatusCodes.OK);
    expect(response.type).toBe('application/json');
    expect(response.body).toHaveProperty('openapi');
  });
});
