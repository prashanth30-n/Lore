import React from 'react';
import { Sparkles, Terminal, Key, Cpu, Compass, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  engine: 'gemini' | 'ollama';
  setEngine: (engine: 'gemini' | 'ollama') => void;
  ollamaHost: string;
  ollamaModel: string;
  ollamaConnected: boolean | null;
  onOpenOllamaModal: () => void;
  onOpenTokenModal: () => void;
  hasGithubToken: boolean;
  isReady?: boolean;
  repoFullName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  engine,
  setEngine,
  ollamaModel,
  ollamaConnected,
  onOpenOllamaModal,
  onOpenTokenModal,
  hasGithubToken,
  isReady = true,
  repoFullName,
}) => {
  return (
    <header className="border-b border-[#e8dfcf] bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Analysis Ready Indicator */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#3d2a1f] flex items-center justify-center text-white shadow-xs">
            <Compass className="w-5 h-5 text-[#f5d565]" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-lg text-[#2b1d16] tracking-tight font-mono">
              RepoLore
            </span>
            <span className="hidden sm:inline text-[#d8cdbd] text-sm">/</span>
            <span className="hidden sm:inline text-xs text-[#685549] font-mono font-medium">
              Codebase Lore &amp; Agent Skills
            </span>
          </div>

          {/* Buttercream "Analysis ready" indicator */}
          <div className="hidden md:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-[#fbf2d5] border border-[#eed68e] text-[#785611] text-[11px] font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-[#f1be42] animate-pulse" />
            <span>{isReady ? 'Analysis ready' : 'Mining codebase...'}</span>
          </div>
        </div>

        {/* Engine switcher & controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Segmented Model Switch (Walnut Brown & Buttercream accents) */}
          <div className="flex items-center bg-[#faf6ef] p-0.5 rounded-xl border border-[#dfd5c2] text-xs font-mono">
            <button
              onClick={() => setEngine('gemini')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                engine === 'gemini'
                  ? 'bg-white text-[#3d2a1f] font-bold shadow-xs border border-[#dfd5c2]'
                  : 'text-[#685549] hover:text-[#2b1d16]'
              }`}
              title="Cloud Gemini 3.8 Flash (Instant)"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#e8b030]" />
              <span>Gemini 3.8</span>
            </button>

            <button
              onClick={() => setEngine('ollama')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                engine === 'ollama'
                  ? 'bg-white text-[#3d2a1f] font-bold shadow-xs border border-[#dfd5c2]'
                  : 'text-[#685549] hover:text-[#2b1d16]'
              }`}
              title="Local Ollama Open-Weights (e.g. qwen2.5-coder, llama3)"
            >
              <Cpu className="w-3.5 h-3.5 text-[#e8b030]" />
              <span>Ollama</span>
              {ollamaConnected === true && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#f1be42]" />
              )}
            </button>
          </div>

          {/* Buttercream Ollama Config button */}
          <button
            onClick={onOpenOllamaModal}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
              engine === 'ollama'
                ? 'bg-[#fbf2d5] border-[#eed68e] text-[#785611] hover:bg-[#faebd0] font-bold'
                : 'bg-white border-[#dfd5c2] text-[#685549] hover:bg-[#faf6ef] hover:text-[#2b1d16] font-semibold'
            }`}
            title="Configure Ollama model & endpoint"
          >
            <Terminal className="w-3.5 h-3.5 text-[#785611]" />
            <span className="hidden md:inline text-[11px] max-w-[110px] truncate">
              {engine === 'ollama' ? ollamaModel : 'Model Config'}
            </span>
          </button>

          {/* GitHub Token trigger button with Buttercream active status */}
          <button
            onClick={onOpenTokenModal}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
              hasGithubToken
                ? 'bg-[#fbf2d5] border-[#eed68e] text-[#785611] font-bold'
                : 'bg-white border-[#dfd5c2] text-[#685549] hover:bg-[#faf6ef] hover:text-[#2b1d16] font-semibold'
            }`}
            title="GitHub Personal Access Token"
          >
            <Key className="w-3.5 h-3.5 text-[#785611]" />
            <span className="hidden lg:inline text-[11px]">
              {hasGithubToken ? 'PAT Active' : 'GitHub Token'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
