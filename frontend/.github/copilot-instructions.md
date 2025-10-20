# Aequilibra Frontend - AI Assistant Instructions

## Project Overview

Aequilibra is a **perpetual DEX funding rate aggregator** that helps traders find arbitrage opportunities across decentralized exchanges. The platform focuses on **delta-neutral strategies** where users can exploit funding rate differentials between exchanges like Hyperliquid and Extended Exchange.

### Core Business Logic
- **Funding Rates**: All rates are stored in decimal format (0.0001 = 0.01%)
- **Delta Neutral Strategy**: Long lower-rate exchange, short higher-rate exchange
- **APY Calculations**: Use standardized functions from `src/lib/apyCalculations.js`
- **8-Hour Funding Cycles**: Payments occur every 8 hours (00:00, 08:00, 16:00 UTC)

## Architecture

### Frontend Stack
- **Next.js 15** with App Router (`src/app/`)
- **React 19** with modern patterns
- **TypeScript** (`.js` files with JSDoc)
- **Tailwind CSS** + **shadcn/ui** components
- **OnchainKit** for Web3 integration (Base Mini App compliant)

### Key Integrations
- **Wagmi + Viem**: Multi-chain Web3 (Ethereum, Arbitrum, Optimism, Base, Polygon, BSC)
- **Prisma**: Database ORM with encrypted secrets
- **React Query**: Server state management
- **Zustand**: Client state management
- **Vitest**: Testing framework

### Route Structure
```
/                    → Landing page
/app/                → Main dashboard
/markets/            → Market overview
/markets/asset/[asset] → Asset-specific analysis
/onchain-demo/       → Web3 features demo
/docs/               → Documentation
```

## Development Patterns

### API Routes (`src/app/api/`)
- **Proxy Pattern**: Use `_config.js` helpers for backend communication
- **Exchange APIs**: 
  - Hyperliquid: `api/hyperliquid/` - Direct API calls
  - Extended: `api/extended/` - StarkNet-based exchange
- **Session Management**: Headers passed through `sessionHeaders()`
- **No-Cache**: Auth/agent responses use `cache: 'no-store'`

### Data Flow
1. **Exchange APIs** → Raw funding data
2. **API Routes** → Normalized format (decimal rates)
3. **React Hooks** → `useHyperliquidFunding()`, `useExtendedMarkets()`
4. **Components** → APY calculations via `apyCalculations.js`

### Funding Rate Standards
```javascript
// ALWAYS use decimal format internally
const hyperliquidRate = 0.0001;  // 0.01%
const extendedRate = 0.0025;     // 0.25%

// Use standardized APY calculation
import { calculateDeltaNeutralAPY } from '@/lib/apyCalculations';
const apy = calculateDeltaNeutralAPY(hlRate, exRate, 'year');
```

## UI/UX Guidelines

### Base Mini App Compliance
- **Touch Targets**: Minimum 44px (`touch-target` class)
- **Fonts**: Inter, DM Sans, JetBrains Mono (variables in layout)
- **Mobile-First**: Responsive design with mobile optimization
- **Theme Support**: Dark/light mode via `next-themes`

### Component Patterns
- **shadcn/ui**: Use existing components in `src/components/ui/`
- **Color Coding**: Green for positive rates, red for negative
- **Percentage Display**: Always show as percentages with proper precision
- **Loading States**: Use skeleton components for data fetching

## Key Commands

### Development
```bash
npm run dev           # Start with Turbopack
npm run build         # Production build
npm run test          # Run Vitest tests
npm run lint          # ESLint check
```

### Environment Setup
```bash
# Generate encryption key
openssl rand -base64 32

# Required environment variables
MASTER_KEY=<base64_key>
DATABASE_URL=postgresql://...
NEXT_PUBLIC_ONCHAINKIT_API_KEY=...
NEXT_PUBLIC_CDP_PROJECT_ID=...
```

## Critical Files

### Data & Logic
- `src/lib/apyCalculations.js` - **Standardized funding rate calculations**
- `src/lib/hyperliquidAPI.js` - Hyperliquid exchange integration
- `src/lib/extendedAPI-new.js` - Extended Exchange integration
- `src/lib/crypto.js` - Encryption utilities for secrets

### Configuration
- `src/components/providers.jsx` - App-wide providers (Wagmi, OnchainKit, Query)
- `src/lib/wagmi.js` - Multi-chain Web3 configuration
- `src/app/api/_config.js` - API proxy utilities

### UI Components
- `src/components/markets/ComparisonPairsTable.jsx` - Main comparison table
- `src/components/FundingComparison.jsx` - Rate comparison component
- `src/app/markets/asset/[asset]/page.js` - Detailed asset analysis

## Testing & Security

### Test Patterns
- **Vitest** for unit tests (see `crypto.test.js`)
- **Mock Data**: Use realistic funding rate variations
- **Environment**: Mock `process.env.MASTER_KEY` for crypto tests

### Security Considerations
- **Encryption**: All secrets encrypted with DEK/KEK pattern
- **API Keys**: Environment variables only, never logged
- **CORS**: Proper headers for exchange API calls
- **Rate Limiting**: Consider API call frequency

## Common Issues & Solutions

### Funding Rate Display
- **Problem**: Inconsistent percentage formatting
- **Solution**: Use `apyCalculations.js` functions consistently
- **Debug**: Check `test-funding-display.js` for examples

### API Proxy Issues
- **Problem**: CORS or auth headers missing
- **Solution**: Use `proxyInit()` from `_config.js`
- **Debug**: Check `/api/debug/hyperliquid` endpoint

### Mobile Optimization
- **Problem**: Touch targets too small
- **Solution**: Use `touch-target` spacing, test on mobile
- **Base Compliance**: Follow OnchainKit Mini App guidelines

## When Making Changes

1. **Funding Calculations**: Always test with `test-funding-display.js`
2. **API Changes**: Update both client hooks and server routes
3. **UI Updates**: Ensure mobile responsiveness and theme compatibility
4. **New Exchanges**: Follow existing patterns in `lib/` directory
5. **Database Changes**: Update Prisma schema and run migrations

This codebase prioritizes **accuracy in financial calculations** and **mobile-first UX** for the Base ecosystem.