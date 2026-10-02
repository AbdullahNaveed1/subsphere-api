import { Controller, Post, Get, Delete, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@ApiTags('subscriptions')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'X-Org-Id', required: true })
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}
  @Post() create(@CurrentOrg() org: OrgContext, @Body() dto: CreateSubscriptionDto) { return this.subscriptions.create(org.id, dto); }
  @Get('me') me(@CurrentOrg() org: OrgContext) { return this.subscriptions.findForOrg(org.id); }
  @Delete('me') cancel(@CurrentOrg() org: OrgContext) { return this.subscriptions.cancel(org.id); }
}
