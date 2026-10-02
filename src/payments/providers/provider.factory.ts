import { Injectable } from '@nestjs/common';
import { SafepayProvider } from './safepay.provider';
import { PaymentProvider } from './provider.interface';

@Injectable()
export class ProviderFactory {
  private providers: Map<string, PaymentProvider> = new Map();
  constructor(private readonly safepay: SafepayProvider) {
    this.providers.set('safepay', safepay);
  }
  get(name: string): PaymentProvider {
    const p = this.providers.get(name);
    if (!p) throw new Error('Unknown provider: ' + name);
    return p;
  }
}
