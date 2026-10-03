import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsObject } from 'class-validator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { Scopes } from '../common/decorators/scopes.decorator';
import { CustomersService } from './customers.service';

class CreateCustomerDto {
  @IsEmail() email!: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsObject() metadata?: any;
}

@ApiTags('customers')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(RateLimitGuard, ApiKeyGuard)
@Controller('v1/customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post() @Scopes('customers:write')
  create(@CurrentOrg() org: OrgContext, @Body() dto: CreateCustomerDto) {
    return this.customers.create(org.id, dto.email, dto.name, dto.metadata);
  }

  @Get() @Scopes('customers:read')
  list(@CurrentOrg() org: OrgContext) { return this.customers.list(org.id); }

  @Get(':id') @Scopes('customers:read')
  get(@CurrentOrg() org: OrgContext, @Param('id') id: string) { return this.customers.get(org.id, id); }

  @Delete(':id') @Scopes('customers:write')
  remove(@CurrentOrg() org: OrgContext, @Param('id') id: string) { return this.customers.remove(org.id, id); }
}
