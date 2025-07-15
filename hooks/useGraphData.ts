
import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { GraphData, NodeData, LinkData, NodeType } from '../types';

async function processDirectory(handle: FileSystemDirectoryHandle): Promise<GraphData> {
  const nodes: NodeData[] = [];
  const links: LinkData[] = [];
  const filesToProcess: { file: File, path: string }[] = [];
  const allFilePaths = new Set<string>();

  const rootNode: NodeData = { id: '/', name: handle.name, type: NodeType.FOLDER, path: '/', size: 0 };
  nodes.push(rootNode);

  async function traverse(dirHandle: FileSystemDirectoryHandle, path: string, parentId: string) {
    for await (const entry of dirHandle.values()) {
      const newPath = `${path}${entry.name}`;
      if (entry.kind === 'directory') {
        const dirNode: NodeData = { id: newPath, name: entry.name, type: NodeType.FOLDER, path: newPath, size: 0 };
        nodes.push(dirNode);
        links.push({ source: parentId, target: dirNode.id, type: 'parent-child' });
        await traverse(entry, `${newPath}/`, dirNode.id);
      } else if (entry.kind === 'file') { // Process all files
        const file = await entry.getFile();
        const fileNode: NodeData = {
          id: newPath,
          name: entry.name,
          type: NodeType.FILE,
          path: newPath,
          size: file.size,
          // content is now loaded on demand
        };
        nodes.push(fileNode);
        links.push({ source: parentId, target: fileNode.id, type: 'parent-child' });
        
        if (entry.name.endsWith('.md')) {
            filesToProcess.push({ file, path: newPath });
            allFilePaths.add(entry.name.replace('.md', ''));
            allFilePaths.add(newPath);
        }
      }
    }
  }

  await traverse(handle, '/', rootNode.id);

  // Process markdown files for wikilinks only, not full content
  for (const { file, path } of filesToProcess) {
    const content = await file.text();
    const node = nodes.find(n => n.id === path);
    if (node) {
      // We only store content temporarily for link parsing, not in the final node data
      // This keeps the initial load light. Content is fetched on-demand later.
      const wikilinkRegex = /\[\[(.*?)\]\]/g;
      let match;
      while ((match = wikilinkRegex.exec(content)) !== null) {
        const linkName = match[1];
        const targetNode = nodes.find(n => n.id.endsWith(`${linkName}.md`) || n.name === `${linkName}.md`);
        if (targetNode) {
          links.push({ source: path, target: targetNode.id, type: 'wikilink' });
        }
      }
    }
  }

  // Calculate depth for each node based on path
  nodes.forEach(node => {
    if (node.path === '/') {
      node.depth = 0; // Root folder
    } else {
      // Count the number of '/' characters to determine depth
      const pathParts = node.path.split('/').filter(part => part !== '');
      node.depth = pathParts.length - 1; // Subtract 1 because root is depth 0
    }
  });

  // Calculate cumulative size for folders
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const childrenMap = new Map<string, string[]>();
  links.forEach(link => {
      if (link.type === 'parent-child') {
          const sourceId = typeof link.source === 'string' ? link.source : (link.source as NodeData).id;
          const targetId = typeof link.target === 'string' ? link.target : (link.target as NodeData).id;
          if (!childrenMap.has(sourceId)) {
              childrenMap.set(sourceId, []);
          }
          childrenMap.get(sourceId)!.push(targetId);
      }
  });

  const calculatedSizes = new Map<string, number>();

  function getNodeSize(nodeId: string): number {
      if (calculatedSizes.has(nodeId)) {
          return calculatedSizes.get(nodeId)!;
      }

      const node = nodeMap.get(nodeId);
      if (!node) return 0;

      if (node.type === NodeType.FILE) {
          const size = node.size || 0;
          calculatedSizes.set(nodeId, size);
          return size;
      }

      // It's a folder
      let totalSize = 0;
      const children = childrenMap.get(nodeId) || [];
      for (const childId of children) {
          totalSize += getNodeSize(childId);
      }
      
      // Assign a small base size to empty folders so they are visible
      if (totalSize === 0) {
          totalSize = 100;
      }

      node.size = totalSize;
      calculatedSizes.set(nodeId, totalSize);
      return totalSize;
  }
  
  getNodeSize('/');


  return { nodes, links };
}


