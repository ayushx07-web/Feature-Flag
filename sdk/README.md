# @feature-flags/sdk

The official JavaScript/TypeScript SDK for the Feature Flag Management System.

## Installation

```bash
npm install @feature-flags/sdk
```

## Usage

```typescript
import { FeatureFlagClient } from '@feature-flags/sdk';

const client = new FeatureFlagClient({
  apiUrl: 'http://localhost:8080',
  apiKey: 'ff_live_your_project_key',
  userId: 'user_12345',
  userAttributes: { plan: 'pro', email: 'alice@example.com' },
  refreshIntervalMs: 30000, 
  onFlagsUpdate: (flags) => {
    console.log('Flags updated from polling!', flags);
  }
});

async function main() {
  // 1. Initialize to fetch flags into memory cache
  await client.initialize();

  // 2. Read synchronously from cache
  const isEnabled = client.isEnabled('new-checkout-design');
  console.log('Checkout enabled?', isEnabled);

  // 3. Or check bypassing cache for immediate absolute truth
  const isEnabledFresh = await client.isEnabledAsync('new-checkout-design');
  
  // 4. Cleanup when done (e.g. component unmount)
  // client.destroy();
}

main();
```
