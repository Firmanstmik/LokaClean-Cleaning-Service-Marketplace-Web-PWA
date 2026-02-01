/**
 * Type declarations for midtrans-client package.
 */

declare module "midtrans-client" {
  export interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  export interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  export interface CustomerDetails {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  }

  export interface CreateTransactionParams {
    transaction_details: TransactionDetails;
    customer_details: CustomerDetails;
    credit_card?: {
      secure?: boolean;
    };
  }

  export interface TransactionResponse {
    token: string;
  }

  export interface NotificationResponse {
    order_id: string;
    transaction_status: string;
    fraud_status?: string;
    status_code: string;
    gross_amount: string;
    signature_key?: string;
    payment_type?: string;
    transaction_time?: string;
  }

  export interface TransactionNamespace {
    notification(notificationJson: unknown): Promise<NotificationResponse>;
  }

  export class Snap {
    constructor(config: SnapConfig);
    createTransaction(params: CreateTransactionParams): Promise<TransactionResponse>;
    transaction: TransactionNamespace;
  }
}
