import { readFileSync } from 'fs';
import swaggerUi from 'swagger-ui-express';
import { Request, Response, RequestHandler } from 'express';
import { safeLoad } from 'js-yaml';
import { injectable, inject } from 'tsyringe';
import { IConfig } from 'config';
import { Services } from '../constants';
import { ILogger, SwaggerConfig } from '../interfaces';
@injectable()
export class SwaggerController {
  public uiMiddleware: RequestHandler[];
  public serveUi: RequestHandler;

  private readonly swaggerDoc: swaggerUi.JsonObject;

  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger, @inject(Services.CONFIG) private readonly config: IConfig) {
    const swaggerConfig = config.get<SwaggerConfig>('swaggerConfig');

    this.swaggerDoc = safeLoad(readFileSync(swaggerConfig.filePath, 'utf8')) as swaggerUi.JsonObject;
    this.serveUi = swaggerUi.setup(this.swaggerDoc);
    this.uiMiddleware = swaggerUi.serve;
  }

  public serveJson(req: Request, res: Response): void {
    res.json(this.swaggerDoc);
  }
}
