# Third-Party Integration Management Guide

This document provides comprehensive information about managing third-party service integrations in the LUKU platform.

## Overview

The LUKU platform integrates with several third-party services:
- **Stripe**: Payment processing
- **Supabase**: Database and authentication
- **Google Gemini AI**: AI-powered styling features

## Architecture

### Core Components

1. **Integration Configuration** (`services/integrationConfig.ts`)
   - Centralized configuration management
   - Environment variable handling
   - Service validation

2. **Integration Manager** (`services/integrationManager.ts`)
   - Health monitoring
   - Service metrics tracking
   - Overall system health assessment

3. **Retry Handler** (`services/retryHandler.ts`)
   - Exponential backoff retry logic
   - Configurable retry strategies
   - Network error handling

4. **Error Logger** (`services/errorLogger.ts`)
   - Centralized error tracking
   - Error severity classification
   - Error statistics and reporting

5. **Service Wrapper** (`services/serviceWrapper.ts`)
   - Unified error handling
   - Automatic metrics recording
   - Consistent service call patterns

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_ANON_KEY=your-anon-key

# Gemini AI
GEMINI_API_KEY=your-api-key
```

### Configuration Validation

The system automatically validates configuration on startup:

```typescript
import { validateIntegrationConfig, getIntegrationConfig } from './services/integrationConfig';

const config = getIntegrationConfig();
const validation = validateIntegrationConfig(config);

if (!validation.valid) {
    console.error('Configuration errors:', validation.errors);
}
```

## Service Usage

### Stripe Integration

#### Initialization

```typescript
import { initializeStripe, isStripeAvailable } from './services/stripeService';

if (isStripeAvailable()) {
    const stripe = await initializeStripe();
}
```

#### Creating Payment Intents

```typescript
import { createPaymentIntent } from './services/stripeService';

const clientSecret = await createPaymentIntent(
    amountInCents,
    'usd',
    { product_id: 'prod_123', quantity: '1' }
);
```

#### Confirming Payments

```typescript
import { confirmPayment } from './services/stripeService';
import { Elements, PaymentElement } from '@stripe/react-stripe-js';

// In your component
<Elements stripe={stripe} options={{ clientSecret }}>
    <PaymentForm />
</Elements>
```

### Gemini AI Integration

All Gemini API calls automatically include:
- Retry logic with exponential backoff
- Error logging and tracking
- Metrics recording

```typescript
import { analyzeClothingItem } from './services/geminiService';

