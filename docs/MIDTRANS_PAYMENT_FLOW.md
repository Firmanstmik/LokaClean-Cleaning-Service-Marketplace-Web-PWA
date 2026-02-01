# Midtrans Payment Gateway Integration Flow

## Overview
This document explains how Midtrans payment gateway integration works in the LocaClean application, based on the official Midtrans Snap API documentation. The integration uses Midtrans Snap API for handling online payments (QRIS, DANA, TRANSFER) while CASH payments are handled manually.

## Official Midtrans Snap API Integration

### Backend Integration
- **SDK**: Use `midtrans-client` NPM package
- **API Endpoint**: `POST /snap/v1/transactions`
- **Authentication**: Basic Auth with Server Key
- **Response**: Returns `{ token: "..." }` for frontend use

### Frontend Integration
- **Library**: Include Midtrans Snap.js from CDN
- **Method**: `window.snap.pay(token, callbacks)`
- **Callbacks**: `onSuccess`, `onPending`, `onError`, `onClose`

### Webhook Notifications
- **Method**: HTTP POST to configured webhook URL
- **Signature Verification**: SHA512 hash of `order_id + status_code + gross_amount + server_key`
- **Response Requirement**: Always return HTTP 200 OK

## Main Payment Flow Sequence Diagram

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as React Frontend
    participant Backend as Express Backend
    participant DB as PostgreSQL
    participant Midtrans as Midtrans Snap API
    participant PaymentGateway as Payment Gateway

    Note over User,PaymentGateway: Phase 1: Order Creation

    User->>Frontend: Select Package & Create Order
    Frontend->>Backend: POST /api/orders
    Note over Backend: Create Pesanan (status: PENDING)<br/>Create Pembayaran (status: PENDING)
    Backend->>DB: Save Order & Payment
    DB-->>Backend: Order created
    Backend-->>Frontend: { order: {...}, pembayaran: {...} }

    alt Payment Method: NON-CASH (QRIS/DANA/TRANSFER)
        Note over User,PaymentGateway: Phase 2: Generate Snap Token

        Frontend->>Backend: POST /api/payments/snap-token<br/>{ order_id: X }
        Backend->>DB: Fetch order & payment details
        DB-->>Backend: Order & Payment data

        Backend->>Midtrans: POST /snap/v1/transactions<br/>Authorization: Basic {ServerKey}<br/>{<br/>  transaction_details: {<br/>    order_id: "ORDER-123",<br/>    gross_amount: 50000<br/>  },<br/>  customer_details: {<br/>    first_name: "...",<br/>    last_name: "...",<br/>    email: "...",<br/>    phone: "..."<br/>  }<br/>}
        Midtrans-->>Backend: { token: "abc123..." }

        Backend->>DB: UPDATE pembayaran<br/>SET midtrans_order_id = "ORDER-123"
        DB-->>Backend: Updated
        Backend-->>Frontend: { snap_token: "abc123..." }

        Note over User,PaymentGateway: Phase 3: Display Payment Page

        Frontend->>Frontend: Load Snap.js library<br/>(data-client-key)
        Frontend->>Midtrans: window.snap.pay(token, {<br/>  onSuccess: ...,<br/>  onPending: ...,<br/>  onError: ...,<br/>  onClose: ...<br/>})
        Midtrans-->>User: Display Payment Page

        Note over User,PaymentGateway: Phase 4: User Completes Payment

        User->>PaymentGateway: Select Payment Method & Pay
        PaymentGateway->>Midtrans: Process Payment
        Midtrans->>PaymentGateway: Payment Result

        alt Payment Success (settlement or capture with fraud_status=accept)
            Midtrans->>Backend: POST /api/payments/webhook<br/>{<br/>  transaction_status: "settlement",<br/>  order_id: "ORDER-123",<br/>  status_code: "200",<br/>  gross_amount: "50000",<br/>  signature_key: "...",<br/>  ...<br/>}
            Note over Backend: Verify signature:<br/>SHA512(order_id + status_code +<br/>gross_amount + server_key)
            Note over Backend: Update payment status<br/>Create notification
            Backend->>DB: UPDATE pembayaran<br/>SET status = PAID
            Backend->>DB: CREATE notification
            DB-->>Backend: Updated
            Backend-->>Midtrans: HTTP 200 OK

            Midtrans-->>User: Payment Success
            User->>Frontend: Return to app (onSuccess callback)
            Frontend->>Backend: GET /api/orders/:id
            Backend->>DB: Fetch updated order
            DB-->>Backend: Order with PAID payment
            Backend-->>Frontend: { order: {...}, pembayaran: { status: PAID } }
            Frontend-->>User: Show success message

        else Payment Pending
            Midtrans->>Backend: POST /api/payments/webhook<br/>{ transaction_status: "pending" }
            Note over Backend: Verify signature<br/>Keep status = PENDING
            Backend->>DB: Keep status = PENDING
            Backend-->>Midtrans: HTTP 200 OK
            Midtrans-->>User: Payment Pending (onPending callback)

        else Payment Failed (deny/cancel/expire)
            Midtrans->>Backend: POST /api/payments/webhook<br/>{ transaction_status: "cancel" }
            Note over Backend: Verify signature<br/>Keep status = PENDING
            Backend->>DB: Keep status = PENDING
            Backend-->>Midtrans: HTTP 200 OK
            Midtrans-->>User: Payment Failed (onError callback)
        end

    else Payment Method: CASH
        Note over Backend: CASH payments:<br/>No Midtrans integration<br/>Admin manually marks as PAID
        Backend-->>Frontend: Order created (payment: PENDING)
    end
