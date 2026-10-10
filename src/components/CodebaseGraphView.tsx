import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CodebaseKnowledgeGraph,
  CodebaseModuleNode,
  UnwrittenRule,
  ModuleCommit,
} from '../types.ts';
import {
  Cpu,
  Layers,
  Terminal,
  GitCommit,
  ExternalLink,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Code2,
  Wrench,
  Boxes,
  KeyRound,
  AlertTriangle,
  Compass,
  ArrowRight,
  GitPullRequest,
  CheckCircle2,
  ShieldCheck,
  Maximize2,
  Eye,
  GitBranch,
  Share2,
  Download,
  Upload,
  Check,
  FileJson,
  X,
  FileCode,
  SlidersHorizontal,
} from 'lucide-react';

interface CodebaseGraphViewProps {
  graph: CodebaseKnowledgeGraph;
  rules: UnwrittenRule[];
  repoFullName: string;
  defaultBranch?: string;
  initialNodeId?: string;
  initialLayoutMode?: 'hierarchical' | 'radial';
  initialLayerFilter?: string;
  initialFocusNeighbors?: boolean;
  onImportGraphData?: (importedData: any) => void;
}

interface NodePosition {
  x: number;
  y: number;
}

// Domain-native architectural palette strictly mapped to requested theme colors
const LAYER_STYLES: Record<string, {
  name: string;
  badgeBg: string;
  badgeText: string;
  accentHex: string;
  borderClass: string;
  headerBg: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  core: {
    name: 'Kernel / Runtime',
    badgeBg: 'bg-[#eef4f9]',
    badgeText: 'text-[#204a73]',
    accentHex: '#3b6998', // Muted blue for observability and core runtime information
    borderClass: 'border-[#bfd5e7]',
    headerBg: 'bg-[#f4f8fb]',
    icon: Cpu,
  },
  routing: {
    name: 'Routing & API',
    badgeBg: 'bg-[#fdf4ed]',
    badgeText: 'text-[#9c4b16]',
    accentHex: '#d97736', // Soft orange for API, configuration, and data-related signals
    borderClass: 'border-[#fadbc5]',
    headerBg: 'bg-[#fff8f3]',
    icon: Compass,
  },
  context: {
    name: 'Context & State',
    badgeBg: 'bg-[#edf4ee]',
    badgeText: 'text-[#2d5a36]',
    accentHex: '#588157', // Sage green for highlights, selected states
    borderClass: 'border-[#bcd3be]',
    headerBg: 'bg-[#f4f8f4]',
    icon: Layers,
  },
  session: {
    name: 'Security & Session',
    badgeBg: 'bg-[#fdf4ed]',
    badgeText: 'text-[#9c4b16]',
    accentHex: '#d97736', // Soft orange
    borderClass: 'border-[#fadbc5]',
    headerBg: 'bg-[#fff8f3]',
    icon: KeyRound,
  },
  cli: {
    name: 'CLI & Config',
    badgeBg: 'bg-[#fdf4ed]',
    badgeText: 'text-[#9c4b16]',
    accentHex: '#d97736', // Soft orange
    borderClass: 'border-[#fadbc5]',
    headerBg: 'bg-[#fff8f3]',
    icon: Terminal,
  },
  middleware: {
    name: 'Middleware & Pipeline',
    badgeBg: 'bg-[#edf6f5]',
    badgeText: 'text-[#1b5b56]',
    accentHex: '#38857f', // Pale blue-green for build and bundling modules
    borderClass: 'border-[#bee0de]',
    headerBg: 'bg-[#f3f9f9]',
    icon: Boxes,
  },
  helpers: {
    name: 'Build & Bundling Utils',
    badgeBg: 'bg-[#edf6f5]',
    badgeText: 'text-[#1b5b56]',
    accentHex: '#38857f', // Pale blue-green
    borderClass: 'border-[#bee0de]',
    headerBg: 'bg-[#f3f9f9]',
    icon: Wrench,
  },
  tests: {
    name: 'Test & Verification',
    badgeBg: 'bg-[#f4f1fa]',
    badgeText: 'text-[#4a3a70]',
    accentHex: '#7d6da3', // Soft lavender for test and verification modules
    borderClass: 'border-[#d8cee9]',
    headerBg: 'bg-[#faf8fd]',
    icon: CheckCircle2,
  },
};

