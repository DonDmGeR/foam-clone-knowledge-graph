# Design Document

## Overview

This design implements a unified glow button system that replaces all existing button styles in the Knowledge Graph Visualizer with a modern, consistent purple/violet glow design. The system provides multiple button variants while maintaining visual consistency and accessibility.

## Architecture

### CSS Custom Properties System
The design uses CSS custom properties (CSS variables) to enable theme-aware color variations and easy maintenance. The system defines color schemes for both light and dark themes.

### Button Variant System
- **Primary**: Main action buttons (Save, Select Directory, etc.)
- **Secondary**: Less prominent actions (Reset, Export, etc.)  
- **Danger**: Destructive actions (Delete)
- **Success**: Positive actions (Create, New Note)
- **Icon-only**: Small buttons with just icons (Rename, Fullscreen, etc.)

### Size Variants
- **Small**: Icon buttons, inline actions
- **Medium**: Standard buttons
- **Large**: Primary call-to-action buttons

## Components and Interfaces

### Core Button Styles
```css
.glow-button {
  /* Base glow button styles */
  border: 0.25em solid var(--glow-color);
  padding: 1em 3em;
  color: var(--glow-color);
  font-size: 15px;
  font-weight: bold;
  background-color: var(--btn-color);
  border-radius: 1em;
  outline: none;
  box-shadow: 
    0 0 1em 0.25em var(--glow-color),
    0 0 4em 1em var(--glow-spread-color),
    inset 0 0 0.75em 0.25em var(--glow-color);
  text-shadow: 0 0 0.5em var(--glow-color);
  position: relative;
  transition: all 0.3s;
  cursor: pointer;
}
```

### Color Schemes

#### Primary Variant (Purple/Violet)
```css
.glow-button-primary {
  --glow-color: rgb(217, 176, 255);
  --glow-spread-color: rgba(191, 123, 255, 0.781);
  --enhanced-glow-color: rgb(231, 206, 255);
  --btn-color: rgb(100, 61, 136);
}
```

#### Secondary Variant (Blue/Cyan)
```css
.glow-button-secondary {
  --glow-color: rgb(34, 211, 238);
  --glow-spread-color: rgba(6, 182, 212, 0.781);
  --enhanced-glow-color: rgb(103, 232, 249);
  --btn-color: rgb(8, 145, 178);
}
```

#### Danger Variant (Red/Pink)
```css
.glow-button-danger {
  --glow-color: rgb(251, 113, 133);
  --glow-spread-color: rgba(239, 68, 68, 0.781);
  --enhanced-glow-color: rgb(252, 165, 165);
  --btn-color: rgb(185, 28, 28);
}
```

#### Success Variant (Green)
```css
.glow-button-success {
  --glow-color: rgb(34, 197, 94);
  --glow-spread-color: rgba(22, 163, 74, 0.781);
  --enhanced-glow-color: rgb(74, 222, 128);
  --btn-color: rgb(21, 128, 61);
}
```

### Size Variants

#### Small Buttons
```css
.glow-button-small {
  padding: 0.5em 1em;
  font-size: 12px;
  border-width: 0.15em;
}
```

#### Large Buttons
```css
.glow-button-large {
  padding: 1.2em 3.5em;
  font-size: 18px;
  border-width: 0.3em;
}
```

### State Variations

#### Hover State
```css
.glow-button:hover {
  color: var(--btn-color);
  background-color: var(--glow-color);
  box-shadow: 
    0 0 1em 0.25em var(--glow-color),
    0 0 4em 2em var(--glow-spread-color),
    inset 0 0 0.75em 0.25em var(--glow-color);
}
```

#### Active State
```css
.glow-button:active {
  box-shadow: 
    0 0 0.6em 0.25em var(--glow-color),
    0 0 2.5em 2em var(--glow-spread-color),
    inset 0 0 0.5em 0.25em var(--glow-color);
}
```

#### Disabled State
```css
.glow-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  text-shadow: none;
}
```

## Data Models

### Button Configuration Interface
```typescript
interface GlowButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}
```

### Theme Integration
```typescript
interface ThemeColors {
  light: {
    primary: ButtonColorScheme;
    secondary: ButtonColorScheme;
    danger: ButtonColorScheme;
    success: ButtonColorScheme;
  };
  dark: {
    primary: ButtonColorScheme;
    secondary: ButtonColorScheme;
    danger: ButtonColorScheme;
    success: ButtonColorScheme;
  };
}

interface ButtonColorScheme {
  glowColor: string;
  glowSpreadColor: string;
  enhancedGlowColor: string;
  btnColor: string;
}
```

## Error Handling

### Fallback Styles
If CSS custom properties are not supported, the system falls back to standard Tailwind classes with similar visual appearance.

### Loading States
Buttons show loading spinners while maintaining the glow effect, with reduced opacity during loading states.

### Accessibility
- Focus indicators maintain glow effect with enhanced visibility
- Color contrast ratios meet WCAG AA standards
- Screen reader compatibility maintained
- Keyboard navigation support preserved

## Testing Strategy

### Visual Regression Testing
- Screenshot comparisons for all button variants
- Theme switching validation
- Responsive design testing across breakpoints

### Interaction Testing
- Hover state transitions
- Click feedback animations
- Loading state behavior
- Disabled state appearance

### Accessibility Testing
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- Focus indicator visibility

### Cross-browser Testing
- CSS custom property support
- Animation performance
- Glow effect rendering consistency

## Implementation Approach

### Phase 1: Core Button Component
Create the base GlowButton component with all variants and states.

### Phase 2: CSS Integration
Add the CSS styles to the global stylesheet with theme integration.

### Phase 3: Component Migration
Systematically replace existing buttons throughout the application:
1. App.tsx buttons (sidebar toggle, refresh)
2. Sidebar.tsx buttons (directory selection, file operations)
3. Panel buttons (export, reset, save, delete)
4. Search and navigation buttons

### Phase 4: Testing and Refinement
Comprehensive testing and visual adjustments based on real usage.

## Performance Considerations

### CSS Optimization
- Use CSS custom properties for efficient theme switching
- Minimize box-shadow complexity for better performance
- Optimize animation timing for smooth transitions

### Bundle Size
- Minimal CSS footprint through efficient selectors
- No additional JavaScript dependencies
- Reuse existing Tailwind utilities where possible