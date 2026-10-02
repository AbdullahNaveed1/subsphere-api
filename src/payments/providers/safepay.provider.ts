import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PaymentProvider, CreatePaymentParams, PaymentResult } from './provider.interface';

@Injectable()
export class SafepayProvider implements PaymentProvider {
  readonly name = 'safepay';
  private secretKey: string;
  private host: string;

  constructor(private readonly config: ConfigService) {
    this.secretKey = this.config.get<string>('SAFEPAY_SECRET_KEY') || '';
    const env = this.config.get<string>('SAFEPAY_ENV') || 'sandbox';
    this.host = env === 'sandbox' ? 'https://sandbox.api.getsafepay.com' : 'https://api.getsafepay.com';
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    if (!this.secretKey) {
      return { providerRef: 'mock_' + Date.now(), status: 'pending' };
    }
    const res = await axios.post(
      this.host + '/order/v1/init',
      { amount: params.amount, currency: params.currency || 'PKR', metadata: params.metadata || {} },
      { headers: { 'Content-Type': 'application/json', 'X-SFPY-MERCHANT-SECRET': this.secretKey } },
    );
    const token = res.data && res.data.data && res.data.data.token ? res.data.data.token : (res.data && res.data.token);
    return {
      providerRef: token || 'unknown',
      status: 'pending',
      checkoutUrl: token ? this.host + '/checkout?token=' + token : undefined,
      raw: res.data,
    };
  }
}