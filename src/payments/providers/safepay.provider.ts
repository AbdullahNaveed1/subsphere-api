import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PaymentProvider, CreatePaymentParams, PaymentResult } from './provider.interface';

@Injectable()
export class SafepayProvider implements PaymentProvider {
  readonly name = 'safepay';
  private logger = new Logger(SafepayProvider.name);
  private publicKey: string;
  private secretKey: string;
  private host: string;
  private env: string;

  constructor(private readonly config: ConfigService) {
    this.publicKey = this.config.get<string>('SAFEPAY_PUBLIC_KEY') || '';
    this.secretKey = this.config.get<string>('SAFEPAY_SECRET_KEY') || '';
    this.env = this.config.get<string>('SAFEPAY_ENV') || 'sandbox';
    this.host = this.env === 'sandbox'
      ? 'https://sandbox.api.getsafepay.com'
      : 'https://api.getsafepay.com';
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    if (!this.publicKey || !this.secretKey) {
      this.logger.warn('Safepay keys missing - using mock');
      return { providerRef: 'mock_' + Date.now(), status: 'pending' };
    }

    const res = await axios.post(
      this.host + '/order/v1/init',
      {
        client: this.publicKey,
        amount: params.amount,
        currency: params.currency || 'PKR',
        environment: this.env,
      },
      {
        headers: {
          'X-SFPY-MERCHANT-SECRET': this.secretKey,
        },
      },
    );

    const token = res.data && res.data.data && res.data.data.token
      ? res.data.data.token
      : (res.data && res.data.token);

    const checkoutUrl = token
      ? this.host + '/checkout/pay?env=' + this.env + '&beacon=' + token + '&source=hosted'
      : undefined;

    this.logger.log('Safepay token: ' + token);
    return {
      providerRef: token || 'unknown',
      status: 'pending',
      checkoutUrl,
      raw: res.data,
    };
  }
}