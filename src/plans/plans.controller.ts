import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlansService } from './plans.service';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private plans: PlansService) {}

  @Get()
  list() {
    return this.plans.list();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.plans.getOne(id);
  }
}