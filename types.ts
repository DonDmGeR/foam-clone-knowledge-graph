// Add types for File System Access API to avoid TypeScript errors
declare global {
  interface Window {
    showDirectoryPicker(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>;
  }

  interface DirectoryPickerOptions {
    id?: string;
    mode?: 'read' | 'readwrite';
    startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | FileSystemHandle;
  }
  
  // This is a writable stream, part of the API.
  interface FileSystemWritableFileStream extends WritableStream {
    write(data: any): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
  }

  interface FileSystemHandle {
    readonly kind: 'file' | 'directory';
    readonly name: string;
    isSameEntry(other: FileSystemHandle): Promise<boolean>;
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: 'file';
    getFile(): Promise<File>;
    createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: 'directory';
    keys(): AsyncIterable<string>;
    values(): AsyncIterable<FileSystemFileHandle | FileSystemDirectoryHandle>;
    entries(): AsyncIterable<[string, FileSystemFileHandle | FileSystemDirectoryHandle]>;
    getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions): Promise<FileSystemDirectoryHandle>;
    getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>;
    removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void>;
    resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
  }
  
  interface FileSystemHandlePermissionDescriptor {
    mode?: 'read' | 'readwrite';
  }

  interface FileSystemCreateWritableOptions {
    keepExistingData?: boolean;
  }

  interface FileSystemGetDirectoryOptions {
    create?: boolean;
  }

  interface FileSystemGetFileOptions {
    create?: boolean;
  }

  interface FileSystemRemoveOptions {
    recursive?: boolean;
  }
}

export enum NodeType {
  FILE = 'FILE',
  FOLDER = 'FOLDER',
}

export interface NodeData {
  id: string;
  name: string;
  type: NodeType;
  path: string;
  content?: string;
  size?: number;
  degree?: number; // Number of connections
  depth?: number; // Nesting depth in folder hierarchy
  
  // D3 simulation properties
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface LinkData {
  source: string | NodeData; // id of source node or node object
  target: string | NodeData; // id of target node or node object
  type: 'wikilink' | 'parent-child';
}

export interface GraphData {
  nodes: NodeData[];
  links: LinkData[];
}

export interface SimulationParams {
  chargeStrength: number;
  linkDistance: number;
  centerForce: number;
  parentChildLinkStrength: number;
  wikilinkStrength: number;
  collideStrength: number;
}

export type NodeScaleMode = 'size' | 'connections';

export interface VisibilityOptions {
  showNodes: boolean;
  showLabels: boolean;
  showDirectoryLinks: boolean;
  showWikilinks: boolean;
  showBacklinks: boolean;
  nodeScaleMode: NodeScaleMode;
  labelSize: number;
}
