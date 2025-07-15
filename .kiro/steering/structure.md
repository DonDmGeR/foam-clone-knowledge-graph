# Project Structure & Architecture

## File Organization

```
/
├── components/           # React components
│   ├── Graph.tsx        # D3 graph visualization component
│   └── Sidebar.tsx      # Main sidebar with controls and editor
├── hooks/               # Custom React hooks
│   ├── useDebounce.ts   # Debounced value hook
│   ├── useGraphData.ts  # File system data processing
│   └── usePersistentState.ts # LocalStorage state persistence
├── App.tsx              # Main application component
├── index.tsx            # React app entry point
├── types.ts             # TypeScript type definitions
├── index.html           # HTML entry point
├── vite.config.ts       # Vite build configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
└── README.md            # Project documentation
```

## Architecture Patterns

### Component Structure
- **App.tsx**: Main application state and orchestration
- **Graph.tsx**: Pure D3 visualization component (forwardRef for SVG access)
- **Sidebar.tsx**: Complex UI component with multiple panels and editor

### State Management
- **React built-in state** with useState and useEffect
- **Custom hooks** for reusable logic (debouncing, persistence, data fetching)
- **LocalStorage persistence** for user preferences and settings
- **No external state management** (Redux, Zustand, etc.)

### Data Flow
1. **File System Access API** → Raw file data
2. **useGraphData hook** → Processed graph data (nodes/links)
3. **App.tsx** → State distribution to components
4. **Graph.tsx** → D3 visualization rendering
5. **Sidebar.tsx** → User interactions and file operations

## Key Architectural Decisions

### Separation of Concerns
- **Data processing**: Isolated in `useGraphData` hook
- **UI state**: Managed in main App component
- **Visualization**: Encapsulated in Graph component
- **File operations**: Centralized in App with callback props

### TypeScript Integration
- **Strict typing** for all components and hooks
- **Global type declarations** for File System Access API
- **Enum usage** for NodeType constants
- **Interface definitions** for all data structures

### Performance Optimizations
- **useMemo** for expensive computations (filtered nodes, color scales)
- **useCallback** for event handlers to prevent re-renders
- **Debounced search** to limit API calls
- **Lazy content loading** for file contents

## Naming Conventions

### Files & Directories
- **PascalCase** for React components (`Graph.tsx`, `Sidebar.tsx`)
- **camelCase** for hooks (`useDebounce.ts`, `useGraphData.ts`)
- **lowercase** for configuration files (`vite.config.ts`, `tsconfig.json`)

### Code Conventions
- **PascalCase** for React components and TypeScript interfaces
- **camelCase** for functions, variables, and props
- **SCREAMING_SNAKE_CASE** for constants
- **Descriptive naming** for event handlers (`handleNodeClick`, `handleSaveFile`)

## Component Props Pattern
- **Callback props** for parent-child communication
- **State lifting** to App component for shared state
- **Prop drilling** minimized through logical component hierarchy
- **Optional props** with default values where appropriate

## File System Integration
- **FileSystemDirectoryHandle** for directory access
- **Recursive traversal** for nested folder structures
- **Permission handling** with user prompts
- **Error boundaries** for API failures

## Styling Approach
- **Tailwind utility classes** for consistent styling
- **Theme-aware classes** with dark: prefixes
- **Responsive design** with mobile-first approach
- **Component-scoped styling** without external CSS files