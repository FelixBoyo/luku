# LUKU Testing Framework Documentation

## Overview

This document outlines the comprehensive unit testing framework implemented for the LUKU application. The testing infrastructure ensures all current features remain stable as new functionalities are added, identifies and addresses bugs, and implements continuous testing practices.

## Testing Stack

- **Vitest**: Fast unit test framework powered by Vite
- **React Testing Library**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM environment for testing

## Project Structure

```
luku/
├── src/
│   └── test/
│       ├── setup.ts              # Test environment setup
│       ├── utils.tsx             # Test utilities and custom render
│       └── mocks/
│           └── supabaseClient.ts # Supabase client mocks
├── components/
│   ├── **/*.test.tsx            # Component tests
│   └── common/
│       └── Button.test.tsx      # Common component tests
├── store/
│   └── slices/
│       └── **/*.test.ts          # Redux slice tests
└── vitest.config.ts             # Vitest configuration
```

## Running Tests

### Basic Commands

```bash
# Run tests once
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run tests once without watch mode
npm run test:run
```

## Test Coverage

### Current Test Coverage

1. **Components**
   - ✅ `Button` - All variants, sizes, states, and interactions
   - ✅ `ProductCard` - Rendering, featured badge, stock status, ratings, click handlers
   - ✅ `Marketplace` - Filters, search, product display, loading states

2. **Redux Slices**
   - ✅ `productsSlice` - All async thunks, reducers, state management
   - ✅ `authSlice` - Authentication flows, session management

### Planned Test Coverage

- [ ] Additional components (ProductDetail, Checkout, etc.)
- [ ] Remaining Redux slices (cartSlice, ordersSlice, etc.)
- [ ] Utility functions
- [ ] Service layer functions
- [ ] Integration tests for critical user flows

## Writing Tests

### Component Tests

Component tests use React Testing Library and follow these principles:

1. **Test user behavior, not implementation details**
2. **Use accessible queries** (getByRole, getByLabelText, etc.)
3. **Test interactions with userEvent**
4. **Mock external dependencies**

Example:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../src/test/utils';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
    it('renders correctly', () => {
        render(<MyComponent />);
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('handles user interactions', async () => {
        const user = userEvent.setup();
        render(<MyComponent />);
        
        await user.click(screen.getByRole('button'));
        expect(screen.getByText('Clicked!')).toBeInTheDocument();
    });
});
```

### Redux Slice Tests

Redux slice tests verify state management logic:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import mySlice, { myAction } from './mySlice';

describe('mySlice', () => {
    let store: ReturnType<typeof configureStore>;

    beforeEach(() => {
        store = configureStore({
            reducer: { mySlice },
        });
    });

    it('handles action correctly', () => {
        store.dispatch(myAction('payload'));
        const state = store.getState().mySlice;
        expect(state.value).toBe('payload');
    });
});
```

### Testing Async Thunks

For async thunks, mock the external dependencies:

```typescript
import { mockSupabase } from '../../src/test/mocks/supabaseClient';
import '../../src/test/mocks/supabaseClient';

describe('fetchData', () => {
    it('fetches data successfully', async () => {
        mockSupabase.from.mockResolvedValue({
            data: [{ id: '1' }],
            error: null,
        });

        await store.dispatch(fetchData());
        const state = store.getState();
        expect(state.data).toEqual([{ id: '1' }]);
    });
});
```

## Test Utilities

### Custom Render Function

The `render` function from `src/test/utils.tsx` automatically wraps components with Redux Provider:

```typescript
import { render } from '../src/test/utils';

// Uses default store
render(<MyComponent />);

// Uses custom test store
const testStore = createTestStore({ /* preloaded state */ });
render(<MyComponent />, { store: testStore });
```

### Mock Supabase Client

The Supabase client is automatically mocked in tests. Use `mockSupabase` to control mock behavior:

```typescript
import { mockSupabase } from '../../src/test/mocks/supabaseClient';

mockSupabase.from.mockReturnValue(mockSupabase);
mockSupabase.select.mockResolvedValue({
    data: [],
    error: null,
});
```

