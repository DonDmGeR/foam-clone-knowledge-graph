# Design Document

## Overview

The Advanced Editor Features will enhance the existing markdown editor in the Foam Clone application with modern editing capabilities. The current editor is a basic textarea within the EditorPanel component in the Sidebar. This design will transform it into a sophisticated markdown editor with syntax highlighting, live preview, intelligent auto-completion, and enhanced user experience features.

The implementation will leverage existing React patterns and integrate seamlessly with the current file system operations and graph visualization workflow.

## Architecture

### Component Structure

The enhanced editor will follow a modular architecture:

```
EditorPanel (existing)
├── AdvancedMarkdownEditor (new)
│   ├── EditorToolbar (new)
│   ├── SyntaxHighlightedTextarea (new)
│   ├── AutoCompleteProvider (new)
│   ├── WikilinkSuggestions (new)
│   └── SearchReplaceDialog (new)
├── LivePreviewPanel (new)
└── EditorStatusBar (new)
```

### Key Architectural Decisions

1. **Incremental Enhancement**: Build upon the existing textarea-based editor rather than replacing it entirely
2. **Component Composition**: Use smaller, focused components for each feature
3. **Hook-based Logic**: Extract editor logic into custom hooks for reusability
4. **Performance Optimization**: Use debouncing and memoization for expensive operations
5. **Accessibility**: Maintain keyboard navigation and screen reader compatibility

## Components and Interfaces

### AdvancedMarkdownEditor Component

```typescript
interface AdvancedMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  isDirty: boolean;
  isLoading: boolean;
  allNodes: NodeData[];
  isFullscreen: boolean;
  theme: 'light' | 'dark';
}
```

**Responsibilities:**
- Coordinate between syntax highlighting, auto-completion, and live preview
- Handle keyboard shortcuts for formatting
- Manage editor state and cursor position
- Provide context for auto-completion suggestions

### SyntaxHighlightedTextarea Component

```typescript
interface SyntaxHighlightedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  theme: 'light' | 'dark';
  className?: string;
}
```

**Responsibilities:**
- Apply real-time syntax highlighting using CSS and regex patterns
- Handle text input and maintain cursor position
- Support undo/redo functionality
- Provide smooth scrolling synchronization with preview

### AutoCompleteProvider Component

```typescript
interface AutoCompleteProviderProps {
  children: React.ReactNode;
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  trigger: string; // e.g., "[[" for wikilinks
  isVisible: boolean;
  position: { x: number; y: number };
}
```

**Responsibilities:**
- Display contextual suggestions based on cursor position
- Handle keyboard navigation within suggestions
- Filter suggestions based on typed text
- Position dropdown relative to cursor

### LivePreviewPanel Component

```typescript
interface LivePreviewPanelProps {
  markdown: string;
  isVisible: boolean;
  onToggle: () => void;
  scrollSync: boolean;
  onElementClick: (lineNumber: number) => void;
}
```

**Responsibilities:**
- Render markdown to HTML using a markdown parser
- Synchronize scroll position with editor
- Handle click-to-edit functionality
- Support wikilink navigation

## Data Models

### Editor State

```typescript
interface EditorState {
  content: string;
  cursorPosition: number;
  selectionStart: number;
  selectionEnd: number;
  scrollTop: number;
  isDirty: boolean;
  lastSaved: Date | null;
}
```

### Auto-completion Context

```typescript
interface AutoCompleteContext {
  trigger: string;
  query: string;
  position: number;
  suggestions: Suggestion[];
  selectedIndex: number;
}

interface Suggestion {
  text: string;
  type: 'file' | 'folder' | 'snippet';
  description?: string;
  insertText: string;
}
```

### Syntax Highlighting Rules

```typescript
interface SyntaxRule {
  pattern: RegExp;
  className: string;
  priority: number;
}

interface HighlightTheme {
  light: Record<string, string>;
  dark: Record<string, string>;
}
```

## Error Handling

### Input Validation
- Sanitize user input to prevent XSS in preview
- Validate file references in wikilinks
- Handle malformed markdown gracefully

### Performance Safeguards
- Debounce syntax highlighting for large documents
- Limit auto-completion suggestions to prevent UI lag
- Implement virtual scrolling for very long documents

### Error Recovery
- Preserve content in localStorage on unexpected errors
- Provide fallback to basic textarea if advanced features fail
- Show user-friendly error messages for file system operations

## Testing Strategy

### Unit Tests
- Test individual components in isolation
- Mock file system operations and node data
- Verify keyboard shortcut handling
- Test auto-completion logic and filtering

### Integration Tests
- Test editor integration with existing EditorPanel
- Verify live preview synchronization
- Test file save/load operations with enhanced editor
- Validate theme switching and responsive behavior

### Performance Tests
- Measure rendering performance with large documents
- Test memory usage with multiple files open
- Benchmark syntax highlighting performance
- Validate smooth scrolling and typing experience

### Accessibility Tests
- Verify keyboard navigation works correctly
- Test screen reader compatibility
- Ensure proper ARIA labels and roles
- Validate color contrast in both themes

## Implementation Phases

### Phase 1: Core Infrastructure
1. Create AdvancedMarkdownEditor component shell
2. Implement basic syntax highlighting
3. Add keyboard shortcut handling
4. Integrate with existing EditorPanel

### Phase 2: Auto-completion System
1. Build AutoCompleteProvider component
2. Implement file name suggestions
3. Add wikilink auto-completion
4. Create suggestion filtering logic

### Phase 3: Live Preview
1. Integrate markdown parser (marked.js or similar)
2. Build LivePreviewPanel component
3. Implement scroll synchronization
4. Add click-to-edit functionality

### Phase 4: Advanced Features
1. Add search and replace dialog
2. Implement smart indentation
3. Add code block syntax highlighting
4. Create editor toolbar with formatting buttons

### Phase 5: Polish and Optimization
1. Performance optimization and testing
2. Accessibility improvements
3. Error handling and edge cases
4. Documentation and user guides

## Technical Dependencies

### New Dependencies
- **marked** or **markdown-it**: Markdown parsing for live preview
- **prismjs** or **highlight.js**: Code block syntax highlighting
- **fuse.js**: Fuzzy search for auto-completion (optional)

### CSS Requirements
- Syntax highlighting theme definitions
- Editor layout and positioning styles
- Animation and transition effects
- Responsive design considerations

### Browser Compatibility
- Maintain existing File System Access API requirements
- Ensure compatibility with Chrome/Edge/Opera
- Use modern JavaScript features (ES2020+)
- Implement progressive enhancement for older browsers