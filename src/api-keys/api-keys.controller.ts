import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsArray } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { ApiKeysService } from './api-keys.service';

class CreateApiKeyDto {
  @IsString() name!: string;
  @IsOptional() @IsIn(['test', 'live']) mode?: 'test' | 'live';
  @IsOptional() @IsArray() scopes?: string[];
}

@ApiTags('api-keys')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'X-Org-Id', required: true })
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly keys: ApiKeysService) {}
  @Post() create(@CurrentOrg() org: OrgContext, @Body() dto: CreateApiKeyDto) { return this.keys.create(org.id, dto.name, dto.mode, dto.scopes); }
  @Get() list(@CurrentOrg() org: OrgContext) { return this.keys.list(org.id); }
  @Delete(':id') revoke(@CurrentOrg() org: OrgContext, @Param('id') id: string) { return this.keys.revoke(org.id, id); }
}