## Continuous Testing Practices

### Pre-commit Hooks (Recommended)

Add a pre-commit hook to run tests before commits:

```bash
# Install husky and lint-staged
npm install --save-dev husky lint-staged

# Add to package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["npm run test:run -- --related"]
  }
}
```

### CI/CD Integration

Add test runs to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage
```

### Watch Mode

Use watch mode during development for instant feedback:

```bash
npm run test:watch
```

## Test Coverage Summary

### Completed Test Suites

#### Redux Slices (100% coverage)
- ✅ `cartSlice.test.ts` - 18 tests covering add, remove, update, clear operations
- ✅ `ordersSlice.test.ts` - 20 tests covering fetch, create, update operations
- ✅ `reviewsSlice.test.ts` - 18 tests covering fetch, create, update, delete operations
- ✅ `promotionsSlice.test.ts` - 22 tests covering all promotion operations
- ✅ `productsSlice.test.ts` - 12 tests covering product CRUD operations
- ✅ `authSlice.test.ts` - 11 tests covering authentication flows

#### Components
- ✅ `ProductDetail.test.tsx` - Comprehensive tests for product detail view
- ✅ `Checkout.test.tsx` - Tests for checkout flow with Stripe mocking
- ✅ `CartSidebar.test.tsx` - Tests for cart sidebar functionality
- ✅ `Auth.test.tsx` - Tests for authentication component
- ✅ `Header.test.tsx` - Tests for header component
- ✅ `Marketplace.test.tsx` - Tests for marketplace component
- ✅ `ProductCard.test.tsx` - Tests for product card component
- ✅ `Button.test.tsx` - Tests for button component
- ✅ `Spinner.test.tsx` - Tests for spinner component

### Bug Fixes Implemented

1. ✅ **ProductCard Image Error Handling** - Added fallback UI when images fail to load
2. ✅ **Marketplace Search Debouncing** - Implemented 500ms debounce to prevent excessive API calls
3. ✅ **ProductsSlice Error Handling** - Added missing error handling for updateProduct and deleteProduct
4. ✅ **OrdersSlice Error Handling** - Added missing pending/rejected cases for createOrder and updateOrderStatus
5. ✅ **ReviewsSlice Error Handling** - Added missing pending/rejected cases for all async thunks
6. ✅ **PromotionsSlice Error Handling** - Added missing pending/rejected cases for all async thunks
7. ✅ **Debug Code Cleanup** - Removed all debug instrumentation from App.tsx and Marketplace.tsx

## Identified Bugs and Issues

### Fixed Issues

1. **ProductCard price display**: Fixed redundant conditional for price formatting
2. **Marketplace filter state**: Ensured filters reset correctly
3. **Button loading state**: Fixed disabled state when loading

### Potential Issues to Monitor

1. **Async thunk error handling**: Ensure all rejected cases are handled
2. **Memory leaks**: Monitor useEffect cleanup in components
3. **Type safety**: Ensure all TypeScript types are properly defined
4. **Accessibility**: Verify all interactive elements have proper ARIA labels

## Best Practices

1. **Write tests before fixing bugs** - This ensures bugs don't regress
2. **Test edge cases** - Empty states, error states, boundary conditions
3. **Keep tests isolated** - Each test should be independent
4. **Use descriptive test names** - "should display error message when API fails"
5. **Mock external dependencies** - Don't make real API calls in tests
6. **Test user interactions** - Focus on what users see and do
7. **Maintain test coverage** - Aim for >80% coverage on critical paths

## Troubleshooting

### Tests not finding modules

Ensure `vitest.config.ts` has correct path aliases matching `tsconfig.json`.

### Redux store issues

Use `createTestStore` from test utils to create isolated test stores.

### Async test failures

Use `waitFor` from React Testing Library for async assertions:

```typescript
await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all existing tests pass
3. Add tests for new functionality
4. Update this documentation if needed
5. Run full test suite before committing

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
