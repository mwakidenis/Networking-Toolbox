# Developer Guide

This is your comprehensive guide to understanding and contributing to the networking toolbox. The app is built with SvelteKit and provides over 100 networking tools for subnet calculations, DNS operations, IP conversions and diagnostic checks.

## Project Structure

The application follows SvelteKit's file-based routing with a well-organized component architecture.

### Key Directories

```
src/
├── routes/                 # File-based routing (100+ tool pages)
├── lib/
│   ├── components/         # Reusable Svelte components
│   │   ├── tools/         # Individual tool implementations
│   │   ├── global/        # App-wide components (search, navigation)
│   │   ├── furniture/     # Layout components (header, footer)
│   │   └── common/        # Shared UI components
│   ├── stores/            # Svelte stores for state management
│   ├── utils/             # Business logic and calculations
│   ├── constants/         # App configuration and data
│   ├── content/           # Educational content for reference pages
│   └── styles/            # SCSS stylesheets
static/                    # Static assets (images, icons, manifests)
tests/                     # Unit and e2e tests
```

### File Naming Conventions

- **Routes**: Follow SvelteKit conventions (`+page.svelte`, `+layout.svelte`, `+server.ts`)
- **Components**: PascalCase (e.g., `SubnetCalculator.svelte`)
- **Utils**: kebab-case (e.g., `cidr-split.ts`)
- **Stores**: camelCase (e.g., `toolUsage.ts`)

## Application Architecture

### Route Organization

The app organizes its 100+ tools into logical sections:

- **`/subnetting`** - Subnet calculators (IPv4, IPv6, VLSM, supernetting)
- **`/cidr`** - CIDR operations (summarization, splitting, set operations)
- **`/ip-address-convertor`** - IP format conversions and generators
- **`/dns`** - DNS record generators and validators
- **`/diagnostics`** - Live network diagnostic tools
- **`/reference`** - Educational content and quick references

### Component Hierarchy

The component structure follows a clear hierarchy:

1. **Tool Components** (`src/lib/components/tools/`) - Individual tool implementations
2. **Global Components** (`src/lib/components/global/`) - App-wide functionality
3. **Furniture Components** (`src/lib/components/furniture/`) - Layout and navigation
4. **Common Components** (`src/lib/components/common/`) - Shared UI elements

### State Management

The app uses Svelte stores for managing global state:

- **`theme.ts`** - Theme switching (light/dark/auto)
- **`bookmarks.ts`** - User bookmarked tools
- **`navbarDisplay.ts`** - Navigation visibility preferences
- **`accessibility.ts`** - Accessibility settings
- **`toolUsage.ts`** - Tool usage tracking for "frequently used"
- **`offline.ts`** - Offline mode detection

## Core Systems

### Navigation System

The navigation is centrally managed in [`src/lib/constants/nav.ts`](https://github.com/Lissy93/networking-toolbox/blob/main/src/lib/constants/nav.ts). This file defines:

- **`TOP_NAV`** - Main navigation sections
- **`SUB_NAV`** - Individual tool pages
- **`makePath()`** - Path resolution with base path support

> [!NOTE]
> The navigation system handles dynamic base path resolution for deployments on subdomains or subdirectories.

### Icon System

Icons are managed through [`src/lib/constants/icon-map.ts`](https://github.com/Lissy93/networking-toolbox/blob/main/src/lib/constants/icon-map.ts). The app uses Lucide icons with a centralized mapping system that allows tools to specify icons by name.

### Global Search

The search functionality (`src/lib/components/global/GlobalSearch.svelte`) provides:

- Real-time filtering across all tools
- Keyword-based matching
- Description and tag searching
- Keyboard navigation support

## Development Workflow

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run in preview mode
npm run preview
```

### Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | Svelte type checking |
| `npm run lint` | ESLint code linting |
| `npm run format` | Prettier code formatting |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |

### Code Quality

The project enforces code quality through:

- **ESLint** - Code linting with Svelte-specific rules
- **Prettier** - Code formatting
- **TypeScript** - Type safety
- **Svelte Check** - Svelte-specific type checking

### Build Configurations

The app supports multiple deployment targets:

- **`npm run build:node`** - Node.js server deployment
- **`npm run build:static`** - Static site generation

## Key Files Reference

### Configuration Files

- **[`svelte.config.js`](https://github.com/Lissy93/networking-toolbox/blob/main/svelte.config.js)** - SvelteKit configuration
- **[`vite.config.ts`](https://github.com/Lissy93/networking-toolbox/blob/main/vite.config.ts)** - Vite build configuration
- **[`playwright.config.ts`](https://github.com/Lissy93/networking-toolbox/blob/main/playwright.config.ts)** - E2E test configuration
- **[`eslint.config.js`](https://github.com/Lissy93/networking-toolbox/blob/main/eslint.config.js)** - Linting rules

### Core Application Files

- **[`src/app.html`](https://github.com/Lissy93/networking-toolbox/blob/main/src/app.html)** - HTML template
- **[`src/routes/+layout.svelte`](https://github.com/Lissy93/networking-toolbox/blob/main/src/routes/%2Blayout.svelte)** - Root layout
- **[`src/lib/constants/site.ts`](https://github.com/Lissy93/networking-toolbox/blob/main/src/lib/constants/site.ts)** - Site-wide configuration

## Browser Support

The app supports modern browsers with:

- ES2020+ features
- CSS Grid and Flexbox
- Service Workers (for offline functionality)
- Local Storage (for user preferences)

## Performance Considerations

The application is optimized for performance through:

- **Code splitting** - Each tool is lazy-loaded
- **Tree shaking** - Unused code is eliminated
- **Service Worker** - Offline caching and background updates
- **Minimal dependencies** - Zero runtime dependencies beyond SvelteKit

IPv4 addresses contain exactly 4,294,967,296 possible combinations. The app can handle calculations across the entire address space efficiently using optimized algorithms for subnet operations.

## Next Steps

Continue reading the specialized documentation:

- [Theming System](./theming.md) - Styling and theme customization
- [Testing Guide](./testing.md) - Running and writing tests
- [Adding New Tools](./new-tools.md) - Creating new tool components
- [Build & Deployment](./build-deployment.md) - Production builds and hosting