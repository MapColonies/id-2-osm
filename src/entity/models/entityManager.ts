import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';

@injectable()
export class EntityManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger) {}
  public getHello(): Record<string, unknown> {
    this.logger.log('info', 'loggging');
    return {
      hello: 'world',
    };
  }
}
