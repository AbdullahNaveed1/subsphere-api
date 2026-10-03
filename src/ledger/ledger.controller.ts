import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { Scopes } from '../common/decorators/scopes.decorator';
import { LedgerService } from './ledger.service';

@ApiTags('ledger')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(RateLimitGuard, ApiKeyGuard)
@Controller('v1/ledger')
export class LedgerController {
  constructor(private readonly ledger: LedgerService) {}
  @Get('balance') @Scopes('payments:read')
  balance(@CurrentOrg() org: OrgContext) { return this.ledger.balance(org.id); }
  @Get('entries') @Scopes('payments:read')
  entries(@CurrentOrg() org: OrgContext, @Query('limit') limit?: string) { return this.ledger.list(org.id, limit ? Number(limit) : 50); }
}

@ApiTags('ledger')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'X-Org-Id', required: true })
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('ledger')
export class LedgerDashboardController {
  constructor(private readonly ledger: LedgerService) {}
  @Get('balance') balance(@CurrentOrg() org: OrgContext) { return this.ledger.balance(org.id); }
  @Get('entries') entries(@CurrentOrg() org: OrgContext, @Query('limit') limit?: string) { return this.ledger.list(org.id, limit ? Number(limit) : 50); }
}