function generateMockData(): GraphData {
  const nodes: NodeData[] = [
    { id: '/', name: 'Mock Project (Dev)', type: NodeType.FOLDER, path: '/', size: 0 },
    { id: '/README.md', name: 'README.md', type: NodeType.FILE, path: '/README.md', size: 1200, content: '# Project Mock\nThis project visualizes file structures. See [[src/App.tsx]] for the main component. It uses hooks from [[src/hooks/useGraphData.ts]].' },
    { id: '/package.json', name: 'package.json', type: NodeType.FILE, path: '/package.json', size: 800, content: '{ "name": "foam-clone", "version": "0.17.0" }' },
    
    // src directory
    { id: '/src', name: 'src', type: NodeType.FOLDER, path: '/src' },
    { id: '/src/App.tsx', name: 'App.tsx', type: NodeType.FILE, path: '/src/App.tsx', size: 7500, content: 'import {Graph} from "./components/Graph.tsx";\n\n// Main app component' },
    { id: '/src/styles.css', name: 'styles.css', type: NodeType.FILE, path: '/src/styles.css', size: 150, content: 'body { margin: 0; }' },
    
    // src/components directory
    { id: '/src/components', name: 'components', type: NodeType.FOLDER, path: '/src/components' },
    { id: '/src/components/Graph.tsx', name: 'Graph.tsx', type: NodeType.FILE, path: '/src/components/Graph.tsx', size: 9000, content: '// D3 graph component. Uses [[d3]] library.' },
    { id: '/src/components/Sidebar.tsx', name: 'Sidebar.tsx', type: NodeType.FILE, path: '/src/components/Sidebar.tsx', size: 11000, content: '// Sidebar component. See also [[src/App.tsx]]' },

    // src/hooks directory
    { id: '/src/hooks', name: 'hooks', type: NodeType.FOLDER, path: '/src/hooks' },
    { id: '/src/hooks/useGraphData.ts', name: 'useGraphData.ts', type: NodeType.FILE, path: '/src/hooks/useGraphData.ts', size: 3200, content: '// Custom hook for fetching graph data.' },

    // assets directory
    { id: '/assets', name: 'assets', type: NodeType.FOLDER, path: '/assets' },
    { id: '/assets/logo.svg', name: 'logo.svg', type: NodeType.FILE, path: '/assets/logo.svg', size: 2100 },
    { id: '/assets/icon.png', name: 'icon.png', type: NodeType.FILE, path: '/assets/icon.png', size: 5400 },

    // A note to link to D3
    { id: '/d3.md', name: 'd3.md', type: NodeType.FILE, path: '/d3.md', size: 50, content: 'This is a note about D3.'}
  ];

  // Calculate depth for each node based on path
  nodes.forEach(node => {
    if (node.path === '/') {
      node.depth = 0; // Root folder
    } else {
      // Count the number of '/' characters to determine depth
      const pathParts = node.path.split('/').filter(part => part !== '');
      node.depth = pathParts.length - 1; // Subtract 1 because root is depth 0
    }
  });

  const links: LinkData[] = [
    // Parent-child links
    { source: '/', target: '/README.md', type: 'parent-child' },
    { source: '/', target: '/package.json', type: 'parent-child' },
    { source: '/', target: '/d3.md', type: 'parent-child' },
    { source: '/', target: '/src', type: 'parent-child' },
    { source: '/', target: '/assets', type: 'parent-child' },
    { source: '/src', target: '/src/App.tsx', type: 'parent-child' },
    { source: '/src', target: '/src/styles.css', type: 'parent-child' },
    { source: '/src', target: '/src/components', type: 'parent-child' },
    { source: '/src', target: '/src/hooks', type: 'parent-child' },
    { source: '/src/components', target: '/src/components/Graph.tsx', type: 'parent-child' },
    { source: '/src/components', target: '/src/components/Sidebar.tsx', type: 'parent-child' },
    { source: '/src/hooks', target: '/src/hooks/useGraphData.ts', type: 'parent-child' },
    { source: '/assets', target: '/assets/logo.svg', type: 'parent-child' },
    { source: '/assets', target: '/assets/icon.png', type: 'parent-child' },

    // Wikilinks
    { source: '/README.md', target: '/src/App.tsx', type: 'wikilink' },
    { source: '/README.md', target: '/src/hooks/useGraphData.ts', type: 'wikilink' },
    { source: '/src/App.tsx', target: '/src/components/Graph.tsx', type: 'wikilink' },
    { source: '/src/components/Sidebar.tsx', target: '/src/App.tsx', type: 'wikilink' },
    { source: '/src/components/Graph.tsx', target: '/d3.md', type: 'wikilink' },
  ];
  
  return { nodes, links };
}

export const useGraphData = (
  directoryHandle: FileSystemDirectoryHandle | null,
  setDirectoryHandle: Dispatch<SetStateAction<FileSystemDirectoryHandle | null>>
) => {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(res => setTimeout(res, 50)); // Prevent flicker on fast loads
      let graphData;
      if (directoryHandle) {
        // Verify permissions before processing
        const perm = await directoryHandle.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          throw new Error("Read/Write permission for the directory is not granted.");
        }
        graphData = await processDirectory(directoryHandle);
      } else {
        graphData = generateMockData();
      }
      setData(graphData);
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to load graph data: ${message}`);
      setDirectoryHandle(null); // Reset handle on error
    } finally {
      setLoading(false);
    }
  }, [directoryHandle, setDirectoryHandle]);

  const getFileContent = useCallback(async (node: NodeData): Promise<string> => {
    if (!directoryHandle || node.type !== NodeType.FILE) {
        return '';
    }
    try {
        const pathParts = node.path.split('/').filter(p => p && p !== '.');
        const fileName = pathParts.pop();
        if (!fileName) return '';

        let currentHandle: FileSystemDirectoryHandle = directoryHandle;
        for (const part of pathParts) {
            currentHandle = await currentHandle.getDirectoryHandle(part);
        }
        
        const fileHandle = await currentHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        return await file.text();
    } catch (e) {
        console.error(`Failed to read content for ${node.path}`, e);
        setError(`Failed to read content for ${node.name}. Please refresh.`);
        return '';
    }
  }, [directoryHandle, setError]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refreshData: fetchData, getFileContent };
};