```

## Transaction Status State Machine

Based on official Midtrans documentation, the complete transaction status flow:

```mermaid
stateDiagram-v2
    [*] --> PENDING: Order Created

    PENDING --> PENDING: Webhook: pending
    PENDING --> SETTLEMENT: Webhook: settlement
    PENDING --> CAPTURE: Webhook: capture (card payments)
    PENDING --> DENY: Webhook: deny
    PENDING --> CANCEL: Webhook: cancel
    PENDING --> EXPIRE: Webhook: expire

    CAPTURE --> SETTLEMENT: Auto-settle
    CAPTURE --> DENY: Fraud check failed

    SETTLEMENT --> PAID: Update database status
    SETTLEMENT --> REFUND: Merchant initiates refund
    SETTLEMENT --> PARTIAL_REFUND: Partial refund

    DENY --> [*]: Payment Failed
    CANCEL --> [*]: Payment Canceled
    EXPIRE --> [*]: Payment Expired

    REFUND --> [*]: Refund Complete
    PARTIAL_REFUND --> [*]: Partial Refund Complete
    PAID --> [*]: Payment Complete

    note right of PENDING
        Initial state
        Waiting for customer payment
    end note

    note right of SETTLEMENT
        Payment successful
        Funds credited to merchant
    end note

    note right of CAPTURE
        Card payment captured
        Check fraud_status = accept
        Will auto-settle
    end note

    note right of PAID
        Database status updated
        Payment confirmed
    end note
```

## Official Transaction Status Definitions

According to Midtrans documentation:

- **`settlement`**: Transaction settled, funds credited to merchant account
- **`capture`**: Transaction successful, card balance captured. Will settle automatically. Check `fraud_status` = `accept` for success
- **`pending`**: Transaction created, awaiting customer payment or 3DS/OTP completion
- **`deny`**: Payment rejected by provider or Midtrans Fraud Detection System
- **`cancel`**: Transaction canceled, can be triggered by merchant
- **`expire`**: Transaction unavailable due to delayed payment
- **`failure`**: Unexpected error during processing
- **`refund`**: Transaction marked for refund by merchant
- **`partial_refund`**: Transaction marked for partial refund by merchant
- **`authorize`**: For pre-authorize feature - card balance reserved, can be captured or auto-released

### Success Criteria
A transaction is considered successful if:
- `transaction_status` is `settlement`, OR
- `transaction_status` is `capture` AND `fraud_status` is `accept`

## Webhook Verification Flow

```mermaid
flowchart TD
    Start([Webhook Received]) --> ExtractData[Extract Notification Data<br/>order_id, status_code,<br/>gross_amount, signature_key]
    
    ExtractData --> GetServerKey[Get Server Key<br/>from Environment]
    
    GetServerKey --> CalculateHash[Calculate SHA512 Hash<br/>order_id + status_code +<br/>gross_amount + server_key]
    
    CalculateHash --> CompareSignature{signature_key ==<br/>calculated_hash?}
    
    CompareSignature -->|No| InvalidSignature[Signature Invalid<br/>Return 200 OK<br/>Log Error<br/>Do Not Process]
    
    CompareSignature -->|Yes| ValidSignature[Signature Valid<br/>Process Notification]
    
    ValidSignature --> CheckStatus{transaction_status?}
    
    CheckStatus -->|settlement| UpdatePaid[Update Payment<br/>Status: PAID<br/>Create Notification]
    CheckStatus -->|capture| CheckFraud{fraud_status ==<br/>accept?}
    CheckStatus -->|pending| KeepPending[Keep Status: PENDING]
    CheckStatus -->|deny| KeepPending
    CheckStatus -->|cancel| KeepPending
    CheckStatus -->|expire| KeepPending
    
    CheckFraud -->|Yes| UpdatePaid
    CheckFraud -->|No| KeepPending
    
    UpdatePaid --> Return200[Return HTTP 200 OK]
    KeepPending --> Return200
    InvalidSignature --> Return200
    
    Return200 --> End([End])
