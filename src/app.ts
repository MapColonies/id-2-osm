import { Application } from 'express';
import { registerExternalValues, RegisterOptions } from './containerConfig';
import { ServerBuilder } from './serverBuilder';

async function getApp(registerOptions?: RegisterOptions): Promise<Application> {
  const container = registerExternalValues(registerOptions);
  const app = (await container).resolve(ServerBuilder).build();
  return app;
}

export { getApp };
