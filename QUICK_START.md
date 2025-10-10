# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000/aptos-tools/`

### 3. Build for Production

```bash
pnpm build
```

## 📦 What's Included

### Project Structure

```
aptos-tools/
├── apps/
│   └── web/                    # Main React application
│       ├── src/
│       │   ├── components/     # Layout and UI components
│       │   ├── contexts/       # Aptos SDK context provider
│       │   ├── pages/          # Page components and tools
│       │   └── styles/         # Global styles
│       ├── public/             # Static assets
│       └── vite.config.ts      # Vite configuration
├── .github/workflows/          # GitHub Actions for deployment
├── package.json                # Root package configuration
├── pnpm-workspace.yaml         # pnpm workspace configuration
└── turbo.json                  # Turborepo configuration
```

### Available Scripts

- `pnpm dev` - Start development server (all apps)
- `pnpm build` - Build for production
- `pnpm deploy` - Deploy to GitHub Pages
- `pnpm lint` - Run linter (when configured)

## 🔧 Available Tools

### 1. Ledger Version Finder

Find the exact ledger version for any date and time on the Aptos blockchain.

**Features:**
- Binary search algorithm for efficient searching
- Sub-second accuracy
- Support for all Aptos networks (Mainnet, Testnet, Devnet)
- Detailed logging of search process
- Returns ledger version, block height, epoch, and timestamp

**Use Cases:**
- Historical data analysis
- Event tracking
- Transaction investigation
- Network monitoring

## 🌐 Deployment to GitHub Pages

### Automatic Deployment

The project includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the `main` branch.

### Manual Deployment

```bash
# From the project root
pnpm deploy
```

### GitHub Repository Settings

1. Go to your repository settings
2. Navigate to Pages
3. Set Source to "GitHub Actions"
4. The site will be available at `https://yourusername.github.io/aptos-tools/`

## 🎨 Customization

### Changing the Repository Name

If your repository name is different from `aptos-tools`, update:

1. `apps/web/vite.config.ts` - Change the `base` field
2. `apps/web/src/main.tsx` - Change the `basename` in BrowserRouter
3. `.github/workflows/deploy.yml` - Update paths if needed

### Adding a New Tool

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed instructions on adding new tools.

## 📚 Tech Stack

- **React 18** - Latest React with hooks
- **TypeScript** - Type-safe development
- **Vite 6** - Ultra-fast build tool
- **Rolldown** - Rust-based bundler (via Vite)
- **Aptos SDK 1.32+** - Latest Aptos TypeScript SDK
- **React Router 7** - Modern routing
- **pnpm** - Fast, disk space efficient package manager
- **Turborepo** - High-performance build system

## 🎯 Key Features

- ✅ **Modern ESM** - Full ES modules support
- ✅ **TypeScript** - Type safety throughout
- ✅ **Monorepo Ready** - pnpm workspaces + Turborepo
- ✅ **GitHub Pages** - Automatic deployment
- ✅ **Responsive Design** - Mobile-friendly UI
- ✅ **Aptos Branding** - Professional look matching Aptos identity
- ✅ **Network Switching** - Easy switching between networks
- ✅ **Context API** - Clean state management

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 is already in use, Vite will automatically use the next available port.

### Build Errors

Ensure you're using Node.js 20+ and pnpm 9+:

```bash
node --version  # Should be 20.x or higher
pnpm --version  # Should be 9.x or higher
```

### Network Issues

If you can't connect to Aptos networks, check:
- Your internet connection
- The selected network in the app
- Aptos network status

## 📖 Documentation

- [Aptos TypeScript SDK](https://aptos.dev/sdks/ts-sdk/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Turborepo Documentation](https://turbo.build/repo)

## 💡 Need Help?

- Open an issue on GitHub
- Check [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- Review the codebase - it's well-documented!

## 📄 License

MIT - See [LICENSE](LICENSE) for details

