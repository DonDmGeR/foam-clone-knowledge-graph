import React, { useEffect, useRef, useMemo, forwardRef, useCallback } from 'react';
import * as d3 from 'd3';
import { GraphData, NodeData, NodeType, SimulationParams, LinkData, VisibilityOptions } from '../types';

interface GraphProps {
  data: GraphData;
  onNodeClick: (node: NodeData | null) => void;
  selectedNodeId: string | null;
  focusedNodeId: string | null;
  simulationParams: SimulationParams;
  visibilityOptions: VisibilityOptions;
  theme: 'light' | 'dark';
  fileColorScale: d3.ScaleOrdinal<string, string> | null;
}

const COLORS = {
  light: {
    bg: 'bg-gray-50',
    link: '#cbd5e1', // slate-300
    wikilink: '#38bdf8', // sky-400
    backlink: '#ec4899', // pink-500
    folder: '#f59e0b', // amber-500
    nodeStroke: '#64748b', // slate-500
    text: '#1e293b', // slate-800
    selectedStroke: '#22d3ee', // cyan-400
    selectedShadow: 'rgba(34, 211, 238, 0.6)'
  },
  dark: {
    bg: 'bg-slate-950',
    link: '#475569', // slate-600
    wikilink: '#0ea5e9', // sky-500
    backlink: '#f472b6', // pink-400
    folder: '#f59e0b', // amber-500
    nodeStroke: '#94a3b8', // slate-400
    text: '#cbd5e1', // slate-300
    selectedStroke: '#67e8f9', // cyan-300
    selectedShadow: '#67e8f9'
  }
};


