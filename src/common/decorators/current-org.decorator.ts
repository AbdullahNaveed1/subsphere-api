import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface OrgContext {
  id: string;
  role: string;
}

export const CurrentOrg = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): OrgContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.org;
  },
);
