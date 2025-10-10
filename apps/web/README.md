# Aptos Tools Web App

The main web application for Aptos Tools, built with React, Vite, and the Aptos TypeScript SDK.

## Features

### Ledger Version Finder

Find the ledger version closest to a specific date and time using an efficient binary search algorithm.

**How it works:**
1. Takes a target date and time as input
2. Uses binary search to query blocks on the Aptos blockchain
3. Compares block timestamps with the target timestamp
4. Narrows down the search range until finding the closest match
5. Returns detailed information about the block including version, height, epoch, and timestamp

**Complexity:** O(log n) where n is the number of ledger versions

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Deploy to GitHub Pages
pnpm deploy
```

## Configuration

### Network Selection

The app supports all Aptos networks:
- Mainnet (default)
- Testnet
- Devnet

Switch between networks using the network selector in the header.

### GitHub Pages Deployment

The app is configured for deployment to GitHub Pages:
- Base path is set to `/aptos-tools/` in `vite.config.ts`
- GitHub Actions workflow handles automatic deployment on push to main
- Manual deployment available via `pnpm deploy`

## Adding New Tools

1. Create a new page component in `src/pages/YourTool.tsx`
2. Create styles in `src/pages/YourTool.module.css`
3. Add route in `src/App.tsx`
4. Add navigation link in `src/components/Layout.tsx`
5. Update home page in `src/pages/Home.tsx`

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool (with Rolldown bundler)
- **React Router** - Client-side routing
- **Aptos TypeScript SDK** - Blockchain interaction
- **CSS Modules** - Scoped styling

## License

MIT

