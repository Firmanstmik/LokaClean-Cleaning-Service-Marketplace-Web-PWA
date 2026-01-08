# Payment Module - Midtrans Integration

## Overview

This module handles payment processing using Midtrans Snap for NON-CASH payments (QRIS, DANA, BANK TRANSFER) and manual admin confirmation for CASH payments.

## Security Architecture

### Why Frontend Cannot Confirm Payment

**Frontend is NOT trusted** for payment confirmation because:
1. Users can manipulate browser code (DevTools)
2. Network requests can be intercepted/modified
3. JavaScript can be disabled or modified
4. Browser extensions can inject malicious code

### Why Webhook is Mandatory

**Webhook is the ONLY source of truth** because:
1. Only Midtrans server can send valid webhook notifications
2. Webhook includes cryptographic verification
3. Payment status MUST be updated ONLY via webhook
4. Frontend success callbacks are unreliable

## Payment Flow

### CASH Payments
1. User creates order with `payment_method: "CASH"`
2. Payment status: `PENDING`
3. Admin manually marks payment as `PAID` via admin panel
4. Order status automatically changes to `PROCESSING`

### NON-CASH Payments (QRIS/DANA/TRANSFER)
1. User creates order with `payment_method: "QRIS" | "DANA" | "TRANSFER"`
2. Payment status: `PENDING`
3. Frontend calls `POST /api/payments/snap-token` with order ID and customer details
4. Backend generates Midtrans Snap token
5. Frontend displays Midtrans payment UI using Snap token
6. User completes payment on Midtrans
7. Midtrans sends webhook to `POST /api/payments/webhook`
8. Backend validates webhook and updates payment status:
   - `settlement` / `capture` → `PAID` → Order status → `PROCESSING`
   - `pending` → Keep `PENDING`
   - `cancel` / `expire` / `deny` → Keep `PENDING`

## API Endpoints

### POST /api/payments/snap-token
**Authentication:** Required (USER)

Request body:
```json
{
  "pesanan_id": 123,
  "customer_details": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "08123456789"
  }
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "snap_token": "abc123...",
    "order_id": "LOKACLEAN-123-1234567890"
  }
}
```

### POST /api/payments/webhook
**Authentication:** None (Midtrans calls this directly)

This endpoint receives webhook notifications from Midtrans. Always returns 200 OK to prevent retries.

## Environment Variables

Add to `.env`:
```env
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
```

Get credentials from:
- Sandbox: https://dashboard.sandbox.midtrans.com/
- Production: https://dashboard.midtrans.com/

## Webhook Configuration

1. Log in to Midtrans Dashboard
2. Go to Settings → Configuration → Notification URL
3. Set webhook URL: `https://your-domain.com/api/payments/webhook`
4. For local development, use ngrok or similar tunnel service

## Testing

### Sandbox Test Cards
See: https://docs.midtrans.com/docs/testing-payment-gateway

### Test Webhook Locally
1. Use ngrok: `ngrok http 4000`
2. Update webhook URL in Midtrans dashboard to ngrok URL
3. Test payment flow

## Database Schema

```prisma
model Pembayaran {
  id                Int           @id @default(autoincrement())
  pesanan_id        Int           @unique
  method            PaymentMethod  // CASH | QRIS | DANA | TRANSFER
  amount            Int
  status            PaymentStatus  // PENDING | PAID
  midtrans_order_id String?       // Set when Snap token is generated
  created_at        DateTime      @default(now())
}
```

## Error Handling

- Invalid order ID → 404
- Order doesn't belong to user → 403
- CASH payment → 400 (no Snap token needed)
- Midtrans API error → 500 (with error message)

## Idempotency

- Webhook handler is idempotent (safe to call multiple times)
- Snap token can be regenerated for existing orders
- Payment status updates are idempotent

