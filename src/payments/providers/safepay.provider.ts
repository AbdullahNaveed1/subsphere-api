import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider, CreatePaymentParams, PaymentResult } from './provider.interface';

const { Safepay } = require('@sfpy/node-sdk');

@Injectable()
export class SafepayProvider implements PaymentProvider {
  readonly name = 'safepay';
  private logger = new Logger(SafepayProvider.name);
  private safepay: any;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('SAFEPAY_PUBLIC_KEY') || '';
    const v1Secret = this.config.get<string>('SAFEPAY_SECRET_KEY') || '';
    const webhookSecret = this.config.get<string>('SAFEPAY_WEBHOOK_SECRET') || '';
    const environment = this.config.get<string>('SAFEPAY_ENV') || 'sandbox';

    if (apiKey && v1Secret) {
      this.safepay = new Safepay({ environment, apiKey, v1Secret, webhookSecret });
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    if (!this.safepay) {
      this.logger.warn('Safepay keys missing — using mock');
      return { providerRef: 'mock_' + Date.now(), status: 'pending' };
    }

    const { token } = await this.safepay.payments.create({
      amount: params.amount,
      currency: params.currency || 'PKR',
    });

    const orderId = 'sp_' + Date.now();
    const checkoutUrl = await this.safepay.checkout.create({
      token,
      orderId,
      cancelUrl: 'http://localhost:3000/checkout?status=cancelled',
      redirectUrl: 'http://localhost:3000/checkout?status=success',
      source: 'custom',
      webhooks: true,
    });

    this.logger.log('Safepay token: ' + token);
    this.logger.log('Checkout URL: ' + checkoutUrl);
    return { providerRef: token, status: 'pending', checkoutUrl };
  }
}