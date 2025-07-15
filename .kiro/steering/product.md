# Product Overview

## Foam Clone - Knowledge Graph Visualizer

A React-based web application that visualizes markdown notes and files as an interactive knowledge graph. The app allows users to explore relationships between files through wikilinks and folder structures using a force-directed graph visualization.

### Core Purpose
- Visualize local file systems as interactive knowledge graphs
- Navigate and explore relationships between markdown notes via wikilinks (`[[note name]]`)
- Provide direct file management capabilities (CRUD operations)
- Support both files and folders as graph nodes with parent-child relationships

### Key Features
- **Interactive Graph**: D3.js-powered force-directed visualization
- **File System Integration**: Uses File System Access API for local directory access
- **Wikilink Support**: Automatically detects and visualizes `[[wikilinks]]` in markdown files
- **Direct File Management**: Create, edit, delete, and rename files within the app
- **Search & Navigation**: Real-time search with graph focusing
- **Customizable Visualization**: Adjustable simulation parameters and visibility options
- **Export Capabilities**: SVG and PNG export of graph visualizations
- **Theme Support**: Light/dark mode with persistent preferences

### Target Users
- Knowledge workers and researchers managing interconnected notes
- Content creators organizing markdown-based documentation
- Developers exploring project file relationships
- Anyone working with local markdown note collections

### Technical Approach
Client-side only application using modern web APIs for local file system access, with no server dependencies or cloud storage requirements.