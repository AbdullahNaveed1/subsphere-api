import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const key = req.headers && req.headers['x-api-key'];
    if (typeof key === 'string' && key.length > 12) return 'apikey:' + key.slice(0, 16);
    const ip = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
    return 'ip:' + ip;
  }
}
