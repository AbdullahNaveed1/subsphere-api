import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request & { id?: string }, res: Response, next: NextFunction) {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && incoming.length > 0 ? incoming : 'req_' + randomBytes(12).toString('hex');
    req.id = id;
    res.setHeader('X-Request-Id', id);

    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const key = req.headers['x-api-key'] as string | undefined;
      const keyHint = key && key.length > 12 ? key.slice(0, 12) + '...' : '-';
      this.logger.log(req.method + ' ' + req.originalUrl + ' ' + res.statusCode + ' ' + ms + 'ms ' + id + ' key=' + keyHint);
    });
    next();
  }
}