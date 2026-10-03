import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { CheckoutService } from './checkout.service';

class CompleteDto {
  @IsIn(['succeeded', 'failed']) outcome!: 'succeeded' | 'failed';
}

@ApiTags('checkout-public')
@Controller('checkout')
export class CheckoutPublicController {
  constructor(private readonly checkout: CheckoutService) {}

  @Get(':token')
  get(@Param('token') token: string) { return this.checkout.getByToken(token); }

  @Post(':token/complete')
  complete(@Param('token') token: string, @Body() dto: CompleteDto) {
    return this.checkout.complete(token, dto.outcome);
  }

  @Post(':token/cancel')
  cancel(@Param('token') token: string) { return this.checkout.cancel(token); }
}