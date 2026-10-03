import { Controller, Get, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { Scopes } from '../common/decorators/scopes.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@ApiTags('subscriptions')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(RateLimitGuard, ApiKeyGuard)
@Controller('v1/subscriptions')
export class SubscriptionsPublicController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Post() @Scopes('payments:write')
  create(@CurrentOrg() org: OrgContext, @Body() dto: CreateSubscriptionDto) { return this.subscriptions.create(org.id, dto); }

  @Get('me') @Scopes('payments:read')
  me(@CurrentOrg() org: OrgContext) { return this.subscriptions.findForOrg(org.id); }

  @Delete('me') @Scopes('payments:write')
  cancel(@CurrentOrg() org: OrgContext) { return this.subscriptions.cancel(org.id); }
}