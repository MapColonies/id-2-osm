import { faker } from '@faker-js/faker';
import { IEntity } from '../src/entity/models/entity';
import { RegisterOptions } from '../src/containerConfig';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { SERVICES } from '../src/common/constants';

export const getBaseRegisterOptions = (): Required<RegisterOptions> => {
  return {
    override: [
      { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
      { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
    ],
    useChild: true,
  };
};

export const createFakeEntity = (): IEntity => {
  return { externalId: faker.datatype.uuid(), osmId: faker.datatype.number() };
};
