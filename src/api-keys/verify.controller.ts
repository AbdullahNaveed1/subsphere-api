import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';

@ApiTags('public')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(ApiKeyGuard)
@Controller('v1')
export class VerifyController {
  @Get('ping')
  ping(@CurrentOrg() org: OrgContext) {
    return { ok: true, orgId: org.id, authenticatedWith: 'api_key' };
  }
}
