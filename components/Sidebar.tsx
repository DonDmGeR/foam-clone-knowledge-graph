





import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { NodeData, GraphData, NodeType, SimulationParams, VisibilityOptions, NodeScaleMode } from '../types';
import usePersistentState from '../hooks/usePersistentState';
import AdvancedMarkdownEditor from './AdvancedMarkdownEditor';
import GlowButton from './GlowButton';


interface SidebarProps {
  isVisible: boolean;
  data: GraphData;
  selectedNode: NodeData | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredNodes: NodeData[];
  focusNode: (node: NodeData) => void;
  simulationParams: SimulationParams;
  setSimulationParams: (params: SimulationParams) => void;
  onResetSimulation: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  onSelectDirectory: () => Promise<void>;
  directoryName: string | null;
  visibilityOptions: VisibilityOptions;
  setVisibilityOptions: (opts: VisibilityOptions) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  fileColorScale: d3.ScaleOrdinal<string, string> | null;
  onExportSVG: () => void;
  onExportPNG: () => void;
  onSaveFile: (node: NodeData, content: string) => Promise<boolean>;
  onRenameFile: (node: NodeData, newName: string) => Promise<boolean>;
  onDeleteFile: (node: NodeData) => Promise<boolean>;
  onCreateFile: (parentId: string | null) => Promise<void>;
  isEditorFullscreen: boolean;
  setEditorFullscreen: (isFull: boolean) => void;
}

