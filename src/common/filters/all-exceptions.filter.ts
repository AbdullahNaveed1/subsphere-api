import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

function typeFor(status: number): string {
  if (status === 401 || status === 403) return 'authentication_error';
  if (status === 404) return 'invalid_request_error';
  if (status === 429) return 'rate_limit_error';
  if (status >= 500) return 'api_error';
  return 'invalid_request_error';
}

function codeFor(status: number, message: string): string {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'too_many_requests';
  if (/scope/i.test(message)) return 'insufficient_scope';
  if (/idempotency/i.test(message)) return 'idempotency_key_in_use';
  if (/plan/i.test(message) && /not/i.test(message)) return 'plan_not_found';
  if (/payment/i.test(message) && /not/i.test(message)) return 'payment_not_found';
  return 'invalid_request';
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      if (typeof r === 'string') message = r;
      else if (r && typeof r === 'object') {
        const rr = r as any;
        if (Array.isArray(rr.message)) { message = rr.message.join('; '); details = rr.message; }
        else message = rr.message || message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack || exception.message);
    }

    res.status(status).json({
      statusCode: status,
      message,
      error: {
        type: typeFor(status),
        code: codeFor(status, message),
        message,
        ...(details ? { details } : {}),
        path: req.url,
        requestId: req.id,
      },
    });
  }
}