```

## Component Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend (React)"]
        A[Order Creation Form]
        B[Payment Page Component]
        C[Snap Payment Widget]
        D[Order Status Display]
    end

    subgraph Backend["Backend API (Express)"]
        E["POST /api/orders<br/>Create Order"]
        F["POST /api/payments/snap-token<br/>Generate Token"]
        G["POST /api/payments/webhook<br/>Handle Notification"]
        H["GET /api/orders/:id<br/>Get Order Status"]
    end

    subgraph Database["Database (PostgreSQL)"]
        I[(Pesanan Table)]
        J[(Pembayaran Table)]
        K[(Notification Table)]
    end

    subgraph External["External Services"]
        L[Midtrans Snap API<br/>POST /snap/v1/transactions]
        M[Payment Gateways<br/>QRIS/DANA/Transfer]
    end

    A -->|1. Create Order| E
    E -->|Save| I
    E -->|Create Payment| J
    E -->|Response| A

    A -->|2. Request Token| F
    F -->|Fetch Order| I
    F -->|Fetch Payment| J
    F -->|Call API| L
    F -->|Update midtrans_order_id| J
    F -->|Return Token| B

    B -->|3. Display Payment| C
    C -->|Load Snap.js| L
    L -->|Payment Page| M
    M -->|Payment Result| L
    L -->|Webhook POST| G

    G -->|Verify Signature| G
    G -->|Update Status| J
    G -->|Create Notification| K
    G -->|Return 200 OK| L

    D -->|4. Check Status| H
    H -->|Fetch| I
    H -->|Fetch Payment| J
    H -->|Return| D
```

## API Request/Response Flow

```mermaid
sequenceDiagram
    participant Backend as Backend Server
    participant Midtrans as Midtrans API
    participant Frontend as Frontend
    participant Webhook as Webhook Handler

    Note over Backend,Webhook: Step 1: Create Transaction

    Backend->>Midtrans: POST /snap/v1/transactions<br/>Headers:<br/>- Authorization: Basic {ServerKey}<br/>- Content-Type: application/json<br/>Body:<br/>{<br/>  transaction_details: {<br/>    order_id: "ORDER-123",<br/>    gross_amount: 50000<br/>  },<br/>  customer_details: {...}<br/>}
    Midtrans-->>Backend: 200 OK<br/>{<br/>  token: "abc123..."<br/>}

    Note over Backend,Webhook: Step 2: Frontend Displays Payment

    Backend->>Frontend: Return { snap_token: "abc123..." }
    Frontend->>Midtrans: window.snap.pay(token, callbacks)

    Note over Backend,Webhook: Step 3: Webhook Notification

    Midtrans->>Webhook: POST /api/payments/webhook<br/>{<br/>  transaction_id: "...",<br/>  order_id: "ORDER-123",<br/>  transaction_status: "settlement",<br/>  status_code: "200",<br/>  gross_amount: "50000",<br/>  signature_key: "...",<br/>  fraud_status: "...",<br/>  payment_type: "...",<br/>  transaction_time: "..."<br/>}
    Webhook->>Webhook: Verify Signature
    Webhook->>Webhook: Update Database
    Webhook-->>Midtrans: 200 OK
```

## Code Examples

### Backend: Create Snap Transaction (Node.js)

```javascript
const midtransClient = require('midtrans-client');

// Initialize Snap API instance
const snap = new midtransClient.Snap({
  isProduction: false, // Set to true for production
  serverKey: process.env.MIDTRANS_SERVER_KEY
});

// Create transaction
const parameter = {
  transaction_details: {
    order_id: "ORDER-123456",
    gross_amount: 50000
  },
  credit_card: {
    secure: true
  },
  customer_details: {
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "08111222333"
  }
};

snap.createTransaction(parameter)
  .then((transaction) => {
    const transactionToken = transaction.token;
    // Return token to frontend
    return { snap_token: transactionToken };
  })
  .catch((error) => {
    console.error('Error creating transaction:', error);
    throw error;
  });
```

### Backend: Handle Webhook Notification (Node.js)

