


import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { NodeData, SimulationParams, GraphData, VisibilityOptions, NodeType, LinkData } from './types';
import Graph from './components/Graph';
import Sidebar from './components/Sidebar';
import { useGraphData } from './hooks/useGraphData';
import { useDebounce } from './hooks/useDebounce';
import usePersistentState from './hooks/usePersistentState';


const INITIAL_SIMULATION_PARAMS: SimulationParams = {
  chargeStrength: -200,
  linkDistance: 60,
  centerForce: 0.1,
  parentChildLinkStrength: 0.8,
  wikilinkStrength: 0.1,
  collideStrength: 0.5,
};

const INITIAL_VISIBILITY_OPTIONS: VisibilityOptions = {
  showNodes: true,
  showLabels: true,
  showDirectoryLinks: true,
  showWikilinks: true,
  showBacklinks: true,
  nodeScaleMode: 'size',
  labelSize: 10,
};

export default function App() {
  const [directoryHandle, setDirectoryHandle] = usePersistentState<FileSystemDirectoryHandle | null>('directoryHandle', null);
  const { data, loading, error, refreshData, getFileContent } = useGraphData(directoryHandle, setDirectoryHandle);
  
  const [simulationParams, setSimulationParams] = usePersistentState<SimulationParams>('simulationParams', INITIAL_SIMULATION_PARAMS);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [visibilityOptions, setVisibilityOptions] = usePersistentState<VisibilityOptions>('visibilityOptions', INITIAL_VISIBILITY_OPTIONS);
  const [graphKey, setGraphKey] = useState(Date.now());
  const svgRef = useRef<SVGSVGElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);


  const [theme, setTheme] = usePersistentState<'light' | 'dark'>('theme', (() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  })());

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, [setTheme]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);


  const handleRefresh = useCallback(() => {
    if (directoryHandle) {
        refreshData();
        setSelectedNode(null);
        setSearchTerm('');
        setGraphKey(Date.now());
    }
  }, [refreshData, directoryHandle]);

  const handleResetSimulation = useCallback(() => {
    setSimulationParams(INITIAL_SIMULATION_PARAMS);
  }, [setSimulationParams]);
  
  const handleSelectDirectory = async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      // Verify permissions immediately
      const perm = await handle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted') {
          const newPerm = await handle.requestPermission({ mode: 'readwrite' });
          if (newPerm !== 'granted') {
              alert("Permission to read and write to this directory was denied.");
              return;
          }
      }

      setDirectoryHandle(handle);
      setSelectedNode(null);
      setSearchTerm('');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.info('Directory picker aborted by user.');
      } else {
        console.error('Error selecting directory:', err);
        setLastError('Could not select directory. Please ensure your browser supports the File System Access API.');
      }
    }
  };

  const getHandleForPath = async (path: string): Promise<[FileSystemDirectoryHandle, string] | [null, null]> => {
      if (!directoryHandle) return [null, null];
      const pathParts = path.split('/').filter(p => p && p !== '.');
      const fileName = pathParts.pop();
      if (!fileName) return [null, null];

      let currentHandle = directoryHandle;
      for (const part of pathParts) {
          currentHandle = await currentHandle.getDirectoryHandle(part, { create: false });
      }
      return [currentHandle, fileName];
  };
  
  const handleSaveFile = async (node: NodeData, content: string): Promise<boolean> => {
      const [dirHandle, fileName] = await getHandleForPath(node.path);
      if (!dirHandle || !fileName) {
          setLastError(`Could not find directory for: ${node.path}`);
          return false;
      }
      setIsSaving(true);
      setLastError(null);
      try {
          const fileHandle = await dirHandle.getFileHandle(fileName, { create: false });
          const writable = await fileHandle.createWritable();
          await writable.write(content);
          await writable.close();
          // Optimistically update node content to avoid full refresh lag
          if(selectedNode) {
              setSelectedNode({...selectedNode, content});
          }
          await refreshData(); // Refresh to catch new wikilinks
          return true;
      } catch (e: any) {
          console.error("Save error:", e);
          setLastError(`Error saving file: ${e.message}`);
          return false;
      } finally {
          setIsSaving(false);
      }
  };

  const handleDeleteFile = async (node: NodeData): Promise<boolean> => {
      const confirmation = window.confirm(`Are you sure you want to delete "${node.name}"? This cannot be undone.`);
      if (!confirmation) return false;

      const [dirHandle, fileName] = await getHandleForPath(node.path);
      if (!dirHandle || !fileName) {
          setLastError(`Could not find directory for: ${node.path}`);
          return false;
      }
      
      setIsSaving(true);
      setLastError(null);
      try {
          await dirHandle.removeEntry(fileName);
          setSelectedNode(null); // Deselect node
          await refreshData();
          return true;
      } catch (e: any) {
          console.error("Delete error:", e);
          setLastError(`Error deleting file: ${e.message}`);
          return false;
      } finally {
          setIsSaving(false);
      }
  };

  const handleRenameFile = async (node: NodeData, newName: string): Promise<boolean> => {
    if (!directoryHandle || node.type !== NodeType.FILE) return false;
    if (!newName || newName === node.name) return false;

    const oldNameParts = node.name.split('.');
    const oldExt = oldNameParts.length > 1 ? oldNameParts.pop() : null;
    if (oldExt && !newName.endsWith(`.${oldExt}`)) {
      newName += `.${oldExt}`;
    }

    setIsSaving(true);
    setLastError(null);

    const [dirHandle, oldFileName] = await getHandleForPath(node.path);
    if (!dirHandle || !oldFileName) {
      setLastError(`Could not find directory for: ${node.path}`);
      setIsSaving(false);
      return false;
    }
    
    let newFileHandle;
    try {
      try {
        await dirHandle.getFileHandle(newName, { create: false });
        setLastError(`A file named "${newName}" already exists.`);
        setIsSaving(false);
        return false;
      } catch (e) {
        // Expected: file does not exist.
      }
      
      const oldFileHandle = await dirHandle.getFileHandle(oldFileName, { create: false });
      const content = await (await oldFileHandle.getFile()).text();
      
      newFileHandle = await dirHandle.getFileHandle(newName, { create: true });
      const writable = await newFileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      await dirHandle.removeEntry(oldFileName);

      setSelectedNode(null);
      await refreshData();
      return true;
    } catch (e: any) {
      console.error("Rename error:", e);
      setLastError(`Error renaming file: ${e.message}`);
      if (newFileHandle) {
        try { await dirHandle.removeEntry(newName); }
        catch (cleanupError) { console.error("Cleanup failed:", cleanupError); }
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFile = async (parentId: string | null) => {
    let fileName = window.prompt("Enter new note name:", "Untitled.md");
    if (!fileName) return;
    if (!fileName.endsWith('.md')) fileName += '.md';
    
    if (!directoryHandle) {
        setLastError('Please select a directory first.');
        return;
    }
    
    setIsSaving(true);
    setLastError(null);
    try {
        let targetDirHandle = directoryHandle;
        if (parentId && parentId !== '/') {
            const pathParts = parentId.split('/').filter(p => p);
            for (const part of pathParts) {
                targetDirHandle = await targetDirHandle.getDirectoryHandle(part, { create: false });
            }
        }
        
        const newFileHandle = await targetDirHandle.getFileHandle(fileName, { create: true });
        const writable = await newFileHandle.createWritable();
        await writable.write(''); // Create an empty file
        await writable.close();
        
        await refreshData();
        
        const newPath = (parentId === '/' ? '' : parentId) + '/' + fileName;
        // Find and select the new node after data has refreshed
        setTimeout(() => {
          const newNode = data?.nodes.find(n => n.id === newPath);
          if (newNode) {
              setSelectedNode(newNode);
              focusNode(newNode);
          }
        }, 100);
        
    } catch (e: any) {
        console.error("Create error:", e);
        setLastError(`Error creating file: ${e.message}`);
    } finally {
        setIsSaving(false);
    }
  };


  useEffect(() => {
    // When the data source changes (e.g., new directory), reset the graph view
    setGraphKey(Date.now());
  }, [data]);

  const extendedData = useMemo(() => {
    if (!data) return null;

    const linkCounts = new Map<string, number>();
    data.links.forEach((link: LinkData) => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as NodeData).id;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as NodeData).id;
        linkCounts.set(sourceId, (linkCounts.get(sourceId) || 0) + 1);
        linkCounts.set(targetId, (linkCounts.get(targetId) || 0) + 1);
    });

    const nodesWithDegree = data.nodes.map(node => ({
        ...node,
        degree: linkCounts.get(node.id) || 0,
    }));

    return { ...data, nodes: nodesWithDegree };
  }, [data]);

  const filteredNodes = useMemo(() => {
    if (!extendedData) return [];
    if (!debouncedSearchTerm) return [];
    
    const lowercasedTerm = debouncedSearchTerm.toLowerCase();
    return extendedData.nodes.filter(node => 
      node.name.toLowerCase().includes(lowercasedTerm) ||
      (node.content && node.content.toLowerCase().includes(lowercasedTerm))
    );
  }, [extendedData, debouncedSearchTerm]);

  const fileColorScale = useMemo(() => {
    if (!data) return null;
    const extensions = new Set<string>();
    data.nodes.forEach(node => {
      if (node.type === NodeType.FILE) {
        const parts = node.name.split('.');
        const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : 'other';
        extensions.add(ext);
      }
    });
    // Use a more harmonious color scheme
    return d3.scaleOrdinal(d3.schemeTableau10).domain(Array.from(extensions).sort());
  }, [data]);

  const handleNodeClick = useCallback(async (node: NodeData | null) => {
    if (node && node.type === NodeType.FILE && !node.content) {
       const content = await getFileContent(node);
       const fullNode = { ...node, content };
       setSelectedNode(fullNode);
    } else {
       setSelectedNode(node);
    }
    // If a node is selected (not clearing selection by clicking background), show the sidebar.
    if (node) {
      setIsSidebarVisible(true);
    }
  }, [getFileContent]);
  
  const focusNode = useCallback((node: NodeData) => {
    setSelectedNode(node);
    if (window.innerWidth < 1024) { // lg breakpoint, close sidebar on mobile after selection
        setIsSidebarVisible(false);
    }
  }, []);

  const getSVGSource = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return null;

    // Create a clone to avoid modifying the original element
    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
    // Set explicit size for export
    svgClone.setAttribute('width', String(svgElement.clientWidth));
    svgClone.setAttribute('height', String(svgElement.clientHeight));


    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgClone);

    // Add necessary namespaces for external viewers
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    return source;
  }

  const handleExportSVG = useCallback(() => {
    const source = getSVGSource();
    if(!source) return;

    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "knowledge_graph.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleExportPNG = useCallback(() => {
    const source = getSVGSource();
    const svgElement = svgRef.current;
    if(!source || !svgElement) return;

    const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const pixelRatio = window.devicePixelRatio || 1;
      const canvasWidth = svgElement.clientWidth * pixelRatio;
      const canvasHeight = svgElement.clientHeight * pixelRatio;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.scale(pixelRatio, pixelRatio);
        // Draw background color
        ctx.fillStyle = theme === 'light' ? '#f8fafc' : '#020617'; // bg-gray-50, bg-slate-950
        ctx.fillRect(0, 0, svgElement.clientWidth, svgElement.clientHeight);
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'knowledge_graph.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    };
    img.src = svgUrl;

  }, [theme]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-cyan-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Generating Knowledge Graph...</h1>
          <p className="text-slate-500 dark:text-slate-400">{directoryHandle ? `Processing directory: ${directoryHandle.name}` : 'Loading mock data for development.'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100 p-4">
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Error Loading Graph Data</h2>
            <p className="font-mono bg-red-200/50 dark:bg-red-800/50 p-2 rounded">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen w-screen flex bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* Overlay for mobile sidebar, hidden in fullscreen */}
      {isSidebarVisible && !isEditorFullscreen && (
        <div
          onClick={() => setIsSidebarVisible(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          aria-label="Close sidebar"
        ></div>
      )}
      <Sidebar
        isVisible={isSidebarVisible}
        data={extendedData as GraphData}
        selectedNode={selectedNode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredNodes={filteredNodes}
        focusNode={focusNode}
        simulationParams={simulationParams}
        setSimulationParams={setSimulationParams}
        onResetSimulation={handleResetSimulation}
        onRefresh={handleRefresh}
        isLoading={loading || isSaving}
        onSelectDirectory={handleSelectDirectory}
        directoryName={directoryHandle?.name || null}
        visibilityOptions={visibilityOptions}
        setVisibilityOptions={setVisibilityOptions}
        theme={theme}
        onToggleTheme={toggleTheme}
        fileColorScale={fileColorScale}
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
        onSaveFile={handleSaveFile}
        onDeleteFile={handleDeleteFile}
        onRenameFile={handleRenameFile}
        onCreateFile={handleCreateFile}
        isEditorFullscreen={isEditorFullscreen}
        setEditorFullscreen={setIsEditorFullscreen}
      />
      <main className={`flex-1 flex flex-col relative transition-all duration-300 ${isEditorFullscreen ? 'hidden lg:hidden' : 'flex'}`}>
        <button 
          onClick={() => setIsSidebarVisible(!isSidebarVisible)}
          className="absolute top-4 left-4 z-40 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700/80 backdrop-blur-sm text-slate-800 dark:text-slate-200 p-2 rounded-md transition-all"
          title={isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
        >
          {isSidebarVisible ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
          )}
        </button>
        {lastError && (
          <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md z-50 shadow-lg flex items-center" role="alert">
            <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 8a2 2 0 114 0 2 2 0 01-4 0zm2 4a1 1 0 01-1-1v-2a1 1 0 112 0v2a1 1 0 01-1 1z"/></svg>
            <span className="block sm:inline">{lastError}</span>
            <button onClick={() => setLastError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </button>
          </div>
        )}
        {extendedData && extendedData.nodes.length > 0 && (
           <Graph 
              key={graphKey}
              ref={svgRef}
              data={extendedData} 
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNode?.id || null}
              focusedNodeId={selectedNode?.id || null}
              simulationParams={simulationParams}
              visibilityOptions={visibilityOptions}
              theme={theme}
              fileColorScale={fileColorScale}
           />
        )}
        {data && data.nodes.length === 0 && !loading && (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-slate-500 dark:text-slate-400">
                    <h2 className="text-2xl text-slate-800 dark:text-slate-200 font-semibold">Empty Graph</h2>
                    <p>{directoryHandle ? 'The selected directory contains no files.' : 'No mock data could be loaded.'}</p>
                </div>
            </div>
        )}
      </main>

      <button
        onClick={handleRefresh}
        disabled={loading || isSaving}
        className="fixed bottom-6 right-6 z-40 bg-cyan-600 hover:bg-cyan-500 text-white font-bold p-3 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
        title="Refresh Graph"
      >
        {loading || isSaving ? (
          <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0l4.992-4.992m-4.993 0l-3.181 3.183a8.25 8.25 0 000 11.664l3.181 3.183" />
          </svg>
        )}
      </button>
    </div>
  );
}