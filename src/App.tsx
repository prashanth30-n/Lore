import React, { useState, useEffect } from 'react';
import { RepoInput } from './components/RepoInput.tsx';
import { AnalysisProgress } from './components/AnalysisProgress.tsx';
import { CodebaseGraphView } from './components/CodebaseGraphView.tsx';
import { RulesView } from './components/RulesView.tsx';
import { MentalMapView } from './components/MentalMapView.tsx';
import { SurvivalGuideView } from './components/SurvivalGuideView.tsx';
import { SkillExportView } from './components/SkillExportView.tsx';
import { PrLinterView } from './components/PrLinterView.tsx';
import { OllamaModal } from './components/OllamaModal.tsx';
import { TokenModal } from './components/TokenModal.tsx';
import { RepoLoreAnalysis } from './types.ts';
import {
  Network,
  BookOpen,
  Compass,
  ShieldCheck,
  Bot,
  Code2,
  ExternalLink,
  AlertTriangle,
  Menu,
  X,
  Sparkles,
  Cpu,
  Key,
  Terminal,
  ChevronRight,
  GitBranch,
} from 'lucide-react';

export default function App() {
  const [engine, setEngine] = useState<'gemini' | 'ollama'>('gemini');
  const [ollamaHost, setOllamaHost] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('qwen2.5-coder:7b');
  const [ollamaConnected, setOllamaConnected] = useState<boolean | null>(null);

  const [githubToken, setGithubToken] = useState<string>(() => {
    return localStorage.getItem('repolore_gh_token') || '';
  });

  const [isOllamaModalOpen, setIsOllamaModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'graph' | 'rules' | 'mental-map' | 'survival-guide' | 'skill-export' | 'diff-linter'>('graph');
  const [isLoading, setIsLoading] = useState(false);
  const [currentRepoQuery, setCurrentRepoQuery] = useState('');
  const [analyzedData, setAnalyzedData] = useState<RepoLoreAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [initialNavState, setInitialNavState] = useState<{
    nodeId?: string;
    layoutMode?: 'hierarchical' | 'radial';
    layerFilter?: string;
    focusNeighbors?: boolean;
  }>({});

  // Analyze a repository
  const handleAnalyzeRepo = async (repoQuery: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentRepoQuery(repoQuery);

    try {
      const res = await fetch('/api/analyze-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repoQuery,
          githubToken,
          engine,
          ollamaHost,
          ollamaModel,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to analyze repo (status ${res.status})`);
      }

      const data: RepoLoreAnalysis = await res.json();
      setAnalyzedData(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while mining the repository.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportGraphData = (imported: any) => {
    if (imported.graph) {
      setAnalyzedData((prev) => {
        if (!prev) {
          return {
            repo: {
              owner: (imported.repo || 'imported/repo').split('/')[0] || 'imported',
              name: (imported.repo || 'imported/repo').split('/')[1] || 'repo',
              fullName: imported.repo || 'imported/repo',
              description: 'Imported repository architecture graph',
              stars: 0,
              forks: 0,
              language: 'Code',
              defaultBranch: 'main',
              url: `https://github.com/${imported.repo || 'imported/repo'}`,
            },
            stats: { prsScanned: 0, reviewCommentsMined: 0, commitsAnalyzed: 0, issuesScanned: 0 },
            mentalMap: {
              overview: 'Imported architecture graph state.',
              architectureSummary: 'Imported from JSON snapshot.',
              coreDirectories: [],
              maintainerPhilosophy: [],
            },
            moduleGraph: imported.graph,
            unwrittenRules: Array.isArray(imported.unwrittenRules) ? imported.unwrittenRules : (Array.isArray(imported.rules) ? imported.rules : []),
            rejectionPitfalls: [],
            firstPrChecklist: [],
            skillMd: '',
            cursorRules: '',
            generatedAt: imported.exportedAt || new Date().toISOString(),
            aiEngineUsed: 'Imported JSON Snapshot',
          };
        }
        return {
          ...prev,
          moduleGraph: imported.graph,
          unwrittenRules: Array.isArray(imported.unwrittenRules) && imported.unwrittenRules.length > 0 ? imported.unwrittenRules : prev.unwrittenRules,
          aiEngineUsed: 'Imported JSON Snapshot',
        };
      });
      setActiveTab('graph');
    }
  };

  // Initial load: parse URL parameters
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const qRepo = params.get('repo');
      const qTab = params.get('tab') as any;
      const qNode = params.get('node');
      const qLayout = params.get('layout') as 'hierarchical' | 'radial' | null;
      const qSubsystem = params.get('subsystem');
      const qIsolated = params.get('isolated') === 'true';

      if (qTab && ['graph', 'rules', 'mental-map', 'survival-guide', 'skill-export', 'diff-linter'].includes(qTab)) {
        setActiveTab(qTab);
      }

      setInitialNavState({
        nodeId: qNode || undefined,
        layoutMode: qLayout || undefined,
        layerFilter: qSubsystem || undefined,
        focusNeighbors: qIsolated || undefined,
      });

      if (qRepo && qRepo.trim()) {
        handleAnalyzeRepo(qRepo.trim());
      } else {
        handleAnalyzeRepo('pallets/flask');
      }
    } catch {
      handleAnalyzeRepo('pallets/flask');
    }
  }, []);

  const navItems = [
    {
      id: 'graph' as const,
      label: 'Architecture Graph',
      icon: Network,
      count: analyzedData?.moduleGraph?.nodes?.length,
    },
    {
      id: 'rules' as const,
      label: 'Unwritten Rules & Lore',
      icon: BookOpen,
      count: analyzedData?.unwrittenRules?.length,
    },
    {
      id: 'mental-map' as const,
      label: 'System Blueprint',
      icon: Compass,
    },
    {
      id: 'survival-guide' as const,
      label: 'First-PR Checklist & Traps',
      icon: ShieldCheck,
      count: analyzedData?.firstPrChecklist?.length,
    },
    {
      id: 'skill-export' as const,
      label: 'Agent Skill Artifact',
      icon: Bot,
    },
    {
      id: 'diff-linter' as const,
      label: 'Pre-Flight PR Linter',
      icon: Code2,
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf6ef] text-[#2b1d16] flex flex-col md:flex-row font-sans selection:bg-[#fbf2d5] selection:text-[#3d2a1f]">
      {/* Mobile Header (Walnut Brown) */}
      <div className="md:hidden bg-[#2b1e17] text-white p-4 flex items-center justify-between border-b border-[#3d2c22] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#3d2c22] flex items-center justify-center text-white border border-[#4d392d]">
            <Compass className="w-4 h-4 text-[#f5d565]" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight font-mono">RepoLore</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Buttercream "Analysis ready" pill */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#3d2c22] text-[#fbf2d5] text-[10px] font-mono font-bold border border-[#4d392d]">
            <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-[#e8b030] animate-spin' : 'bg-[#f1be42] animate-pulse'}`} />
            <span>{isLoading ? 'Mining' : 'Ready'}</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-[#baa99c] hover:text-white hover:bg-[#3d2c22] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Walnut Brown Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:flex flex-col justify-between w-full md:w-64 lg:w-72 bg-[#2b1e17] text-white border-r border-[#3d2c22] md:sticky md:top-0 md:h-screen z-30 shrink-0 p-4 space-y-6 overflow-y-auto`}
      >
        <div className="space-y-6">
          {/* Sidebar Brand & Logo */}
          <div className="hidden md:flex items-center gap-3 pb-3 border-b border-[#3d2c22]">
            <div className="h-10 w-10 rounded-xl bg-[#3d2c22] flex items-center justify-center text-white border border-[#4d392d] shadow-xs">
              <Compass className="w-5 h-5 text-[#f5d565]" />
            </div>
            <div>
              <div className="font-extrabold text-lg text-white tracking-tight font-mono leading-tight">
                RepoLore
              </div>
              <div className="text-[11px] text-[#baa99c] font-mono">
                Codebase Lore &amp; Agent Skills
              </div>
            </div>
          </div>

          {/* Buttercream "Analysis ready" indicator */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#3d2c22] border border-[#4d392d] text-[#fbf2d5] text-xs font-mono">
            <div className="flex items-center gap-2 font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  isLoading ? 'bg-[#e8b030] animate-spin' : 'bg-[#f1be42] animate-pulse'
                }`}
              />
              <span>{isLoading ? 'Mining repository...' : 'Analysis ready'}</span>
            </div>
            {analyzedData && !isLoading && (
              <span className="text-[10px] text-[#baa99c] font-semibold">100% lore</span>
            )}
          </div>

          {/* Active Repository Card in Sidebar */}
          {analyzedData && (
            <div className="bg-[#36261d] border border-[#4d392d] rounded-xl p-3 space-y-1.5 text-xs font-mono">
              <span className="text-[10px] text-[#baa99c] uppercase font-bold block">
                Target Codebase
              </span>
              <div className="font-bold text-white truncate flex items-center justify-between">
                <span>{analyzedData.repo.fullName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4d392d] text-[#f5d565] font-semibold">
                  {analyzedData.repo.language}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#baa99c] pt-0.5">
                <span>{analyzedData.repo.stars.toLocaleString()} ★</span>
                <span>·</span>
                <span>{analyzedData.stats.reviewCommentsMined} reviews mined</span>
              </div>
            </div>
          )}

          {/* Primary Navigation */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#9d897c] font-mono font-bold block px-2 mb-1.5">
              Primary Navigation
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#443126] text-[#fff7ee] border-l-4 border-[#e8b030] font-bold shadow-xs'
                      : 'text-[#baa99c] hover:text-white hover:bg-[#38281f]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#f5d565]' : 'text-[#9d897c]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.count === 'number' && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-[#5c4030] text-[#fff7ee] font-bold' : 'bg-[#3d2c22] text-[#baa99c]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer: Engine and System Controls */}
        <div className="pt-4 border-t border-[#3d2c22] space-y-3 text-xs font-mono">
          {/* Segmented Engine Switch */}
          <div className="flex items-center bg-[#1d140f] p-1 rounded-xl border border-[#3d2c22]">
            <button
              onClick={() => setEngine('gemini')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all ${
                engine === 'gemini'
                  ? 'bg-[#443126] text-white font-bold shadow-2xs'
                  : 'text-[#baa99c] hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#f5d565]" />
              <span>Gemini 3.8</span>
            </button>

            <button
              onClick={() => setEngine('ollama')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all ${
                engine === 'ollama'
                  ? 'bg-[#443126] text-white font-bold shadow-2xs'
                  : 'text-[#baa99c] hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-[#e8b030]" />
              <span>Ollama</span>
              {ollamaConnected === true && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#f1be42]" />
              )}
            </button>
          </div>

          {/* Model Config & Token Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsOllamaModalOpen(true)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-[#36261d] hover:bg-[#443126] border border-[#4d392d] text-[#fbf2d5] text-[11px] transition-colors truncate"
              title="Configure Ollama connection"
            >
              <Terminal className="w-3 h-3 text-[#e8b030] shrink-0" />
              <span className="truncate">{engine === 'ollama' ? ollamaModel : 'LLM Host'}</span>
            </button>

            <button
              onClick={() => setIsTokenModalOpen(true)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border text-[11px] transition-colors truncate ${
                githubToken
                  ? 'bg-[#443126] border-[#5c4030] text-[#f5d565] font-bold'
                  : 'bg-[#36261d] hover:bg-[#443126] border-[#4d392d] text-[#fbf2d5]'
              }`}
              title="GitHub Access Token"
            >
              <Key className="w-3 h-3 text-[#f5d565] shrink-0" />
              <span>{githubToken ? 'PAT Active' : 'PAT Token'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Vanilla Cream Background) */}
      <main className="flex-1 flex flex-col min-h-screen bg-[#faf6ef] text-[#2b1d16]">
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Search Hero */}
          <RepoInput
            onAnalyze={handleAnalyzeRepo}
            isLoading={isLoading}
            engine={engine}
            ollamaModel={ollamaModel}
          />

          {/* Progress indicator during analysis */}
          {isLoading && (
            <AnalysisProgress repoName={currentRepoQuery || 'repository'} />
          )}

          {/* Error notification */}
          {errorMessage && !isLoading && (
            <div className="bg-[#fff9f4] border-2 border-[#f5d5c0] rounded-2xl p-5 text-[#9c381c] max-w-2xl mx-auto shadow-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-[#9c381c]">
                <AlertTriangle className="w-4 h-4 text-[#e8b030] shrink-0" />
                <span>Repository Analysis Failed</span>
              </div>
              <p className="text-xs leading-relaxed text-[#685549]">{errorMessage}</p>
              <div className="pt-2 flex gap-3 text-xs font-semibold">
                <button
                  onClick={() => handleAnalyzeRepo('pallets/flask')}
                  className="text-[#3d2a1f] underline hover:text-black font-bold"
                >
                  Load Flask Demo
                </button>
                <button
                  onClick={() => setIsTokenModalOpen(true)}
                  className="text-[#3d2a1f] underline hover:text-black font-bold"
                >
                  Add GitHub Token
                </button>
              </div>
            </div>
          )}

          {/* Results Workspace */}
          {analyzedData && !isLoading && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Repository Info Banner in Crisp White */}
              <div className="bg-white border border-[#e8dfcf] rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#2b1d16] tracking-tight font-mono">
                      {analyzedData.repo.fullName}
                    </h2>
                    <span className="text-xs text-[#1d5372] font-semibold font-mono px-2 py-0.5 rounded-lg bg-[#eaf3f8] border border-[#b7d6e6]">
                      {analyzedData.repo.language}
                    </span>
                    <a
                      href={analyzedData.repo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#3d2a1f] hover:text-[#785611] hover:underline flex items-center gap-1 font-mono font-bold"
                    >
                      <span>GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <p className="text-xs sm:text-sm text-[#685549] max-w-3xl leading-relaxed">
                    {analyzedData.repo.description}
                  </p>

                  {/* Scanned Stats: Powder Blue Observability Information */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-[#eaf3f8] text-[#1d5372] border border-[#b7d6e6] font-semibold">
                      <strong>{analyzedData.repo.stars.toLocaleString()}</strong> stars
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#eaf3f8] text-[#1d5372] border border-[#b7d6e6] font-semibold">
                      <strong>{analyzedData.repo.forks.toLocaleString()}</strong> forks
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#eaf3f8] text-[#1d5372] border border-[#b7d6e6] font-semibold">
                      <strong>{analyzedData.stats.reviewCommentsMined}</strong> review comments mined
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#eaf3f8] text-[#1d5372] border border-[#b7d6e6] font-semibold">
                      <strong>{analyzedData.stats.prsScanned}</strong> merged PRs scanned
                    </span>
                  </div>
                </div>

                {/* Engine Badge & Timestamp */}
                <div className="flex lg:flex-col items-center lg:items-end justify-between gap-1.5 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#f5efe4] text-xs font-mono">
                  <span className="text-[#685549] font-medium">
                    Engine: <strong className="text-[#3d2a1f] font-bold">{analyzedData.aiEngineUsed}</strong>
                  </span>
                  <span className="text-[11px] text-[#9c897c]">
                    Indexed at {new Date(analyzedData.generatedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Primary Navigation Tab Bar (Walnut Brown & Buttercream selected state) */}
              <div className="border-b border-[#e8dfcf] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-[#3d2a1f] text-[#fbf2d5] font-bold shadow-xs'
                          : 'text-[#685549] hover:text-[#2b1d16] hover:bg-white bg-white/60 border border-[#e8dfcf]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {typeof item.count === 'number' && (
                        <span
                          className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                            isActive
                              ? 'bg-[#4e3527] text-[#f5d565] font-bold'
                              : 'bg-[#faf6ef] text-[#685549]'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Tab View */}
              <div className="pt-2">
                {activeTab === 'graph' && analyzedData.moduleGraph && (
                  <CodebaseGraphView
                    graph={analyzedData.moduleGraph}
                    rules={analyzedData.unwrittenRules}
                    repoFullName={analyzedData.repo.fullName}
                    defaultBranch={analyzedData.repo.defaultBranch || 'main'}
                    initialNodeId={initialNavState.nodeId}
                    initialLayoutMode={initialNavState.layoutMode}
                    initialLayerFilter={initialNavState.layerFilter}
                    initialFocusNeighbors={initialNavState.focusNeighbors}
                    onImportGraphData={handleImportGraphData}
                  />
                )}

                {activeTab === 'rules' && (
                  <RulesView
                    rules={analyzedData.unwrittenRules}
                    repoFullName={analyzedData.repo.fullName}
                  />
                )}

                {activeTab === 'mental-map' && (
                  <MentalMapView
                    mentalMap={analyzedData.mentalMap}
                    repoFullName={analyzedData.repo.fullName}
                  />
                )}

                {activeTab === 'survival-guide' && (
                  <SurvivalGuideView
                    pitfalls={analyzedData.rejectionPitfalls}
                    checklist={analyzedData.firstPrChecklist}
                    repoFullName={analyzedData.repo.fullName}
                  />
                )}

                {activeTab === 'skill-export' && (
                  <SkillExportView
                    skillMd={analyzedData.skillMd}
                    cursorRules={analyzedData.cursorRules}
                    repoName={analyzedData.repo.name}
                  />
                )}

                {activeTab === 'diff-linter' && (
                  <PrLinterView
                    rules={analyzedData.unwrittenRules}
                    repoFullName={analyzedData.repo.fullName}
                    engine={engine}
                    ollamaHost={ollamaHost}
                    ollamaModel={ollamaModel}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer in Vanilla Cream & Walnut Brown */}
        <footer className="border-t border-[#e8dfcf] mt-16 py-8 text-center text-xs text-[#685549] bg-white">
          <div className="max-w-7xl mx-auto px-4 space-y-1.5">
            <p className="font-semibold text-[#2b1d16]">
              RepoLore · Mining unwritten repository conventions from GitHub review history into Agent Skills
            </p>
            <p className="text-[11px] text-[#9c897c] font-mono">
              Vanilla Cream, Walnut Brown, Buttercream &amp; Powder Blue theme · Powered by Gemini 3.8 Flash &amp; Ollama
            </p>
          </div>
        </footer>
      </main>

      {/* Modals */}
      <OllamaModal
        isOpen={isOllamaModalOpen}
        onClose={() => setIsOllamaModalOpen(false)}
        ollamaHost={ollamaHost}
        setOllamaHost={setOllamaHost}
        ollamaModel={ollamaModel}
        setOllamaModel={setOllamaModel}
        ollamaConnected={ollamaConnected}
        setOllamaConnected={setOllamaConnected}
      />

      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        token={githubToken}
        setToken={setGithubToken}
      />
    </div>
  );
}
