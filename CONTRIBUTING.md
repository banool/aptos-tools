# Contributing to Aptos Tools

Thank you for your interest in contributing to Aptos Tools! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js >= 20.0.0 (use the version specified in `.node-version`)
- pnpm >= 9.0.0

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/aptos-tools.git
   cd aptos-tools
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Build for production:
   ```bash
   pnpm build
   ```

## Project Structure

```
aptos-tools/
├── apps/
│   └── web/              # Main web application
│       ├── src/
│       │   ├── components/   # Reusable components
│       │   ├── contexts/     # React contexts (Aptos SDK)
│       │   ├── pages/        # Page components
│       │   └── styles/       # Global styles
│       └── public/       # Static assets
├── packages/             # Shared packages (future)
└── turbo.json           # Turborepo configuration
```

## Adding a New Tool

1. Create a new page component in `apps/web/src/pages/`
2. Create corresponding CSS module for styling
3. Add the route to `apps/web/src/App.tsx`
4. Add navigation link to `apps/web/src/components/Layout.tsx`
5. Update the tools list in `apps/web/src/pages/Home.tsx`

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use functional components with hooks
- Use CSS Modules for styling
- Keep components small and focused

## Submitting Changes

1. Create a new branch for your feature/fix
2. Make your changes
3. Test your changes locally
4. Submit a pull request

## Questions?

Feel free to open an issue if you have any questions or need help!