const Graph = forwardRef<SVGSVGElement, GraphProps>(({ data, onNodeClick, selectedNodeId, focusedNodeId, simulationParams, visibilityOptions, theme, fileColorScale }, ref) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<NodeData, LinkData> | null>(null);
  const C = COLORS[theme];

  const { nodes, links } = useMemo(() => {
    const nodesCopy = data.nodes.map(n => ({ ...n }));
    const linksCopy = data.links.map(l => ({ ...l }));
    return { nodes: nodesCopy as NodeData[], links: linksCopy as LinkData[] };
  }, [data]);

  const visibleLinks = useMemo(() => {
    return links.filter(link => {
      if (link.type === 'wikilink' && !visibilityOptions.showWikilinks) return false;
      if (link.type === 'parent-child' && !visibilityOptions.showDirectoryLinks) return false;
      return true;
    });
  }, [links, visibilityOptions.showDirectoryLinks, visibilityOptions.showWikilinks]);

  const sizeDomain = useMemo(() => {
    const sizes = nodes.map(n => n.size || 0).filter(s => s > 0);
    if (sizes.length === 0) return [0, 1];
    return [d3.min(sizes) || 0, d3.max(sizes) || 1];
  }, [nodes]);

  const degreeDomain = useMemo(() => {
    const degrees = nodes.map(n => n.degree || 0);
    if (degrees.length === 0) return [0, 1];
    return [d3.min(degrees) || 0, d3.max(degrees) || 1];
  }, [nodes]);

  const radiusScaleBySize = useMemo(() => d3.scaleSqrt().domain(sizeDomain).range([4, 30]), [sizeDomain]);
  const radiusScaleByDegree = useMemo(() => d3.scaleSqrt().domain(degreeDomain).range([4, 25]), [degreeDomain]);

  // Calculate relative depth based on selected node
  const getRelativeDepth = useCallback((node: NodeData, selectedNode: NodeData | null) => {
    if (!selectedNode) {
      // No selection: use absolute depth from root
      return node.depth || 0;
    }

    // Calculate relative depth from selected node
    const selectedDepth = selectedNode.depth || 0;
    const nodeDepth = node.depth || 0;

    // If the node is "above" the selected node in hierarchy, treat as depth 0
    if (nodeDepth < selectedDepth) {
      return Math.max(0, selectedDepth - nodeDepth);
    }

    // Calculate relative depth from selected node
    return Math.max(0, nodeDepth - selectedDepth);
  }, []);

  const getNodeRadius = useCallback((d: NodeData) => {
    let baseRadius;
    if (visibilityOptions.nodeScaleMode === 'connections') {
      baseRadius = radiusScaleByDegree(d.degree || 0);
    } else {
      baseRadius = radiusScaleBySize(d.size || 1);
    }

    // Apply depth-based scaling using relative depth
    const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;
    const relativeDepth = getRelativeDepth(d, selectedNode);
    const depthScale = Math.max(0.6, 1 - (relativeDepth * 0.15)); // Minimum 60% size, reduce by 15% per level
    return baseRadius * depthScale;
  }, [visibilityOptions.nodeScaleMode, radiusScaleByDegree, radiusScaleBySize, nodes, selectedNodeId, getRelativeDepth]);

  useEffect(() => {
    const svgRefCurrent = (ref as React.RefObject<SVGSVGElement>).current;
    if (!svgRefCurrent) return;

    const svg = d3.select(svgRefCurrent);
    const parent = svg.node()?.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = parent.clientHeight;
    svg.attr('width', width).attr('height', height);

    const g = svg.select<SVGGElement>('g.graph-content');
    const linkGroup = g.select<SVGGElement>('.links');
    const nodeGroup = g.select<SVGGElement>('.nodes');

    // Create the simulation if it doesn't exist
    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation();
      const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.5);
      svg.call(d3.zoom<SVGSVGElement, unknown>().transform, initialTransform);
    }

    const simulation = simulationRef.current;

    const linkKeyFn = (d: LinkData) => {
      const sourceId = typeof d.source === 'string' ? d.source : (d.source as NodeData).id;
      const targetId = typeof d.target === 'string' ? d.target : (d.target as NodeData).id;
      return `${sourceId}-${targetId}-${d.type}`;
    };

    // Update simulation forces
    simulation
      .nodes(nodes)
      .force('link', d3.forceLink<NodeData, LinkData>(visibleLinks)
        .id((d: any) => d.id)
        .distance(d => {
          // Shorter distances for parent-child relationships, even shorter for deeper nesting
          if (d.type === 'parent-child') {
            const targetNode = nodes.find(n => n.id === (typeof d.target === 'string' ? d.target : (d.target as NodeData).id));
            const depth = targetNode?.depth || 0;
            return Math.max(20, simulationParams.linkDistance / 2 - (depth * 5)); // Closer for deeper nesting
          }
          return simulationParams.linkDistance;
        })
        .strength(d => {
          // Stronger attraction for parent-child relationships, especially for deeper nodes
          if (d.type === 'parent-child') {
            const targetNode = nodes.find(n => n.id === (typeof d.target === 'string' ? d.target : (d.target as NodeData).id));
            const depth = targetNode?.depth || 0;
            return Math.min(1.5, simulationParams.parentChildLinkStrength + (depth * 0.1)); // Stronger for deeper nesting
          }
          return simulationParams.wikilinkStrength;
        }))
      .force('charge', d3.forceManyBody().strength(d => {
        // Weaker repulsion for deeper nodes to keep them closer to their parents
        const depth = d.depth || 0;
        return simulationParams.chargeStrength * Math.max(0.3, 1 - (depth * 0.2));
      }))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(simulationParams.centerForce))
      .force('collide', d3.forceCollide<NodeData>().radius(d => getNodeRadius(d) + 5).strength(simulationParams.collideStrength));


    // -- RENDER LINKS --
    const linkSelection = linkGroup
      .selectAll<SVGLineElement, LinkData>('line')
      .data(visibleLinks, linkKeyFn)
      .join(
        enter => enter.append('line')
          .style('opacity', 0),
        update => update,
        exit => exit.transition().duration(200).style('opacity', 0).remove()
      )
      .attr('marker-end', d => {
        const targetId = typeof d.target === 'string' ? d.target : (d.target as NodeData).id;
        if (visibilityOptions.showBacklinks && selectedNodeId && targetId === selectedNodeId && d.type === 'wikilink') {
          return 'url(#backlink-arrow)';
        }
        return d.type === 'wikilink' ? 'url(#wikilink-arrow)' : null;
      });

    linkSelection.transition().duration(300)
      .style('opacity', d => {
        const sourceId = typeof d.source === 'string' ? d.source : (d.source as NodeData).id;
        const targetId = typeof d.target === 'string' ? d.target : (d.target as NodeData).id;
        if (selectedNodeId && (sourceId === selectedNodeId || targetId === selectedNodeId)) return 1;
        return d.type === 'parent-child' ? 0.3 : 0.5;
      })
      .attr('stroke', d => {
        const targetId = typeof d.target === 'string' ? d.target : (d.target as NodeData).id;
        if (visibilityOptions.showBacklinks && selectedNodeId && targetId === selectedNodeId) return C.backlink;
        return d.type === 'wikilink' ? C.wikilink : C.link;
      })
      .attr('stroke-width', d => {
        const sourceId = typeof d.source === 'string' ? d.source : (d.source as NodeData).id;
        const targetId = typeof d.target === 'string' ? d.target : (d.target as NodeData).id;
        if (selectedNodeId && (sourceId === selectedNodeId || targetId === selectedNodeId)) return 2.5;
        return d.type === 'parent-child' ? 1.5 : 1;
      });


    // -- RENDER NODES --
    const nodeSelection = nodeGroup
      .selectAll<SVGGElement, NodeData>('g.node-group')
      .data(nodes, (d: NodeData) => d.id)
      .join(
        enter => {
          const g = enter.append('g').attr('class', 'node-group cursor-pointer').style('opacity', 0);
          g.append('circle');
          g.append('text');
          g.call(d3.drag<SVGGElement, NodeData>()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
          g.on('dblclick', (event, d) => {
            onNodeClick(d);
            event.stopPropagation();
          });
          g.call(s => s.transition().duration(300).style('opacity', 1));
          return g;
        },
        update => update,
        exit => exit.transition().duration(300).style('opacity', 0).remove()
      );

    // Helper function to get depth-based opacity using relative depth
    const getDepthOpacity = (node: NodeData) => {
      const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;
      const relativeDepth = getRelativeDepth(node, selectedNode);
      return Math.max(0.4, 1 - (relativeDepth * 0.15)); // Minimum 40% opacity, reduce by 15% per level
    };

    // Helper function to get depth-based color variation using relative depth
    const getDepthColor = (baseColor: string, node: NodeData) => {
      const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;
      const relativeDepth = getRelativeDepth(node, selectedNode);

      if (relativeDepth === 0) return baseColor;

      // Convert hex to HSL, adjust lightness based on relative depth
      const color = d3.color(baseColor);
      if (!color) return baseColor;

      const hsl = d3.hsl(color);
      // Make deeper folders slightly darker/more muted
      hsl.l = Math.max(0.2, hsl.l - (relativeDepth * 0.1));
      hsl.s = Math.max(0.3, hsl.s - (relativeDepth * 0.1));
      return hsl.toString();
    };

    // Update node circles
    nodeSelection.select<SVGCircleElement>('circle')
      .attr('stroke', d => d.id === selectedNodeId ? C.selectedStroke : C.nodeStroke)
      .attr('stroke-width', d => d.id === selectedNodeId ? 3.5 : 1.5)
      .style('filter', d => d.id === selectedNodeId ? `drop-shadow(0 0 8px ${C.selectedShadow})` : 'none')
      .attr('fill', d => {
        let baseColor;
        if (d.type === NodeType.FOLDER) {
          baseColor = C.folder;
        } else {
          if (!fileColorScale) baseColor = '#ccc';
          else {
            const parts = d.name.split('.');
            const ext = parts.length > 1 ? parts.pop()?.toLowerCase() ?? 'other' : 'other';
            baseColor = fileColorScale(ext);
          }
        }
        // Apply depth-based color variation
        return getDepthColor(baseColor, d);
      })
      .style('opacity', d => {
        // Apply depth-based opacity, but keep selected nodes fully visible
        return d.id === selectedNodeId ? 1 : getDepthOpacity(d);
      })
      .transition().duration(300)
      .attr('r', d => getNodeRadius(d) * (d.id === selectedNodeId ? 1.25 : 1));

    // Update node labels
    nodeSelection.select<SVGTextElement>('text')
      .text(d => d.name.replace(/\.md$/, ''))
      .attr('y', 4)
      .attr('fill', C.text)
      .style('pointer-events', 'none')
      .style('text-shadow', theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.8)' : '0 1px 2px rgba(255,255,255,0.5)')
      .transition().duration(300)
      .attr('x', d => getNodeRadius(d) * (d.id === selectedNodeId ? 1.25 : 1) + 5)
      .style('font-size', d => {
        const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;
        const relativeDepth = getRelativeDepth(d, selectedNode);
        return `${Math.max(8, visibilityOptions.labelSize - relativeDepth * 1)}px`; // Smaller labels for deeper nodes
      })
      .style('opacity', d => {
        if (!visibilityOptions.showLabels) return 0;
        const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;
        const relativeDepth = getRelativeDepth(d, selectedNode);
        // Labels become more transparent for deeper nodes, but remain visible
        return Math.max(0.6, 1 - (relativeDepth * 0.1));
      });

    // Overall node group visibility
    nodeSelection.style('visibility', visibilityOptions.showNodes ? 'visible' : 'hidden');


    const tooltip = d3.select(tooltipRef.current);
    nodeSelection.on('mouseover', function (event, d) {
      if (d.id === selectedNodeId) return;
      d3.select(this).select('circle').transition().duration(200).attr('r', getNodeRadius(d) * 1.25);
      const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;
      const relativeDepth = getRelativeDepth(d, selectedNode);
      const absoluteDepth = d.depth || 0;

      let depthInfo = '';
      if (selectedNode) {
        depthInfo = `<div class="text-xs opacity-70">Relative Depth: ${relativeDepth} (Absolute: ${absoluteDepth})</div>`;
      } else {
        depthInfo = `<div class="text-xs opacity-70">Depth: ${absoluteDepth}</div>`;
      }

      tooltip.style('opacity', 1)
        .html(`<div class="font-bold">${d.name}</div><div class="capitalize text-xs opacity-80">${d.type.toLowerCase()}</div>${depthInfo}`);
    })
      .on('mousemove', function (event) {
        const containerRect = (ref as React.RefObject<SVGSVGElement>).current?.getBoundingClientRect();
        if (containerRect) {
          const x = event.clientX - containerRect.left + 15;
          const y = event.clientY - containerRect.top + 10;
          tooltip.style('left', `${x}px`).style('top', `${y}px`);
        }
      })
      .on('mouseout', function (event, d) {
        if (d.id === selectedNodeId) return;
        d3.select(this).select('circle').transition().duration(200).attr('r', getNodeRadius(d));
        tooltip.style('opacity', 0);
      });

    simulation.on('tick', () => {
      linkSelection
        .attr('x1', d => (d.source as NodeData).x ?? 0)
        .attr('y1', d => (d.source as NodeData).y ?? 0)
        .attr('x2', d => {
          const targetNode = d.target as NodeData;
          const sourceNode = d.source as NodeData;
          if (!targetNode.x || !sourceNode.x) return 0; // Guard against undefined positions
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return targetNode.x;
          const radius = getNodeRadius(targetNode) * (targetNode.id === selectedNodeId ? 1.25 : 1);
          return targetNode.x - dx / dist * (radius + 8); // +8 for marker
        })
        .attr('y2', d => {
          const targetNode = d.target as NodeData;
          const sourceNode = d.source as NodeData;
          if (!targetNode.y || !sourceNode.y) return 0; // Guard against undefined positions
          const dx = (targetNode.x ?? 0) - (sourceNode.x ?? 0);
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return targetNode.y;
          const radius = getNodeRadius(targetNode) * (targetNode.id === selectedNodeId ? 1.25 : 1);
          return targetNode.y - dy / dist * (radius + 8); // +8 for marker
        });

      nodeSelection.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    function dragstarted(event: d3.D3DragEvent<SVGGElement, NodeData, any>, d: NodeData) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      tooltip.style('opacity', 0);
    }
    function dragged(event: d3.D3DragEvent<SVGGElement, NodeData, any>, d: NodeData) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event: d3.D3DragEvent<SVGGElement, NodeData, any>, d: NodeData) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);

    svg.on('click', (event) => {
      if (event.target === svg.node()) {
        onNodeClick(null);
      }
    });

    // Add arrow markers
    svg.select('defs').remove(); // Clear existing defs
    const defs = svg.append('defs');
    defs.selectAll('marker')
      .data(['wikilink-arrow', 'backlink-arrow'])
      .join('marker')
      .attr('id', String)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', d => d === 'wikilink-arrow' ? C.wikilink : C.backlink);


    if (simulation.alpha() < 0.1) {
      simulation.alpha(1).restart();
    }

    return () => {
      simulation.stop();
    };
  }, [data, simulationParams, visibilityOptions, selectedNodeId, theme, fileColorScale, getNodeRadius, onNodeClick, ref, visibleLinks, C]);

  return (
    <div className={`w-full h-full relative overflow-hidden ${C.bg}`}>
      <svg ref={ref} className="absolute top-0 left-0">
        <g className="graph-content">
          <g className="links"></g>
          <g className="nodes"></g>
        </g>
      </svg>
      <div
        ref={tooltipRef}
        className="absolute opacity-0 transition-opacity duration-200 pointer-events-none bg-slate-800/80 dark:bg-slate-900/80 text-white dark:text-slate-100 text-sm p-2 rounded-md shadow-lg backdrop-blur-sm z-50"
      ></div>
    </div>
  );
});

export default Graph;