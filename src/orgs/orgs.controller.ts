import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrgsService } from './orgs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('orgs')
export class OrgsController {
  constructor(private orgs: OrgsService) {}

  @Post()
  create(@Req() req: any, @Body() body: { name: string }) {
    return this.orgs.create(req.user.id, body.name);
  }

  @Get()
  list(@Req() req: any) {
    return this.orgs.listForUser(req.user.id);
  }

  @Get(':id')
  getOne(@Req() req: any, @Param('id') id: string) {
    return this.orgs.getOne(req.user.id, id);
  }
}