const SidebarPanel: React.FC<{
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, children, isOpen, onToggle, actions, className = '' }) => {
  const panelId = `panel-content-${title.replace(/\s+/g, '-')}`;
  return (
    <div className={`bg-gray-100/80 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/10 ${className}`}>
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center p-3 text-left"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <h3 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        <div className="flex items-center gap-2">
            {actions}
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-500 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </div>
      </button>
      {isOpen && (
        <div id={panelId} className="px-3 pb-3">
          <div className="border-t border-slate-300 dark:border-slate-700 pt-3">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};


const DataSourcePanel: React.FC<{ 
    onSelect: () => Promise<void>;
    dirName: string | null;
    onCreateFile: () => void;
    isLoading: boolean;
}> = ({ onSelect, dirName, onCreateFile, isLoading }) => (
  <div className="text-sm space-y-3 p-1">
    <div>
      <p className="font-semibold text-slate-600 dark:text-slate-400 mb-1">Current Source</p>
      <p className="text-slate-900 dark:text-slate-100 font-mono text-xs bg-gray-200 dark:bg-slate-900 p-2 rounded-md break-all">
        {dirName ? `Local: ${dirName}` : 'Mock Data'}
      </p>
    </div>
    <div className="flex gap-2">
    <GlowButton
      variant="secondary"
      size="medium"
      onClick={onSelect}
      icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>}
      className="flex-1"
    >
      Select Directory
    </GlowButton>
    <GlowButton
      variant="success"
      size="medium"
      onClick={onCreateFile}
      disabled={isLoading || !dirName}
      icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
      </svg>}
      className="flex-1"
    >
      New Note
    </GlowButton>
    </div>
  </div>
);

const DisplayOptionsPanel: React.FC<{
  options: VisibilityOptions;
  setOptions: (opts: VisibilityOptions) => void;
  selectedNode: NodeData | null;
}> = ({ options, setOptions, selectedNode }) => {
  const Toggle = ({ label, isChecked, onChange, disabled = false }: {label: string, isChecked: boolean, onChange: () => void, disabled?: boolean}) => (
    <label className={`flex items-center justify-between text-slate-700 dark:text-slate-300 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <span>{label}</span>
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={isChecked} onChange={onChange} disabled={disabled} />
        <div className={`block w-10 h-6 rounded-full transition-colors ${isChecked ? 'bg-cyan-500' : 'bg-slate-600 dark:bg-slate-700'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isChecked ? 'translate-x-4' : ''}`}></div>
      </div>
    </label>
  );

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-3">
        <Toggle label="Show Nodes" isChecked={options.showNodes} onChange={() => setOptions({ ...options, showNodes: !options.showNodes })} />
        <Toggle label="Show Labels" isChecked={options.showLabels} onChange={() => setOptions({ ...options, showLabels: !options.showLabels })} />
        <Toggle label="Show Directory Links" isChecked={options.showDirectoryLinks} onChange={() => setOptions({ ...options, showDirectoryLinks: !options.showDirectoryLinks })} />
        <Toggle label="Show Wikilinks" isChecked={options.showWikilinks} onChange={() => setOptions({ ...options, showWikilinks: !options.showWikilinks })} />
        <Toggle label="Highlight Backlinks" isChecked={options.showBacklinks} onChange={() => setOptions({ ...options, showBacklinks: !options.showBacklinks })} disabled={!selectedNode} />
      </div>
      <div className="space-y-2">
        <label className="font-semibold text-slate-600 dark:text-slate-400">Node Scale Mode</label>
        <div className="flex gap-2 rounded-md bg-gray-200 dark:bg-slate-900 p-1">
          {(['size', 'connections'] as NodeScaleMode[]).map(mode => (
            <GlowButton
              key={mode}
              variant={options.nodeScaleMode === mode ? "primary" : "secondary"}
              size="small"
              onClick={() => setOptions({ ...options, nodeScaleMode: mode })}
              className="flex-1"
            >
              {mode}
            </GlowButton>
          ))}
        </div>
      </div>
       <div className="space-y-2">
        <label className="flex justify-between text-slate-600 dark:text-slate-300"><span>Label Size</span><span className="font-mono text-cyan-600 dark:text-cyan-300">{options.labelSize}px</span></label>
        <input type="range" min="6" max="20" step="1" value={options.labelSize} onChange={e => setOptions({...options, labelSize: +e.target.value})} className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
      </div>
    </div>
  );
};


const Legend: React.FC<{ fileColorScale: d3.ScaleOrdinal<string, string> | null }> = ({ fileColorScale }) => {
  const colorDomain = fileColorScale?.domain() ?? [];
  const colorRange = fileColorScale?.range() ?? [];
  
  return (
    <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-full bg-amber-500 mr-2 border border-slate-400 dark:border-slate-500 shrink-0"></div>
        <span>Folder Node</span>
      </div>
      {colorDomain.map((ext, i) => (
          <div className="flex items-center" key={ext}>
              <div 
                  className="w-4 h-4 rounded-full mr-2 border border-slate-400 dark:border-slate-500 shrink-0"
                  style={{ backgroundColor: colorRange[i] }}
              ></div>
              <span>{ext === 'other' ? 'File (Other)' : `*.${ext} File`}</span>
          </div>
      ))}
       <div className="flex items-center">
        <div className="w-5 h-1 bg-slate-300 dark:bg-slate-600 mr-2 shrink-0 rounded-full"></div>
        <span>Directory Link</span>
      </div>
      <div className="flex items-center">
        <div className="w-5 h-1 bg-sky-400 dark:bg-sky-500 mr-2 shrink-0 rounded-full"></div>
        <span>Wikilink</span>
      </div>
      <div className="flex items-center">
        <div className="w-5 h-1 bg-pink-500 dark:bg-pink-400 mr-2 shrink-0 rounded-full"></div>
        <span>Backlink (on select)</span>
      </div>
    </div>
  );
};


const StatsPanel: React.FC<{ data: GraphData }> = ({ data }) => {
  const stats = useMemo(() => {
    if (!data) return { nodes: 0, links: 0, files: 0, folders: 0, wikilinks: 0, totalSize: 0 };
    const files = data.nodes.filter(n => n.type === NodeType.FILE);
    return {
      nodes: data.nodes.length,
      links: data.links.length,
      files: files.length,
      folders: data.nodes.filter(n => n.type === NodeType.FOLDER).length,
      wikilinks: data.links.filter(l => l.type === 'wikilink').length,
      totalSize: files.reduce((acc, file) => acc + (file.size || 0), 0)
    };
  }, [data]);

  const StatCard: React.FC<{ value: string | number, label: string, icon?: React.ReactNode }> = ({ value, label, icon }) => (
    <div className="bg-gray-200 dark:bg-slate-900 p-2 rounded-lg flex items-center gap-3">
        {icon && <div className="text-cyan-500 dark:text-cyan-400">{icon}</div>}
        <div>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <StatCard value={stats.nodes} label="Nodes" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>} />
      <StatCard value={stats.links} label="Links" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>} />
      <StatCard value={stats.files} label="Files" />
      <StatCard value={stats.folders} label="Folders" />
      <StatCard value={stats.wikilinks} label="Wikilinks" />
      <StatCard value={`${(stats.totalSize / 1024).toFixed(1)} KB`} label="Total Size" />
    </div>
  );
};

interface EditorPanelProps {
  node: NodeData | null;
  allData: GraphData;
  focusNode: (node: NodeData) => void;
  onSave: (node: NodeData, content: string) => Promise<boolean>;
  onRenameFile: (node: NodeData, newName: string) => Promise<boolean>;
  onDelete: (node: NodeData) => Promise<boolean>;
  onCreateFile: (parentId: string | null) => Promise<void>;
  isLoading: boolean;
  dirName: string | null;
  isEditorFullscreen: boolean;
  setEditorFullscreen: (isFull: boolean) => void;
  theme: 'light' | 'dark';
}

const EditorPanel: React.FC<EditorPanelProps> = ({ 
    node, allData, focusNode, onSave, onRenameFile, onDelete, onCreateFile, 
    isLoading, dirName, isEditorFullscreen, setEditorFullscreen, theme 
}) => {
  const [editedContent, setEditedContent] = useState<string | undefined>(undefined);
  const [isDirty, setIsDirty] = useState(false);
  
  useEffect(() => {
    setEditedContent(node?.content);
    setIsDirty(false);
  }, [node]);

  const handleContentChange = (value: string) => {
    setEditedContent(value);
    if (!isDirty) setIsDirty(true);
  };

  const handleSave = async () => {
    if (node && editedContent !== undefined) {
      const success = await onSave(node, editedContent);
      if (success) {
        setIsDirty(false);
      }
    }
  };

  const handleDelete = async () => {
    if (node) {
      await onDelete(node);
    }
  };

  const handleRename = () => {
    if (!node) return;
    const newName = window.prompt("Enter new file name:", node.name);
    if (newName && newName.trim() && newName !== node.name) {
      onRenameFile(node, newName.trim());
    }
  };
  
  const handleCopyPath = () => {
      if (node?.path) {
          navigator.clipboard.writeText(node.path)
              .then(() => alert('Path copied to clipboard!'))
              .catch(err => console.error('Failed to copy path: ', err));
      }
  };

  const backlinks = useMemo(() => {
    if (!node || !allData?.links) return [];
    
    const backlinkLinks = allData.links.filter(link => {
      const targetId = typeof link.target === 'string' ? link.target : (link.target as NodeData).id;
      return targetId === node.id && link.source !== node.id;
    });

    const sourceNodeIds = new Set(backlinkLinks.map(link => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as NodeData).id;
        return sourceId;
    }));

    return allData.nodes.filter(n => sourceNodeIds.has(n.id));
  }, [node, allData]);

  if (!node) {
    return (
        <div className="text-center text-slate-500 dark:text-slate-400 p-8 flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="font-semibold">No Node Selected</p>
            <p className="text-sm">Double-click a node on the graph to see its details and edit its content here.</p>
        </div>
    );
  }

  const isEditable = node.type === NodeType.FILE;

  return (
    <div className={`text-sm space-y-4 ${isEditorFullscreen ? 'h-full flex flex-col' : ''}`}>
      <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-600 dark:text-slate-400">Name</p>
            <p className="text-slate-900 dark:text-slate-100 break-words font-bold text-base truncate">{node.name}</p>
          </div>
          <div className="flex items-center ml-2 flex-shrink-0">
            {isEditable && dirName && (
              <GlowButton
                variant="secondary"
                size="small"
                onClick={handleRename}
                disabled={isLoading}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
                </svg>}
              />
            )}
            {dirName && node.type === NodeType.FOLDER && (
              <GlowButton
                variant="success"
                size="small"
                onClick={() => onCreateFile(node.id)}
                className="ml-2"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
                </svg>}
              />
            )}
            {isEditable && dirName && (
              <GlowButton
                variant="secondary"
                size="small"
                onClick={() => setEditorFullscreen(!isEditorFullscreen)}
                className="ml-2"
                icon={isEditorFullscreen ?
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7" /></svg> :
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
                }
              />
            )}
          </div>
      </div>

      <div>
        <p className="font-semibold text-slate-600 dark:text-slate-400">Type</p>
        <p className={`capitalize px-2 py-0.5 inline-block rounded text-xs font-medium ${node.type === NodeType.FILE ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'}`}>{node.type.toLowerCase()}</p>
      </div>
       {typeof node.size === 'number' && (
         <div>
            <p className="font-semibold text-slate-600 dark:text-slate-400">Size</p>
            <p className="text-slate-500 dark:text-slate-300 font-mono text-xs">{(node.size / 1024).toFixed(2)} KB</p>
        </div>
      )}
      <div>
        <p className="font-semibold text-slate-600 dark:text-slate-400">Path</p>
        <div className="flex items-center gap-2">
            <p className="flex-1 text-slate-500 dark:text-slate-300 font-mono text-xs break-all bg-gray-200 dark:bg-slate-900 p-2 rounded-md">{node.path}</p>
            <GlowButton
              variant="secondary"
              size="small"
              onClick={handleCopyPath}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>}
            />
        </div>
      </div>
      
      {node.type === NodeType.FILE && (
        <div className={`space-y-2 pt-2 ${isEditorFullscreen ? 'flex-1 flex flex-col min-h-0' : ''}`}>
            <label htmlFor="content-editor" className="font-semibold text-slate-600 dark:text-slate-400">Content</label>
            {isEditable && !isLoading ? (
              <AdvancedMarkdownEditor
                value={editedContent ?? ''}
                onChange={handleContentChange}
                onSave={handleSave}
                isDirty={isDirty}
                isLoading={isLoading}
                allNodes={allData?.nodes ?? []}
                isFullscreen={isEditorFullscreen}
                theme={theme}
              />
            ) : (
              <textarea
                id="content-editor"
                value={editedContent ?? 'Loading content...'}
                onChange={() => {}} // Read-only fallback
                disabled={true}
                placeholder="Content preview is not available for this file type."
                className={`w-full p-3 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors font-mono disabled:opacity-70 ${isEditorFullscreen ? 'flex-1 resize-none text-base leading-relaxed' : 'h-60 text-xs'}`}
                aria-label="File content editor"
              />
            )}
        </div>
      )}

      {isEditable && dirName && (
        <div className={`flex items-center gap-2 pt-2 ${isEditorFullscreen ? 'flex-shrink-0' : ''}`}>
          <GlowButton
            variant="secondary"
            size="medium"
            onClick={handleSave}
            disabled={!isDirty || isLoading}
            loading={isLoading}
            className="flex-1"
          >
            {isDirty ? 'Save Changes' : 'Saved'}
          </GlowButton>
          <GlowButton
            variant="danger"
            size="medium"
            onClick={handleDelete}
            disabled={isLoading}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
          />
        </div>
      )}

      {backlinks.length > 0 && (
        <div className={`${isEditorFullscreen ? 'flex-shrink-0' : ''}`}>
          <p className="font-semibold text-slate-600 dark:text-slate-400">Linked From ({backlinks.length})</p>
          <div className="mt-1 space-y-1 max-h-32 overflow-y-auto pr-1">
            {backlinks.map(backlinkNode => (
              <GlowButton
                key={backlinkNode.id}
                variant="secondary"
                size="small"
                onClick={() => focusNode(backlinkNode)}
                fullWidth={true}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7" /></svg>}
                className="text-left justify-start"
              >
                <span className="truncate">{backlinkNode.name}</span>
              </GlowButton>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


interface ControlsPanelProps {
  params: SimulationParams;
  setParams: (p: SimulationParams) => void;
  onReset: () => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({ params, setParams, onReset }) => (
  <div className="space-y-4 text-sm">
    <div className="space-y-2">
      <label className="flex justify-between text-slate-600 dark:text-slate-300"><span>Charge Strength</span><span className="font-mono text-cyan-600 dark:text-cyan-300">{params.chargeStrength}</span></label>
      <input type="range" min="-1000" max="0" step="10" value={params.chargeStrength} onChange={e => setParams({...params, chargeStrength: +e.target.value})} className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
    </div>
    <div className="space-y-2">
      <label className="flex justify-between text-slate-600 dark:text-slate-300"><span>Link Distance</span><span className="font-mono text-cyan-600 dark:text-cyan-300">{params.linkDistance}</span></label>
      <input type="range" min="10" max="300" step="5" value={params.linkDistance} onChange={e => setParams({...params, linkDistance: +e.target.value})} className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
    </div>
     <div className="space-y-2">
      <label className="flex justify-between text-slate-600 dark:text-slate-300"><span>Parent-Child Strength</span><span className="font-mono text-cyan-600 dark:text-cyan-300">{params.parentChildLinkStrength.toFixed(2)}</span></label>
      <input type="range" min="0" max="2" step="0.1" value={params.parentChildLinkStrength} onChange={e => setParams({...params, parentChildLinkStrength: +e.target.value})} className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
    </div>
     <div className="space-y-2">
      <label className="flex justify-between text-slate-600 dark:text-slate-300"><span>Wikilink Strength</span><span className="font-mono text-cyan-600 dark:text-cyan-300">{params.wikilinkStrength.toFixed(2)}</span></label>
      <input type="range" min="0" max="1" step="0.05" value={params.wikilinkStrength} onChange={e => setParams({...params, wikilinkStrength: +e.target.value})} className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
    </div>
    <div className="space-y-2">
      <label className="flex justify-between text-slate-600 dark:text-slate-300"><span>Collision Strength</span><span className="font-mono text-cyan-600 dark:text-cyan-300">{params.collideStrength.toFixed(2)}</span></label>
      <input type="range" min="0" max="2" step="0.1" value={params.collideStrength} onChange={e => setParams({...params, collideStrength: +e.target.value})} className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
    </div>
    <div className="space-y-2">
      <label className="flex justify-between text-slate-600 dark:text-slate-300"><span>Center Force</span><span className="font-mono text-cyan-600 dark:text-cyan-300">{params.centerForce.toFixed(2)}</span></label>
      <input type="range" min="0" max="1" step="0.05" value={params.centerForce} onChange={e => setParams({...params, centerForce: +e.target.value})} className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
    </div>
    <div className="pt-2">
      <GlowButton
        variant="secondary"
        size="medium"
        onClick={onReset}
        fullWidth={true}
        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0l4.992-4.992m-4.993 0l-3.181 3.183a8.25 8.25 0 000 11.664l3.181 3.183" />
        </svg>}
      >
        Reset Simulation
      </GlowButton>
    </div>
  </div>
);

const ExportPanel: React.FC<{ onExportSVG: () => void, onExportPNG: () => void }> = ({ onExportSVG, onExportPNG }) => (
  <div className="space-y-3 text-sm">
    <p className="text-slate-600 dark:text-slate-400">Save a snapshot of the current graph view.</p>
    <div className="flex flex-col sm:flex-row gap-2">
      <GlowButton
        variant="primary"
        size="medium"
        onClick={onExportSVG}
        className="flex-1"
      >
        Export as SVG
      </GlowButton>
      <GlowButton
        variant="primary"
        size="medium"
        onClick={onExportPNG}
        className="flex-1"
      >
        Export as PNG
      </GlowButton>
    </div>
  </div>
);

const SearchPanel: React.FC<{ searchTerm: string, setSearchTerm: (t: string) => void, results: NodeData[], onResultClick: (n: NodeData) => void, getNodeColor: (n: NodeData) => string }> = ({ searchTerm, setSearchTerm, results, onResultClick, getNodeColor }) => (
  <div className="p-1">
    <div className="relative">
      <input 
        type="text" 
        placeholder="Search nodes by name or content..." 
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md py-2 px-3 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
      />
    </div>
    {searchTerm && (
      <div className="mt-3 max-h-48 overflow-y-auto text-sm pr-1">
        {results.length > 0 ? (
          results.map(node => (
            <GlowButton
              key={node.id}
              variant="secondary"
              size="small"
              onClick={() => onResultClick(node)}
              fullWidth={true}
              icon={<div
                className="w-3 h-3 rounded-full flex-shrink-0 border border-slate-400/50"
                style={{ backgroundColor: getNodeColor(node) }}
              ></div>}
              className="text-left justify-start"
            >
              <span className="truncate text-slate-800 dark:text-slate-200">{node.name}</span>
            </GlowButton>
          ))
        ) : (
          <p className="text-slate-500 dark:text-slate-400 p-2 text-center">No results found.</p>
        )}
      </div>
    )}
  </div>
);

const ThemeToggle: React.FC<{ theme: 'light' | 'dark', onToggle: () => void }> = ({ theme, onToggle }) => (
  <GlowButton
    variant="secondary"
    size="small"
    onClick={onToggle}
    icon={theme === 'light' ? 
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg> :
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
    }
  />
);


const Sidebar: React.FC<SidebarProps> = (props) => {
  const { 
      isVisible, data, selectedNode, searchTerm, setSearchTerm, filteredNodes, 
      focusNode, simulationParams, setSimulationParams, onResetSimulation, onRefresh, 
      isLoading, onSelectDirectory, directoryName, visibilityOptions, 
      setVisibilityOptions, theme, onToggleTheme, fileColorScale, 
      onExportSVG, onExportPNG, onSaveFile, onRenameFile, onDeleteFile, onCreateFile,
      isEditorFullscreen, setEditorFullscreen
  } = props;

  const [sidebarWidth, setSidebarWidth] = usePersistentState('sidebarWidth', 384);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = sidebarWidth;
    const startPosition = mouseDownEvent.pageX;

    function onMouseMove(mouseMoveEvent: MouseEvent) {
        const newWidth = startWidth + mouseMoveEvent.pageX - startPosition;
        if (newWidth >= 320 && newWidth <= 800) { // Min/Max width constraints
            setSidebarWidth(newWidth);
        }
    }
    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth, setSidebarWidth]);


  type TabName = 'Explore' | 'Inspect' | 'Settings';
  const TABS: TabName[] = ['Explore', 'Inspect', 'Settings'];
  const [activeTab, setActiveTab] = usePersistentState<TabName>('sidebarActiveTab', 'Explore');

  useEffect(() => {
    if (selectedNode) {
      setActiveTab('Inspect');
    }
  }, [selectedNode, setActiveTab]);
  

  const [openSettingsPanels, setOpenSettingsPanels] = usePersistentState('openSettingsPanels', {
    displayOptions: false,
    stats: true,
    simulation: false,
    export: false,
    legend: false,
  });

  const toggleSettingsPanel = (panelName: keyof typeof openSettingsPanels) => {
    setOpenSettingsPanels(prev => ({ ...prev, [panelName]: !prev[panelName] }));
  };

  const getNodeColor = useCallback((node: NodeData): string => {
      if (node.type === NodeType.FOLDER) return '#f59e0b'; // amber-500
      if (!fileColorScale) return '#22d3ee'; // cyan-400 (default)
      const parts = node.name.split('.');
      const ext = parts.length > 1 ? parts.pop()?.toLowerCase() ?? 'other' : 'other';
      return fileColorScale(ext);
  }, [fileColorScale]);
  
  const editorPanelContent = (
      <EditorPanel 
        node={selectedNode} 
        allData={data} 
        focusNode={focusNode} 
        onSave={onSaveFile}
        onRenameFile={onRenameFile}
        onDelete={onDeleteFile}
        onCreateFile={onCreateFile}
        isLoading={isLoading}
        dirName={directoryName}
        isEditorFullscreen={isEditorFullscreen}
        setEditorFullscreen={setEditorFullscreen}
        theme={theme}
      />
  );

  if (isEditorFullscreen) {
    return (
        <aside className="fixed inset-0 z-50 p-4 bg-gray-50 dark:bg-slate-950 flex flex-col">
          {editorPanelContent}
        </aside>
    );
  }

  const sidebarStyle: React.CSSProperties = isDesktop ? 
    (isVisible ? { width: `${sidebarWidth}px`, transition: 'width 150ms ease-out' } : { width: '0px', padding: 0, overflow: 'hidden', transition: 'width 150ms ease-out, padding 150ms ease-out' }) : 
    {};

  return (
    <>
    <aside 
      className={`
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-2xl 
        fixed inset-y-0 left-0 z-30 flex flex-col
        w-full sm:w-96
        transition-transform duration-300 ease-in-out
        ${isVisible ? 'translate-x-0' : '-translate-x-full'}

        lg:relative lg:flex-shrink-0 lg:shadow-lg
        lg:w-auto lg:p-0
        lg:translate-x-0 lg:transition-none
      `}
      style={sidebarStyle}
      >
        <div className="flex flex-col flex-grow min-h-0">
          <div className="p-4 flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Foam Clone</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Knowledge Graph Visualizer</p>
              </div>
              <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </div>

            <div className="border-b border-slate-300 dark:border-slate-700" role="tablist" aria-label="Sidebar Sections">
              <div className="flex -mb-px">
                {TABS.map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    disabled={tab === 'Inspect' && !selectedNode}
                    className={`
                      px-4 py-2 text-sm font-medium border-b-2
                      transition-colors duration-150
                      disabled:cursor-not-allowed disabled:text-slate-400 dark:disabled:text-slate-600
                      ${activeTab === tab 
                        ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' 
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200'}
                    `}
                    role="tab"
                    aria-selected={activeTab === tab}
                    aria-controls={`tab-panel-${tab}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto p-4">
              <div id="tab-panel-Explore" role="tabpanel" hidden={activeTab !== 'Explore'}>
                  <div className="space-y-4">
                      <DataSourcePanel onSelect={onSelectDirectory} dirName={directoryName} onCreateFile={() => onCreateFile('/')} isLoading={isLoading} />
                      <div className="border-t border-slate-300 dark:border-slate-700"></div>
                      <SearchPanel searchTerm={searchTerm} setSearchTerm={setSearchTerm} results={filteredNodes} onResultClick={focusNode} getNodeColor={getNodeColor} />
                  </div>
              </div>
              <div id="tab-panel-Inspect" role="tabpanel" className="h-full" hidden={activeTab !== 'Inspect'}>
                  {editorPanelContent}
              </div>
              <div id="tab-panel-Settings" role="tabpanel" hidden={activeTab !== 'Settings'}>
                <div className="space-y-3">
                    <SidebarPanel title="Display Options" isOpen={openSettingsPanels.displayOptions} onToggle={() => toggleSettingsPanel('displayOptions')}>
                        <DisplayOptionsPanel options={visibilityOptions} setOptions={setVisibilityOptions} selectedNode={selectedNode} />
                    </SidebarPanel>
                    <SidebarPanel title="Graph Stats" isOpen={openSettingsPanels.stats} onToggle={() => toggleSettingsPanel('stats')}>
                        <StatsPanel data={data} />
                    </SidebarPanel>
                    <SidebarPanel title="Simulation Controls" isOpen={openSettingsPanels.simulation} onToggle={() => toggleSettingsPanel('simulation')}>
                        <ControlsPanel params={simulationParams} setParams={setSimulationParams} onReset={onResetSimulation} />
                    </SidebarPanel>
                    <SidebarPanel title="Export" isOpen={openSettingsPanels.export} onToggle={() => toggleSettingsPanel('export')}>
                        <ExportPanel onExportSVG={onExportSVG} onExportPNG={onExportPNG} />
                    </SidebarPanel>
                    <SidebarPanel title="Legend" isOpen={openSettingsPanels.legend} onToggle={() => toggleSettingsPanel('legend')}>
                        <Legend fileColorScale={fileColorScale} />
                    </SidebarPanel>
                </div>
              </div>
          </div>
        </div>
    </aside>
    {isDesktop && isVisible && (
        <div 
            onMouseDown={startResizing}
            className="w-1.5 h-full flex-shrink-0 cursor-col-resize bg-slate-300/50 dark:bg-slate-700/50 hover:bg-cyan-400/80 dark:hover:bg-cyan-500/80 transition-colors duration-200"
            title="Resize Sidebar"
        />
    )}
    </>
  );
};

export default Sidebar;