const itemData = await analyzeClothingItem(base64Image, 'image/jpeg');
```

### Supabase Integration

Supabase is already configured in `services/supabaseClient.ts`. The integration manager monitors its health automatically.

### M-Pesa Integration

M-Pesa is supported via the `services/mpesaService.ts` module and is intended for regions where mobile money is common.

All M-Pesa calls:
- Go through your backend (`/api/payments/mpesa/*`).
- Include retry logic and error logging via `mpesaService` + `integrationManager`.

**Example:**

```typescript
import {
    isMpesaAvailable,
    startMpesaCheckout,
    getMpesaPaymentStatus,
} from './services/mpesaService';

if (isMpesaAvailable()) {
    const start = await startMpesaCheckout({
        amount: totalAmount,
        phoneNumber: userPhone,
        accountReference: 'order-123',
        metadata: { cart_total: totalAmount.toString() },
    });

    const status = await getMpesaPaymentStatus(start.paymentRequestId);
}
```

## Health Monitoring

### Integration Monitor Component

Use the `IntegrationMonitor` component to display real-time service health:

```typescript
import IntegrationMonitor from './components/IntegrationMonitor';

<IntegrationMonitor />
```

### Programmatic Health Checks

```typescript
import { integrationManager } from './services/integrationManager';

// Check specific service
const health = await integrationManager.checkServiceHealth('stripe');

// Check all services
const allHealth = await integrationManager.checkAllServicesHealth();

// Get overall health
const overall = integrationManager.getOverallHealth();
```

### Service Metrics

```typescript
// Get metrics for a service
const metrics = integrationManager.getMetrics('gemini');
console.log(`Success rate: ${(metrics.successfulRequests / metrics.totalRequests * 100).toFixed(1)}%`);
```

## Error Handling

### Error Logging

Errors are automatically logged when using service wrappers:

```typescript
import { withServiceWrapper } from './services/serviceWrapper';

const result = await withServiceWrapper(
    async () => {
        // Your service call
    },
    {
        service: 'gemini',
        operation: 'generateOutfits',
        severity: 'high',
        context: { itemCount: items.length },
    }
);
```

### Error Statistics

```typescript
import { errorLogger } from './services/errorLogger';

// Get error stats
const stats = errorLogger.getErrorStats('stripe');
console.log(`Total errors: ${stats.total}`);
console.log(`Critical errors: ${stats.bySeverity.critical}`);

// Get recent errors
const recentErrors = errorLogger.getRecentErrors('gemini', 10);
```

## Retry Logic

### Using Retry Handler

```typescript
import { withRetry } from './services/retryHandler';

const result = await withRetry(
    async () => {
        // Your API call
    },
    {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        retryableErrors: ['NetworkError', 'TIMEOUT'],
    }
);
```

### Retry Wrapper

Create a reusable retry wrapper:

```typescript
import { createRetryWrapper } from './services/retryHandler';

const retryableApiCall = createRetryWrapper(
    myApiCall,
    {
        maxRetries: 2,
        initialDelay: 500,
    }
);
```

## Best Practices

### 1. Always Use Service Wrappers

Wrap all third-party service calls with `withServiceWrapper` for consistent error handling and metrics:

```typescript
// ✅ Good
const result = await withServiceWrapper(
    () => externalApiCall(),
    { service: 'gemini', operation: 'analyze', severity: 'high' }
);

// ❌ Bad
const result = await externalApiCall();
```

### 2. Configure Retry Logic Appropriately

- Use retries for network operations
- Don't retry on authentication errors
- Set appropriate retry limits

### 3. Monitor Service Health

- Check service health before critical operations
- Display health status to users when services are degraded
- Set up alerts for critical service failures

### 4. Handle Errors Gracefully

- Provide user-friendly error messages
- Log detailed error information for debugging
- Implement fallback mechanisms when possible

### 5. Test Integrations

- Test with invalid credentials
- Test network failure scenarios
- Test rate limiting responses
- Test service downtime scenarios

## Adding New Integrations

To add a new third-party service:

1. **Add Configuration** (`services/integrationConfig.ts`):
   ```typescript
   export interface IntegrationConfig {
       // ... existing services
       newService: {
           apiKey: string;
           enabled: boolean;
       };
   }
   ```

2. **Create Service Module** (`services/newService.ts`):
   ```typescript
   import { withServiceWrapper } from './serviceWrapper';
   import { getIntegrationConfig } from './integrationConfig';

   export const callNewService = async () => {
       return withServiceWrapper(
           async () => {
               // Service implementation
           },
           {
               service: 'newService',
               operation: 'callNewService',
               severity: 'medium',
           }
       );
   };
   ```

3. **Update Integration Manager** (`services/integrationManager.ts`):
   - Add service to `ServiceName` type
   - Add health check method
   - Initialize in constructor

4. **Update Health Monitor** (`components/IntegrationMonitor.tsx`):
   - Add service to services array
   - Update UI if needed

For payments specifically, also see:
- `BACKEND_PAYMENTS_API.md`
- `PAYMENTS_INTEGRATION_CHECKLIST.md`

## Troubleshooting

### Service Not Initializing

1. Check environment variables are set correctly
2. Verify API keys are valid
3. Check browser console for errors
4. Use Integration Monitor to see service status

### High Error Rates

1. Check error logs for patterns
2. Verify API rate limits
3. Check network connectivity
4. Review retry configuration

### Slow Response Times

1. Check service metrics for average response times
2. Review retry configuration (too many retries can slow things down)
3. Check if service is degraded
4. Consider implementing caching

## Monitoring Dashboard

Access the integration monitor in your application to see:
- Real-time service health status
- Error statistics and trends
- Request metrics (success rate, response times)
- Recent errors with details

## Support

For issues with integrations:
1. Check the Integration Monitor component
2. Review error logs using `errorLogger`
3. Check service health using `integrationManager`
4. Review this guide for best practices
