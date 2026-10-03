export interface CreatePaymentParams {
  amount: number;
  currency: string;
  method: string;
  customerEmail?: string;
  metadata?: any;
}

export interface PaymentResult {
  providerRef: string;
  status: 'pending' | 'succeeded' | 'failed';
  checkoutUrl?: string;
  raw?: any;
}

export interface RefundResult {
  providerRef: string;
  status: 'pending' | 'succeeded' | 'failed';
  raw?: any;
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;
  refund?(providerRef: string, amount: number, reason?: string): Promise<RefundResult>;
}
