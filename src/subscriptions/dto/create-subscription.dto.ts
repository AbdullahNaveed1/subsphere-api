import { IsString, IsOptional } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  planId!: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
