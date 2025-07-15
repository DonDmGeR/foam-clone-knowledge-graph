import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { NodeData } from '../types';

export interface AdvancedMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  isDirty: boolean;
  isLoading: boolean;
  allNodes: NodeData[];
  isFullscreen: boolean;
  theme: 'light' | 'dark';
}

interface SyntaxRule {
  pattern: RegExp;
  className: string;
  priority: number;
}

interface HighlightedSegment {
  text: string;
  className?: string;
}

const AdvancedMarkdownEditor: React.FC<AdvancedMarkdownEditorProps> = ({
  value,
  onChange,
  onSave,
  isDirty,
  isLoading,
  allNodes,
  isFullscreen,
  theme
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  // Syntax highlighting rules
  const syntaxRules: SyntaxRule[] = useMemo(() => [
    // Headers (highest priority)
    { pattern: /^#{1,6}\s+.*/gm, className: 'md-header', priority: 10 },
    // Bold text
    { pattern: /\*\*([^*]+)\*\*/g, className: 'md-bold', priority: 8 },
    { pattern: /__([^_]+)__/g, className: 'md-bold', priority: 8 },
    // Italic text
    { pattern: /\*([^*]+)\*/g, className: 'md-italic', priority: 7 },
    { pattern: /_([^_]+)_/g, className: 'md-italic', priority: 7 },
    // Inline code
    { pattern: /`([^`]+)`/g, className: 'md-code', priority: 9 },
    // Code blocks
    { pattern: /```[\s\S]*?```/g, className: 'md-code-block', priority: 9 },
    // Wikilinks
    { pattern: /\[\[([^\]]+)\]\]/g, className: 'md-wikilink', priority: 6 },
    // Regular links
    { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, className: 'md-link', priority: 6 },
    // Lists
    { pattern: /^[\s]*[-*+]\s+.*/gm, className: 'md-list', priority: 5 },
    { pattern: /^[\s]*\d+\.\s+.*/gm, className: 'md-list', priority: 5 },
    // Blockquotes
    { pattern: /^>\s+.*/gm, className: 'md-blockquote', priority: 4 },
    // Horizontal rules
    { pattern: /^---+$/gm, className: 'md-hr', priority: 3 },
  ], []);

  // Apply syntax highlighting
  const highlightedContent = useMemo(() => {
    if (!value) return [];

    const segments: HighlightedSegment[] = [];
    const matches: Array<{ start: number; end: number; className: string; priority: number }> = [];

    // Find all matches
    syntaxRules.forEach(rule => {
      let match;
      while ((match = rule.pattern.exec(value)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          className: rule.className,
          priority: rule.priority
        });
      }
    });

    // Sort by position and priority
    matches.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return b.priority - a.priority;
    });

    // Remove overlapping matches (keep higher priority)
    const filteredMatches = [];
    for (const match of matches) {
      const hasOverlap = filteredMatches.some(existing => 
        (match.start < existing.end && match.end > existing.start)
      );
      if (!hasOverlap) {
        filteredMatches.push(match);
      }
    }

    // Create segments
    let lastIndex = 0;
    filteredMatches.forEach(match => {
      // Add text before match
      if (match.start > lastIndex) {
        segments.push({ text: value.slice(lastIndex, match.start) });
      }
      // Add highlighted match
      segments.push({ 
        text: value.slice(match.start, match.end), 
        className: match.className 
      });
      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < value.length) {
      segments.push({ text: value.slice(lastIndex) });
    }

    return segments;
  }, [value, syntaxRules]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end);

    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      const newText = selectedText ? `**${selectedText}**` : '****';
      const newValue = value.slice(0, start) + newText + value.slice(end);
      onChange(newValue);
      
      // Set cursor position
      setTimeout(() => {
        if (selectedText) {
          textarea.setSelectionRange(start + 2, start + 2 + selectedText.length);
        } else {
          textarea.setSelectionRange(start + 2, start + 2);
        }
      }, 0);
    }

    // Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      const newText = selectedText ? `*${selectedText}*` : '**';
      const newValue = value.slice(0, start) + newText + value.slice(end);
      onChange(newValue);
      
      setTimeout(() => {
        if (selectedText) {
          textarea.setSelectionRange(start + 1, start + 1 + selectedText.length);
        } else {
          textarea.setSelectionRange(start + 1, start + 1);
        }
      }, 0);
    }

    // Ctrl/Cmd + Shift + C for inline code
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      const newText = selectedText ? `\`${selectedText}\`` : '``';
      const newValue = value.slice(0, start) + newText + value.slice(end);
      onChange(newValue);
      
      setTimeout(() => {
        if (selectedText) {
          textarea.setSelectionRange(start + 1, start + 1 + selectedText.length);
        } else {
          textarea.setSelectionRange(start + 1, start + 1);
        }
      }, 0);
    }

    // Ctrl/Cmd + S for save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    }

    // Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const lines = value.split('\n');
      const currentLineIndex = value.slice(0, start).split('\n').length - 1;
      
      if (e.shiftKey) {
        // Unindent
        if (lines[currentLineIndex].startsWith('  ')) {
          lines[currentLineIndex] = lines[currentLineIndex].slice(2);
          const newValue = lines.join('\n');
          onChange(newValue);
          setTimeout(() => textarea.setSelectionRange(start - 2, end - 2), 0);
        }
      } else {
        // Indent
        lines[currentLineIndex] = '  ' + lines[currentLineIndex];
        const newValue = lines.join('\n');
        onChange(newValue);
        setTimeout(() => textarea.setSelectionRange(start + 2, end + 2), 0);
      }
    }
  }, [value, onChange, onSave]);

  // Handle text changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  }, [onChange]);

  // Handle selection changes
  const handleSelectionChange = useCallback(() => {
    if (textareaRef.current) {
      setSelectionStart(textareaRef.current.selectionStart);
      setSelectionEnd(textareaRef.current.selectionEnd);
      setCursorPosition(textareaRef.current.selectionStart);
    }
  }, []);

  // Sync scroll between textarea and highlight layer
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Update cursor position on click
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('selectionchange', handleSelectionChange);
      return () => textarea.removeEventListener('selectionchange', handleSelectionChange);
    }
  }, [handleSelectionChange]);

  return (
    <div className={`relative ${isFullscreen ? 'h-full flex flex-col' : ''}`}>
      {/* Syntax highlighting layer */}
      <div
        ref={highlightRef}
        className={`absolute inset-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words font-mono text-transparent ${
          isFullscreen ? 'text-base leading-relaxed' : 'text-xs'
        } p-3 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800`}
        style={{
          zIndex: 1,
          fontSize: 'inherit',
          lineHeight: 'inherit',
          fontFamily: 'inherit',
        }}
        onScroll={handleScroll}
      >
        {highlightedContent.map((segment, index) => (
          <span
            key={index}
            className={segment.className || ''}
          >
            {segment.text}
          </span>
        ))}
      </div>

      {/* Text input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        onSelect={handleSelectionChange}
        disabled={isLoading}
        placeholder="Start writing your markdown content..."
        className={`relative w-full p-3 border border-slate-300 dark:border-slate-700 rounded-md bg-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors font-mono disabled:opacity-70 resize-none ${
          isFullscreen ? 'flex-1 text-base leading-relaxed' : 'h-60 text-xs'
        }`}
        style={{
          zIndex: 2,
          color: 'transparent',
          caretColor: theme === 'dark' ? '#e2e8f0' : '#1e293b',
        }}
        aria-label="Advanced markdown editor"
      />

      {/* Cursor indicator for better visibility */}
      <style jsx>{`
        .md-header { color: #2563eb; font-weight: bold; }
        .md-bold { color: #dc2626; font-weight: bold; }
        .md-italic { color: #7c3aed; font-style: italic; }
        .md-code { color: #059669; background-color: rgba(6, 182, 212, 0.1); padding: 0.125rem 0.25rem; border-radius: 0.25rem; }
        .md-code-block { color: #059669; background-color: rgba(6, 182, 212, 0.1); padding: 0.5rem; border-radius: 0.25rem; display: block; }
        .md-wikilink { color: #0891b2; font-weight: 500; }
        .md-link { color: #0891b2; }
        .md-list { color: #ea580c; }
        .md-blockquote { color: #6b7280; font-style: italic; border-left: 3px solid #d1d5db; padding-left: 0.5rem; }
        .md-hr { color: #9ca3af; }

        /* Dark theme styles */
        .dark .md-header { color: #60a5fa; }
        .dark .md-bold { color: #f87171; }
        .dark .md-italic { color: #a78bfa; }
        .dark .md-code { color: #34d399; background-color: rgba(6, 182, 212, 0.2); }
        .dark .md-code-block { color: #34d399; background-color: rgba(6, 182, 212, 0.2); }
        .dark .md-wikilink { color: #22d3ee; }
        .dark .md-link { color: #22d3ee; }
        .dark .md-list { color: #fb923c; }
        .dark .md-blockquote { color: #9ca3af; border-left-color: #4b5563; }
        .dark .md-hr { color: #6b7280; }
      `}</style>
    </div>
  );
};

export default AdvancedMarkdownEditor;