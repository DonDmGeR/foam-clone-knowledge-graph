# Technology Stack & Build System

## Core Technologies

### Frontend Framework
- **React 19.1.0** with TypeScript for component-based UI
- **TypeScript 5.7.2** for type safety and better developer experience
- **JSX** with `react-jsx` transform for component syntax

### Visualization & Data
- **D3.js 7.9.0** for force-directed graph simulation and SVG manipulation
- **File System Access API** for local directory reading/writing (Chrome/Edge/Opera support required)

### Build System
- **Vite 6.2.0** as the build tool and dev server
- **ES Modules** with bundler module resolution
- **Node.js** required for development environment

### Styling
- **Tailwind CSS** for utility-first styling (inferred from className patterns)
- **CSS Custom Properties** for theme switching (light/dark mode)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Browser Requirements
- **Chrome/Edge/Opera** - Required for File System Access API
- **Modern ES2020+ support** - Uses latest JavaScript features
- **DOM and DOM.Iterable** support

## TypeScript Configuration
- **Target**: ES2020 with modern JavaScript features
- **Strict mode** enabled with comprehensive linting rules
- **Path aliases**: `@/*` maps to project root
- **JSX**: React JSX transform
- **Module system**: ESNext with bundler resolution

## Key Dependencies
- No external CSS frameworks beyond Tailwind
- No state management libraries (uses React built-in state)
- No routing library (single-page application)
- No backend dependencies (client-side only)

## Environment Variables
- `GEMINI_API_KEY` in `.env.local` (currently unused in main app logic)

## Performance Considerations
- Client-side file processing with async/await patterns
- Debounced search to prevent excessive re-renders
- Lazy loading of file content (loaded on-demand)
- D3 simulation optimization for large graphs (500+ nodes)