```javascript
const midtransClient = require('midtrans-client');
const crypto = require('crypto');

// Initialize Snap API instance
const apiClient = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY
});

// Handle webhook notification
async function handleWebhook(notificationJson) {
  // Verify signature
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const signatureKey = crypto
    .createHash('sha512')
    .update(
      notificationJson.order_id +
      notificationJson.status_code +
      notificationJson.gross_amount +
      serverKey
    )
    .digest('hex');

  if (notificationJson.signature_key !== signatureKey) {
    console.error('Invalid signature');
    return; // Still return 200 OK
  }

  // Process notification using SDK
  const statusResponse = await apiClient.transaction.notification(notificationJson);
  
  const orderId = statusResponse.order_id;
  const transactionStatus = statusResponse.transaction_status;
  const fraudStatus = statusResponse.fraud_status;

  // Handle transaction status
  if (transactionStatus === 'capture') {
    if (fraudStatus === 'accept') {
      // Update payment status to PAID
      await updatePaymentStatus(orderId, 'PAID');
    }
  } else if (transactionStatus === 'settlement') {
    // Update payment status to PAID
    await updatePaymentStatus(orderId, 'PAID');
  } else if (
    transactionStatus === 'cancel' ||
    transactionStatus === 'deny' ||
    transactionStatus === 'expire'
  ) {
    // Keep status as PENDING (payment failed)
    // Optionally log the failure
  } else if (transactionStatus === 'pending') {
    // Keep status as PENDING (waiting for payment)
  }

  // Always return 200 OK
  return { status: 'ok' };
}
```

### Frontend: Display Payment Page (React/JavaScript)

```html
<!-- Include Snap.js library -->
<script
  type="text/javascript"
  src="https://app.sandbox.midtrans.com/snap/snap.js"
  data-client-key="YOUR_CLIENT_KEY"
></script>
<!-- Production: https://app.midtrans.com/snap/snap.js -->
```

```javascript
// After receiving token from backend
function handlePayment(snapToken) {
  window.snap.pay(snapToken, {
    onSuccess: function(result) {
      // Payment successful
      console.log('Payment success:', result);
      // Redirect or update UI
      window.location.href = '/orders/' + result.order_id;
    },
    onPending: function(result) {
      // Payment pending
      console.log('Payment pending:', result);
      // Show pending message to user
      alert('Waiting for your payment!');
    },
    onError: function(result) {
      // Payment failed
      console.log('Payment failed:', result);
      // Show error message
      alert('Payment failed!');
    },
    onClose: function() {
      // User closed payment popup
      console.log('Payment popup closed');
      alert('You closed the popup without finishing the payment');
    }
  });
}
```

## Database Schema

```mermaid
erDiagram
    Pesanan ||--|| Pembayaran : "has"
    Pesanan ||--o| Notification : "triggers"

    Pesanan {
        int id PK
        int order_number UK
        int user_id FK
        int paket_id FK
        enum status "PENDING|PROCESSING|IN_PROGRESS|COMPLETED"
        datetime scheduled_date
    }

    Pembayaran {
        int id PK
        int pesanan_id FK,UK
        enum method "QRIS|DANA|TRANSFER|CASH"
        int amount
        enum status "PENDING|PAID"
        string midtrans_order_id "nullable, set when token generated"
    }

    Notification {
        int id PK
        int user_id FK
        int pesanan_id FK
        string title
        string message
        boolean is_read
    }
```

## Security Considerations

1. **Webhook Signature Verification**: Always verify Midtrans webhook signatures using SHA512 hash to prevent fraud
   - Formula: `SHA512(order_id + status_code + gross_amount + server_key)`
   - Compare with `signature_key` from notification

2. **Idempotency**: Handle duplicate webhook notifications gracefully
   - Check if payment status already updated before processing
   - Always return HTTP 200 OK even for duplicates

3. **Order ID Format**: Use unique, non-guessable order IDs
   - Format: `ORDER-{timestamp}-{random}` or use UUID
   - Must be unique per transaction

4. **HTTPS Only**: All webhook endpoints must use HTTPS in production
   - Midtrans requires HTTPS for webhook URLs
   - Never use HTTP in production

5. **Key Security**:
   - Never expose Midtrans Server Key in frontend code
   - Store Server Key in environment variables
   - Client Key can be exposed in frontend (used for Snap.js)

6. **Response Requirement**: Webhook handler must always return HTTP 200 OK
   - Even for invalid signatures or errors
   - Midtrans will retry if non-200 response received

## Implementation Checklist

- [ ] Install `midtrans-client` NPM package
- [ ] Configure environment variables (Server Key, Client Key)
- [ ] Create `POST /api/payments/snap-token` endpoint
- [ ] Create `POST /api/payments/webhook` endpoint with signature verification
- [ ] Implement transaction status handling (settlement, capture, pending, deny, cancel, expire)
- [ ] Update frontend to include Snap.js library
- [ ] Implement `window.snap.pay()` with callbacks
- [ ] Handle payment status updates in database
- [ ] Create user notifications for payment status changes
- [ ] Add error handling and logging
- [ ] Test with Midtrans sandbox environment
- [ ] Configure production webhook URL in Midtrans dashboard
- [ ] Set up HTTPS for webhook endpoint in production

## References

- [Midtrans Snap Integration Guide](https://docs.midtrans.com/docs/snap-snap-integration-guide)
- [Midtrans Webhook Documentation](https://docs.midtrans.com/docs/https-notification-webhooks)
- [Midtrans Node.js Client](https://github.com/Midtrans/midtrans-nodejs-client)
