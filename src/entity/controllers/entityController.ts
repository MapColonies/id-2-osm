import { Request, RequestHandler, Response } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, container, inject } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';

import { EntityManager } from '../models/entityManager';

@injectable()
export class EntityController {
  public constructor(@inject(EntityManager) private readonly manager: EntityManager, @inject(Services.LOGGER) private readonly logger: ILogger) {}

  public post: RequestHandler = async (req: Request, res: Response) => {
    await this.manager.createEntity(req.body);
    return res.sendStatus(httpStatus.CREATED);
  };
}
