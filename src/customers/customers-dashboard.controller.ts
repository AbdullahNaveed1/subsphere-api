import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentOrg, OrgContext } from '../common/decorators/current-org.decorator';
import { CustomersService } from './customers.service';

class CreateCustomerDto {
  @IsEmail() email!: string;
  @IsOptional() @IsString() name?: string;
}

@ApiTags('customers')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'X-Org-Id', required: true })
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('customers')
export class CustomersDashboardController {
  constructor(private readonly customers: CustomersService) {}
  @Post() create(@CurrentOrg() org: OrgContext, @Body() dto: CreateCustomerDto) { return this.customers.create(org.id, dto.email, dto.name); }
  @Get() list(@CurrentOrg() org: OrgContext) { return this.customers.list(org.id); }
  @Delete(':id') remove(@CurrentOrg() org: OrgContext, @Param('id') id: string) { return this.customers.remove(org.id, id); }
}