export const CodebaseGraphView: React.FC<CodebaseGraphViewProps> = ({
  graph,
  rules,
  repoFullName,
  defaultBranch = 'main',
  initialNodeId,
  initialLayoutMode,
  initialLayerFilter,
  initialFocusNeighbors,
  onImportGraphData,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    initialNodeId || graph.nodes[0]?.id || ''
  );
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'radial'>(
    initialLayoutMode || 'hierarchical'
  );
  const [layerFilter, setLayerFilter] = useState<string>(
    initialLayerFilter || 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterModeOnly, setFilterModeOnly] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [focusNeighborsOnly, setFocusNeighborsOnly] = useState<boolean>(
    initialFocusNeighbors ?? false
  );
  const [linkCopied, setLinkCopied] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync if initialNodeId changes from query params
  useEffect(() => {
    if (initialNodeId && graph.nodes.some((n) => n.id === initialNodeId)) {
      setSelectedNodeId(initialNodeId);
    }
  }, [initialNodeId, graph.nodes]);

  // Keyboard shortcut '/' to quickly focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Selected node object
  const selectedNode = useMemo(() => {
    return (
      graph.nodes.find((n) => n.id === selectedNodeId) ||
      graph.nodes[0] ||
      null
    );
  }, [graph.nodes, selectedNodeId]);

  // Neighbor nodes of the currently selected node
  const neighborIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const neighbors = new Set<string>();
    neighbors.add(selectedNode.id);
    graph.edges.forEach((e) => {
      if (e.from === selectedNode.id) neighbors.add(e.to);
      if (e.to === selectedNode.id) neighbors.add(e.from);
    });
    return neighbors;
  }, [selectedNode, graph.edges]);

  // Nodes matching the search query based on file names, module names, classes, or exported methods
  const matchingNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set(graph.nodes.map((n) => n.id));
    const q = searchQuery.toLowerCase().trim();
    const matches = new Set<string>();
    graph.nodes.forEach((n) => {
      const matchName = n.name.toLowerCase().includes(q);
      const matchPath = n.path.toLowerCase().includes(q);
      const matchSummary = n.summary.toLowerCase().includes(q);
      const matchClasses = n.implementationDetails?.keyClasses?.some((c) =>
        c.toLowerCase().includes(q)
      );
      const matchMethods = n.implementationDetails?.exportedMethods?.some((m) =>
        m.toLowerCase().includes(q)
      );

      if (matchName || matchPath || matchSummary || matchClasses || matchMethods) {
        matches.add(n.id);
      }
    });
    return matches;
  }, [graph.nodes, searchQuery]);

  // When search query changes and finds matches, auto-select first match if current is not in results
  useEffect(() => {
    if (searchQuery.trim() && matchingNodeIds.size > 0) {
      if (!matchingNodeIds.has(selectedNodeId)) {
        const firstMatch = graph.nodes.find((n) => matchingNodeIds.has(n.id));
        if (firstMatch) {
          setSelectedNodeId(firstMatch.id);
        }
      }
    }
  }, [searchQuery, matchingNodeIds, selectedNodeId, graph.nodes]);

  // Visible filtered nodes on canvas
  const visibleNodes = useMemo(() => {
    return graph.nodes.filter((node) => {
      if (focusNeighborsOnly && !neighborIds.has(node.id)) return false;
      const matchesLayer = layerFilter === 'all' || node.layer === layerFilter;
      const matchesSearch = matchingNodeIds.has(node.id);

      // If user is actively searching, or has filterModeOnly toggled, strictly show matching nodes
      if (searchQuery.trim() || filterModeOnly) {
        return matchesLayer && matchesSearch;
      }

      return matchesLayer;
    });
  }, [graph.nodes, layerFilter, matchingNodeIds, focusNeighborsOnly, neighborIds, searchQuery, filterModeOnly]);

  const visibleNodeIdSet = useMemo(() => {
    return new Set(visibleNodes.map((n) => n.id));
  }, [visibleNodes]);

  // Layout node coordinates based on visible or total nodes
  const nodePositions = useMemo(() => {
    const posMap: Record<string, NodePosition> = {};

    if (layoutMode === 'hierarchical') {
      const tiers: Record<string, CodebaseModuleNode[]> = {
        tier1: [],
        tier2: [],
        tier3: [],
        tier4: [],
      };

      graph.nodes.forEach((node) => {
        if (node.layer === 'core') tiers.tier1.push(node);
        else if (node.layer === 'routing' || node.layer === 'context') tiers.tier2.push(node);
        else if (node.layer === 'session' || node.layer === 'middleware') tiers.tier3.push(node);
        else tiers.tier4.push(node);
      });

      const tierY = [80, 230, 390, 550];
      const canvasWidth = 820;

      Object.values(tiers).forEach((tierNodes, tierIdx) => {
        const count = tierNodes.length;
        const spacing = canvasWidth / (count + 1);
        tierNodes.forEach((node, nodeIdx) => {
          posMap[node.id] = {
            x: Math.round(spacing * (nodeIdx + 1)),
            y: tierY[tierIdx],
          };
        });
      });
    } else {
      const centerX = 440;
      const centerY = 340;
      const total = graph.nodes.length;

      graph.nodes.forEach((node, idx) => {
        const radius = node.layer === 'core' ? 95 : 255;
        const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
        posMap[node.id] = {
          x: Math.round(centerX + Math.cos(angle) * radius),
          y: Math.round(centerY + Math.sin(angle) * radius),
        };
      });
    }

    return posMap;
  }, [graph.nodes, layoutMode]);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-node-card')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 20, y: 20 });
    setFocusNeighborsOnly(false);
    setSearchQuery('');
    setLayerFilter('all');
  };

  const handleCopyShareLink = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('repo', repoFullName);
      url.searchParams.set('tab', 'graph');
      if (selectedNodeId) url.searchParams.set('node', selectedNodeId);
      url.searchParams.set('layout', layoutMode);
      if (layerFilter && layerFilter !== 'all') {
        url.searchParams.set('subsystem', layerFilter);
      } else {
        url.searchParams.delete('subsystem');
      }
      if (focusNeighborsOnly) {
        url.searchParams.set('isolated', 'true');
      } else {
        url.searchParams.delete('isolated');
      }

      navigator.clipboard.writeText(url.toString());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy link:', err);
    }
  };

  const handleExportJson = () => {
    const payload = {
      version: '1.0',
      repo: repoFullName,
      exportedAt: new Date().toISOString(),
      navigationState: {
        selectedNodeId,
        layoutMode,
        layerFilter,
        focusNeighborsOnly,
        searchQuery,
        zoom,
        pan,
      },
      graph,
      unwrittenRules: rules,
    };
    const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const downloadUrl = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    const sanitizedName = repoFullName.replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${sanitizedName}-architecture-graph.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.graph && Array.isArray(parsed.graph.nodes)) {
          if (onImportGraphData) {
            onImportGraphData(parsed);
          }
          if (parsed.navigationState) {
            if (parsed.navigationState.selectedNodeId) {
              setSelectedNodeId(parsed.navigationState.selectedNodeId);
            }
            if (parsed.navigationState.layoutMode) {
              setLayoutMode(parsed.navigationState.layoutMode);
            }
            if (parsed.navigationState.layerFilter) {
              setLayerFilter(parsed.navigationState.layerFilter);
            }
            if (parsed.navigationState.focusNeighborsOnly !== undefined) {
              setFocusNeighborsOnly(parsed.navigationState.focusNeighborsOnly);
            }
            if (parsed.navigationState.searchQuery) {
              setSearchQuery(parsed.navigationState.searchQuery);
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse graph JSON:', err);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Associated rules for selected module
  const associatedRules = useMemo(() => {
    if (!selectedNode) return [];
    return rules.filter(
      (r) =>
        selectedNode.associatedRules.includes(r.id) ||
        r.citations.some(
          (c) =>
            (c.link && c.link.toLowerCase().includes(selectedNode.name.toLowerCase())) ||
            (c.comment && c.comment.toLowerCase().includes(selectedNode.name.toLowerCase()))
        )
    );
  }, [selectedNode, rules]);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white border border-[#e2e6e1] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#5a6861] font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#588157]" />
            <span className="font-bold text-[#183a2b] tracking-wide uppercase">Architecture Blueprint</span>
            <span className="text-[#c4ccc6]">/</span>
            <span className="text-[#202422] font-bold">{repoFullName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#202422] tracking-tight">
            Interactive Codebase Knowledge Graph
          </h2>
          <p className="text-xs text-[#5a6861] max-w-2xl leading-relaxed">
            Click any module node to inspect implementation details, exported APIs, direct Git commit history, and mined maintainer rules.
          </p>
        </div>

        {/* Global Blueprint Metrics */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <div className="bg-[#eef4f9] border border-[#bfd5e7] px-3.5 py-2 rounded-xl text-center shadow-2xs">
            <span className="block text-sm font-bold text-[#204a73]">{graph.nodes.length}</span>
            <span className="text-[10px] text-[#204a73]/80 font-semibold uppercase tracking-wider">Modules</span>
          </div>
          <div className="bg-[#edf6f5] border border-[#bee0de] px-3.5 py-2 rounded-xl text-center shadow-2xs">
            <span className="block text-sm font-bold text-[#1b5b56]">{graph.edges.length}</span>
            <span className="text-[10px] text-[#1b5b56]/80 font-semibold uppercase tracking-wider">Edges</span>
          </div>
          <div className="bg-[#edf4ee] border border-[#bcd3be] px-3.5 py-2 rounded-xl text-center shadow-2xs">
            <span className="block text-sm font-bold text-[#2d5a36]">
              {graph.nodes.reduce((acc, n) => acc + n.commits.length, 0)}
            </span>
            <span className="text-[10px] text-[#2d5a36]/80 font-semibold uppercase tracking-wider">Commits</span>
          </div>
        </div>
      </div>

      {/* Prominent Search & Filter Toolbar inside CodebaseGraphView */}
      <div className="bg-white border border-[#e2e6e1] rounded-2xl p-4 shadow-xs space-y-3">
        {/* Main Search Bar Row with Outstanding Visual Presence */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input Box */}
          <div className="relative flex-1 group">
            <Search className="w-4 h-4 text-[#8a9891] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-[#183a2b] transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter graph nodes by file name or module name (e.g. app.py, ctx, blueprints, request, helpers)..."
              className="w-full bg-[#f8f7f4] hover:bg-[#f3f2ee] focus:bg-white border-2 border-[#d8ded6] focus:border-[#183a2b] rounded-xl pl-10 pr-20 py-2.5 text-xs font-mono text-[#202422] placeholder-[#8a9891] focus:outline-none focus:ring-4 focus:ring-[#183a2b]/10 transition-all"
            />

            {/* Clear Button and Keyboard Shortcut Indicator */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#8a9891] hover:text-[#202422] p-1 rounded-lg hover:bg-[#e2e6e1] transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#5a6861] bg-white border border-[#d8ded6] rounded shadow-2xs">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Quick Stats & Visibility Filter Toggle */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {searchQuery.trim() ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-[#edf4ee] border border-[#bcd3be] text-[#2d5a36] font-bold flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#588157] animate-pulse" />
                  <span>{visibleNodes.length} of {graph.nodes.length} nodes visible</span>
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-2.5 py-1.5 rounded-xl bg-[#f8f7f4] hover:bg-[#e2e6e1] text-[#202422] border border-[#d8ded6] font-semibold transition-colors"
                >
                  Reset
                </button>
              </div>
            ) : (
              <span className="text-[#5a6861] font-semibold">
                {graph.nodes.length} modules visible
              </span>
            )}
          </div>
        </div>

        {/* Quick File & Module Jump Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
          <span className="text-[#5a6861] text-[11px] mr-1 shrink-0 flex items-center gap-1 font-semibold">
            <FileCode className="w-3.5 h-3.5 text-[#588157]" />
            <span>Quick jump:</span>
          </span>
          {graph.nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const isMatch = matchingNodeIds.has(node.id);
            const style = LAYER_STYLES[node.layer] || LAYER_STYLES.core;

            return (
              <button
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  if (searchQuery.trim()) {
                    setSearchQuery(node.name);
                  }
                }}
                className={`px-2.5 py-1 rounded-xl text-xs transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#183a2b] text-white font-bold shadow-xs'
                    : isMatch && searchQuery.trim()
                    ? 'bg-[#fdf4ed] text-[#9c4b16] border border-[#fadbc5] font-semibold'
                    : isMatch
                    ? 'bg-[#f8f7f4] hover:bg-[#edf4ee] text-[#202422] border border-[#d8ded6]'
                    : 'bg-white text-[#8a9891] border border-[#e2e6e1] opacity-70'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: style.accentHex }}
                />
                <span>{node.name}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary controls row: Layout Mode, Subsystems, Zoom, Export, Share */}
        <div className="pt-2 border-t border-[#eef1ed] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Layout Mode Segmented Control */}
          <div className="flex items-center bg-[#f8f7f4] p-0.5 rounded-xl border border-[#d8ded6]">
            <button
              onClick={() => setLayoutMode('hierarchical')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                layoutMode === 'hierarchical'
                  ? 'bg-white text-[#183a2b] shadow-2xs font-bold'
                  : 'text-[#5a6861] hover:text-[#202422]'
              }`}
            >
              Tiered Pipeline
            </button>
            <button
              onClick={() => setLayoutMode('radial')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                layoutMode === 'radial'
                  ? 'bg-white text-[#183a2b] shadow-2xs font-bold'
                  : 'text-[#5a6861] hover:text-[#202422]'
              }`}
            >
              Radial Circuit
            </button>
          </div>

          {/* Subsystem Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setLayerFilter('all')}
              className={`px-2.5 py-1 rounded-xl transition-all font-semibold ${
                layerFilter === 'all'
                  ? 'bg-[#183a2b] text-white shadow-xs font-bold'
                  : 'bg-[#f8f7f4] text-[#5a6861] hover:text-[#202422] hover:bg-[#e2e6e1] border border-[#d8ded6]'
              }`}
            >
              All Layers
            </button>
            {Object.entries(LAYER_STYLES).map(([key, style]) => {
              const count = graph.nodes.filter((n) => n.layer === key).length;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setLayerFilter(key)}
                  className={`px-2.5 py-1 rounded-xl transition-all flex items-center gap-1.5 font-medium ${
                    layerFilter === key
                      ? 'bg-[#183a2b] text-white shadow-xs font-bold'
                      : 'bg-[#f8f7f4] text-[#5a6861] hover:text-[#202422] hover:bg-[#e2e6e1] border border-[#d8ded6]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: style.accentHex }}
                  />
                  <span>{style.name.split('/')[0].trim()}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Action Tools: Isolate, Zoom, Share, Export */}
          <div className="flex items-center gap-1.5">
            {/* Isolate Cluster */}
            <button
              onClick={() => setFocusNeighborsOnly(!focusNeighborsOnly)}
              className={`px-2.5 py-1 rounded-xl border font-mono transition-all flex items-center gap-1.5 ${
                focusNeighborsOnly
                  ? 'bg-[#edf4ee] border-[#bcd3be] text-[#2d5a36] font-bold shadow-2xs'
                  : 'bg-[#f8f7f4] border-[#d8ded6] text-[#5a6861] hover:text-[#202422] hover:bg-[#e2e6e1]'
              }`}
              title="Isolate selected module and its immediate connections"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{focusNeighborsOnly ? 'Isolated' : 'Isolate'}</span>
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center bg-[#f8f7f4] border border-[#d8ded6] rounded-xl p-0.5">
              <button
                onClick={() => setZoom((z) => Math.min(1.7, z + 0.15))}
                className="p-1 text-[#5a6861] hover:text-[#202422] transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.65, z - 0.15))}
                className="p-1 text-[#5a6861] hover:text-[#202422] transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetView}
                className="p-1 text-[#5a6861] hover:text-[#202422] transition-colors"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Share & Export */}
            <button
              onClick={handleCopyShareLink}
              className="px-2.5 py-1 rounded-xl border text-xs font-mono transition-all flex items-center gap-1.5 bg-[#f8f7f4] border-[#d8ded6] text-[#202422] hover:bg-[#edf4ee] font-medium"
              title="Copy shareable link with current module selection and layout state"
            >
              {linkCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#588157]" />
                  <span className="text-[#2d5a36] font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#3b6998]" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportJson}
              className="px-2.5 py-1 rounded-xl border text-xs font-mono transition-all flex items-center gap-1.5 bg-[#f8f7f4] border-[#d8ded6] text-[#202422] hover:bg-[#edf4ee] font-medium"
              title="Export full architecture graph & state to JSON"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#588157]" />
                  <span className="text-[#2d5a36] font-bold">Exported!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-[#588157]" />
                  <span>Export JSON</span>
                </>
              )}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-xl border text-xs font-mono transition-all flex items-center gap-1.5 bg-[#f8f7f4] border-[#d8ded6] text-[#202422] hover:bg-[#edf4ee] font-medium"
              title="Import previously saved architecture graph JSON"
            >
              <Upload className="w-3.5 h-3.5 text-[#5a6861]" />
              <span>Import</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Main Split Grid: Blueprint Canvas (7 cols) + Deep Inspector (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px]">
        {/* Left: Blueprint Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="lg:col-span-7 xl:col-span-7 bg-[#f8f7f4] border-2 border-[#e2e6e1] rounded-2xl overflow-hidden relative shadow-xs h-[580px] lg:h-[700px] cursor-grab active:cursor-grabbing select-none"
        >
          {/* Engineering Blueprint Grid */}
          <div
            className="absolute inset-0 opacity-[0.45] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(#e2e6e1 1px, transparent 1px), linear-gradient(90deg, #e2e6e1 1px, transparent 1px)`,
              backgroundSize: '28px 28px',
            }}
          />

          {/* SVG Connection Edges */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <defs>
              <marker
                id="edge-arrow-light"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#a4b3a7" />
              </marker>
              <marker
                id="edge-arrow-active-light"
                markerWidth="9"
                markerHeight="7"
                refX="8"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 9 3.5, 0 7" fill="#183a2b" />
              </marker>
            </defs>

            {graph.edges.map((edge, idx) => {
              // Only draw edges if both from & to nodes are in visibleNodes
              const fromVisible = visibleNodeIdSet.has(edge.from);
              const toVisible = visibleNodeIdSet.has(edge.to);
              if (!fromVisible || !toVisible) return null;

              const fromPos = nodePositions[edge.from];
              const toPos = nodePositions[edge.to];
              if (!fromPos || !toPos) return null;

              const isConnectedToSelected =
                selectedNode &&
                (edge.from === selectedNode.id || edge.to === selectedNode.id);

              const isFromActive = selectedNode?.id === edge.from;

              const midX = (fromPos.x + toPos.x) / 2;
              const midY = (fromPos.y + toPos.y) / 2 - (layoutMode === 'hierarchical' ? 20 : 0);

              const pathD = `M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY} ${toPos.x} ${toPos.y}`;

              return (
                <g key={idx}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={
                      isConnectedToSelected
                        ? isFromActive
                          ? '#183a2b'
                          : '#588157'
                        : '#cbd2cb'
                    }
                    strokeWidth={isConnectedToSelected ? 2.5 : 1.3}
                    strokeDasharray={isConnectedToSelected ? '4 3' : 'none'}
                    markerEnd={
                      isConnectedToSelected
                        ? 'url(#edge-arrow-active-light)'
                        : 'url(#edge-arrow-light)'
                    }
                    className="transition-colors duration-200"
                  />
                  {isConnectedToSelected && (
                    <text
                      x={midX}
                      y={midY - 6}
                      fill="#183a2b"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="select-none"
                    >
                      {edge.relationship}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Node Cards on Canvas */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {visibleNodes.length === 0 ? (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center p-8 bg-white border-2 border-[#e2e6e1] rounded-3xl shadow-lg pointer-events-auto max-w-sm space-y-3">
                <Search className="w-8 h-8 text-[#8a9891] mx-auto" />
                <h4 className="font-bold text-sm text-[#202422] font-mono">
                  No modules match &ldquo;{searchQuery}&rdquo;
                </h4>
                <p className="text-xs text-[#5a6861] leading-relaxed">
                  Try searching for file names like <span className="font-mono text-[#183a2b]">app.py</span>, <span className="font-mono text-[#183a2b]">ctx.py</span>, or subsystem keywords.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-[#183a2b] hover:bg-[#122c20] text-white font-semibold text-xs transition-all shadow-xs"
                >
                  Clear Search Filter
                </button>
              </div>
            ) : (
              visibleNodes.map((node) => {
                const pos = nodePositions[node.id];
                if (!pos) return null;

                const isSelected = selectedNode?.id === node.id;
                const isSearchMatch = matchingNodeIds.has(node.id) && searchQuery.trim().length > 0;
                const isNeighbor = neighborIds.has(node.id);
                const style = LAYER_STYLES[node.layer] || LAYER_STYLES.core;
                const Icon = style.icon;

                return (
                  <div
                    key={node.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                    }}
                    style={{
                      left: `${pos.x - 90}px`,
                      top: `${pos.y - 48}px`,
                      width: '180px',
                    }}
                    className={`interactive-node-card pointer-events-auto absolute p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? `bg-white border-2 border-[#183a2b] ring-4 ring-[#183a2b]/15 shadow-md scale-105 z-30`
                        : isSearchMatch
                        ? `bg-white border-2 border-[#d97736] ring-3 ring-[#d97736]/20 shadow-md z-20`
                        : isNeighbor
                        ? `bg-white border border-[#bcd3be] shadow-2xs z-15`
                        : `bg-white border border-[#e2e6e1] hover:border-[#bcd3be] shadow-2xs z-10`
                    }`}
                  >
                    {/* Card Top: Subsystem Badge & Sensitivity */}
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                      <span
                        className="flex items-center gap-1 font-bold"
                        style={{ color: style.accentHex }}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{style.name.split('/')[0].trim()}</span>
                      </span>

                      {node.implementationDetails.maintainerSensitivity === 'critical' ? (
                        <span className="text-[#9c4b16] font-bold px-1.5 py-0.2 rounded bg-[#fdf4ed] border border-[#fadbc5]">
                          CRITICAL
                        </span>
                      ) : (
                        <span className="text-[#204a73] font-semibold px-1 py-0.2 rounded bg-[#eef4f9]">
                          STRICT
                        </span>
                      )}
                    </div>

                    {/* File Name with search match highlight */}
                    <h4 className="font-mono text-xs font-bold text-[#202422] truncate flex items-center gap-1">
                      {isSearchMatch ? (
                        <span className="bg-[#fdf4ed] text-[#9c4b16] px-1 py-0.5 rounded">
                          {node.name}
                        </span>
                      ) : (
                        <span>{node.name}</span>
                      )}
                    </h4>

                    {/* Short Summary */}
                    <p className="text-[11px] text-[#5a6861] line-clamp-2 leading-snug mt-1">
                      {node.summary}
                    </p>

                    {/* Card Footer */}
                    <div className="mt-2 pt-1.5 border-t border-[#eef1ed] flex items-center justify-between text-[10px] text-[#5a6861] font-mono">
                      <span className="flex items-center gap-1 text-[#2d5a36] font-semibold">
                        <GitCommit className="w-3 h-3" />
                        <span>{node.commits.length} commits</span>
                      </span>
                      <span className="text-[#202422] font-bold">
                        {node.dependencies.length} deps
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Blueprint Canvas Hint */}
          <div className="absolute bottom-3 left-3 bg-white border border-[#d8ded6] px-3 py-1.5 rounded-xl text-[11px] text-[#5a6861] font-mono flex items-center gap-2 pointer-events-none shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#588157] animate-pulse" />
            <span>Click node to inspect • Drag canvas to pan</span>
          </div>
        </div>

        {/* Right: Deep Module Inspector (White Surface) */}
        <div className="lg:col-span-5 xl:col-span-5 bg-white border border-[#e2e6e1] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-6 max-h-[700px] overflow-y-auto scrollbar-thin">
          {selectedNode ? (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Header */}
              <div className="pb-4 border-b border-[#eef1ed] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="p-2.5 rounded-xl"
                      style={{
                        backgroundColor: `${
                          LAYER_STYLES[selectedNode.layer]?.accentHex || '#183a2b'
                        }18`,
                        color:
                          LAYER_STYLES[selectedNode.layer]?.accentHex || '#183a2b',
                      }}
                    >
                      {React.createElement(
                        LAYER_STYLES[selectedNode.layer]?.icon || Cpu,
                        { className: 'w-5 h-5' }
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#202422] font-mono tracking-tight">
                        {selectedNode.name}
                      </h3>
                      <span className="text-xs text-[#5a6861] font-mono block">
                        {selectedNode.path}
                      </span>
                    </div>
                  </div>

                  <a
                    href={`https://github.com/${repoFullName}/blob/${defaultBranch}/${selectedNode.path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-[#f8f7f4] border border-[#d8ded6] text-[#183a2b] hover:text-black hover:bg-[#edf4ee] transition-colors"
                    title="View file on GitHub"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono pt-1 text-[#5a6861]">
                  <span
                    className="font-bold"
                    style={{
                      color:
                        LAYER_STYLES[selectedNode.layer]?.accentHex || '#183a2b',
                    }}
                  >
                    {LAYER_STYLES[selectedNode.layer]?.name}
                  </span>
                  <span>·</span>
                  <span className="uppercase text-[#202422] font-semibold">
                    Sensitivity: {selectedNode.implementationDetails.maintainerSensitivity}
                  </span>
                </div>
              </div>

              {/* Purpose & Internal Execution */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[#183a2b] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#588157]" />
                    <span>Architectural Purpose</span>
                  </h4>
                  <p className="text-xs text-[#202422] leading-relaxed bg-[#f8f7f4] p-3.5 rounded-xl border border-[#e2e6e1]">
                    {selectedNode.implementationDetails.purpose}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#38857f] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#38857f]" />
                    <span>Internal Mechanics &amp; Execution Pipeline</span>
                  </h4>
                  <p className="text-xs text-[#202422] leading-relaxed bg-[#f8f7f4] p-3.5 rounded-xl border border-[#e2e6e1] font-mono">
                    {selectedNode.implementationDetails.internalMechanics}
                  </p>
                </div>
              </div>

              {/* Key Classes & Exported Methods */}
              <div className="space-y-3 pt-2 border-t border-[#eef1ed]">
                <div>
                  <span className="text-[11px] font-mono text-[#5a6861] font-semibold block mb-1.5 uppercase">
                    Core Classes &amp; Data Structures:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.implementationDetails.keyClasses.map((cls, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-lg font-mono text-xs bg-[#eef4f9] text-[#204a73] border border-[#bfd5e7] font-semibold"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-[#5a6861] font-semibold block mb-1.5 uppercase">
                    Exported APIs &amp; Interfaces:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.implementationDetails.exportedMethods.map((m, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg font-mono text-[11px] bg-[#edf6f5] text-[#1b5b56] border border-[#bee0de] font-semibold"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-[#5a6861] font-semibold block mb-1.5 uppercase">
                    Design Patterns Enforced:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.implementationDetails.designPatterns.map((p, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-lg text-[11px] bg-[#edf4ee] text-[#2d5a36] border border-[#bcd3be] font-bold"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Module Git Commit History */}
              <div className="space-y-2.5 pt-2 border-t border-[#eef1ed]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#183a2b] font-bold flex items-center gap-1.5">
                    <GitCommit className="w-3.5 h-3.5 text-[#588157]" />
                    <span>Module Commit History ({selectedNode.commits.length})</span>
                  </span>
                  <a
                    href={`https://github.com/${repoFullName}/commits/${defaultBranch}/${selectedNode.path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#183a2b] hover:text-[#122c20] text-[10px] font-semibold flex items-center gap-1 hover:underline"
                    title="View entire git commit log for this module on GitHub"
                  >
                    <span>Full Log</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <div className="space-y-2">
                  {selectedNode.commits.map((commit, idx) => {
                    const commitUrl = commit.html_url?.startsWith('http')
                      ? commit.html_url
                      : (commit.sha && commit.sha !== 'git log' && commit.sha.length >= 7)
                        ? `https://github.com/${repoFullName}/commit/${commit.sha}`
                        : `https://github.com/${repoFullName}/commits/${defaultBranch}/${selectedNode.path}`;
                    return (
                      <a
                        key={idx}
                        href={commitUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group block bg-[#f8f7f4] hover:bg-[#edf4ee] border border-[#e2e6e1] hover:border-[#bcd3be] p-3 rounded-xl space-y-1.5 transition-all shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-[#183a2b] group-hover:text-black group-hover:underline flex items-center gap-1.5 font-bold">
                            <span className="bg-[#edf4ee] text-[#2d5a36] border border-[#bcd3be] px-1.5 py-0.5 rounded text-[10px]">
                              {commit.sha.length > 8 ? commit.sha.slice(0, 8) : commit.sha}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" />
                          </span>
                          <span className="text-[#5a6861] text-[10px] font-mono">
                            {commit.author} · {commit.date}
                          </span>
                        </div>
                        <p className="text-xs text-[#202422] leading-snug font-medium">
                          {commit.message}
                        </p>
                      </a>
                    );
                  })}
                </div>

                <a
                  href={`https://github.com/${repoFullName}/commits/${defaultBranch}/${selectedNode.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#183a2b] hover:bg-[#122c20] text-white text-xs font-mono font-semibold transition-colors shadow-xs"
                >
                  <GitCommit className="w-3.5 h-3.5 text-[#8bc396]" />
                  <span>View all commits for {selectedNode.name} on GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Unwritten Maintainer Rules for this module */}
              {associatedRules.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#eef1ed]">
                  <span className="text-xs font-mono text-[#9c4b16] font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#d97736]" />
                    <span>Maintainer Rules for {selectedNode.name}</span>
                  </span>
                  <div className="space-y-2">
                    {associatedRules.map((r) => (
                      <div
                        key={r.id}
                        className="bg-[#fdf4ed] border border-[#fadbc5] p-3 rounded-xl text-xs space-y-1"
                      >
                        <span className="font-bold text-[#202422] block">
                          {r.title}
                        </span>
                        <p className="text-[#5a6861] text-[11px] leading-relaxed">
                          {r.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected Dependencies */}
              <div className="space-y-2 pt-2 border-t border-[#eef1ed]">
                <span className="text-[11px] font-mono text-[#5a6861] font-semibold block uppercase">
                  Connected Subsystems ({selectedNode.dependencies.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.dependencies.map((depId) => {
                    const targetNode = graph.nodes.find((n) => n.id === depId);
                    if (!targetNode) return null;
                    return (
                      <button
                        key={depId}
                        onClick={() => setSelectedNodeId(depId)}
                        className="px-2.5 py-1 rounded-xl text-xs font-mono bg-[#f8f7f4] hover:bg-[#edf4ee] text-[#202422] border border-[#d8ded6] flex items-center gap-1 transition-colors font-semibold"
                      >
                        <span>→ {targetNode.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-[#8a9891] text-xs font-mono">
              Select a module in the architecture graph to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
