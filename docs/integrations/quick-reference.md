# Integration Quick Reference

## Quick Start

### 1. Check if a service is available
```typescript
import { isStripeAvailable } from './services/stripeService';
if (isStripeAvailable()) {
    // Use Stripe
}
```

### 2. Make a service call with error handling
```typescript
import { withServiceWrapper } from './services/serviceWrapper';

const result = await withServiceWrapper(
    () => yourServiceCall(),
    {
        service: 'gemini', // or 'stripe', 'supabase'
        operation: 'operationName',
        severity: 'high', // 'low' | 'medium' | 'high' | 'critical'
    }
);
```

### 3. Add retry logic
```typescript
import { withRetry } from './services/retryHandler';

const result = await withRetry(
    () => apiCall(),
    {
        maxRetries: 3,
        initialDelay: 1000,
    }
);
```

### 4. Check service health
```typescript
import { integrationManager } from './services/integrationManager';

const health = await integrationManager.checkServiceHealth('stripe');
if (health.status === 'healthy') {
    // Proceed
}
```

### 5. View error logs
```typescript
import { errorLogger } from './services/errorLogger';

const stats = errorLogger.getErrorStats('gemini');
const recent = errorLogger.getRecentErrors('gemini', 10);
```

## Common Patterns

### Stripe Payment
```typescript
import { initializeStripe, createPaymentIntent, confirmPayment } from './services/stripeService';
import { Elements, PaymentElement } from '@stripe/react-stripe-js';

// Initialize
const stripe = await initializeStripe();

// Create payment intent
const clientSecret = await createPaymentIntent(amount, 'usd');

// In component
<Elements stripe={stripe} options={{ clientSecret }}>
    <PaymentElement />
</Elements>
```

### Gemini AI Call
```typescript
import { analyzeClothingItem } from './services/geminiService';

// Already includes retry and error handling
const item = await analyzeClothingItem(base64Image, 'image/jpeg');
```

### Service Health Check
```typescript
import { integrationManager } from './services/integrationManager';

// Check all services
const overall = integrationManager.getOverallHealth();
if (overall.status === 'down') {
    // Show error to user
}
```

## Error Severity Guidelines

- **low**: Non-critical errors, informational
- **medium**: Standard errors, may affect functionality
- **high**: Important errors, affects user experience
- **critical**: Critical errors, payment/auth failures

## Service Names

- `'stripe'` - Payment processing
- `'supabase'` - Database and auth
- `'gemini'` - AI services

## Environment Variables

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_PROJECT_ID=...
VITE_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
```

## Integration Monitor Component

```typescript
import IntegrationMonitor from './components/IntegrationMonitor';

// Add to your admin/settings page
<IntegrationMonitor />
```
