import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { VerifyController } from './verify.controller';
import { EventsController } from './events.controller';
import { ApiKeysService } from './api-keys.service';

@Module({
  controllers: [ApiKeysController, VerifyController, EventsController],
  providers: [ApiKeysService],
})
export class ApiKeysModule {}

