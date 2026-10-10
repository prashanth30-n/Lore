import React, { useState } from 'react';
import { Search, GitPullRequest, ArrowRight, ShieldCheck, Sparkles, Cpu } from 'lucide-react';
import { PresetRepo } from '../types.ts';

interface RepoInputProps {
  onAnalyze: (repoUrl: string) => void;
  isLoading: boolean;
  engine: 'gemini' | 'ollama';
  ollamaModel: string;
}

const PRESETS: PresetRepo[] = [
  {
    fullName: 'pallets/flask',
    name: 'flask',
    description: 'Python WSGI microframework: strict context handling and backwards compatibility rules.',
    stars: '69.2k',
    language: 'Python',
    icon: '🐍',
  },
  {
    fullName: 'expressjs/express',
    name: 'express',
    description: 'Fast, unopinionated web framework for Node.js: middleware order and prototype rules.',
    stars: '65.8k',
    language: 'JavaScript',
    icon: '⚡',
  },
  {
    fullName: 'tiangolo/fastapi',
    name: 'fastapi',
    description: 'High performance web framework with Pydantic: type annotations and async conventions.',
    stars: '78.5k',
    language: 'Python',
    icon: '🚀',
  },
  {
    fullName: 'gin-gonic/gin',
    name: 'gin',
    description: 'HTTP web framework written in Go: zero allocation and memory benchmark requirements.',
    stars: '79.1k',
    language: 'Go',
    icon: '🐹',
  },
];

export const RepoInput: React.FC<RepoInputProps> = ({
  onAnalyze,
  isLoading,
  engine,
  ollamaModel,
}) => {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;
    onAnalyze(inputVal.trim());
  };

  const handleSelectPreset = (repoName: string) => {
    setInputVal(repoName);
    onAnalyze(repoName);
  };

  return (
    <div className="bg-white border border-[#e8dfcf] rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
      <div className="max-w-3xl mx-auto space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-mono text-[#685549] font-semibold">
          <span className="text-[#3d2a1f] font-bold uppercase tracking-wider">The Insight</span>
          <span className="text-[#d8cdbd]">·</span>
          <span>Open-Source Archaeology</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2b1d16] tracking-tight">
          Turn a project’s code-review history into an Agent Skill
        </h1>

        <p className="text-[#685549] text-xs sm:text-sm leading-relaxed">
          Every mature open-source project has rules that aren’t written down anywhere. They live in thousands of closed pull-request review comments: <em className="text-[#2b1d16] font-medium">&ldquo;we don’t add dependencies for this&rdquo;</em>, <em className="text-[#2b1d16] font-medium">&ldquo;use the logger, not print&rdquo;</em>, <em className="text-[#2b1d16] font-medium">&ldquo;don’t touch the public API without a deprecation.&rdquo;</em> Lore reads a project’s review history, extracts the rules maintainers actually enforce, and packages them as an Agent Skill.
        </p>
      </div>

      {/* Main input search form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="flex items-center bg-[#faf6ef] border-2 border-[#dfd5c2] rounded-2xl p-1.5 focus-within:bg-white focus-within:border-[#3d2a1f] focus-within:ring-4 focus-within:ring-[#3d2a1f]/10 transition-all">
          <div className="pl-3.5 pr-2 text-[#685549]">
            <GitPullRequest className="w-4 h-4 text-[#3d2a1f]" />
          </div>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="e.g. pallets/flask or https://github.com/fastapi/fastapi"
            className="w-full bg-transparent text-[#2b1d16] placeholder-[#9c897c] text-xs sm:text-sm font-mono px-2 py-2 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all whitespace-nowrap shadow-xs ${
              isLoading
                ? 'bg-[#e8dfcf] text-[#9c897c] cursor-not-allowed'
                : 'bg-[#3d2a1f] hover:bg-[#2b1e17] text-[#fbf2d5] active:bg-[#20150e]'
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Mining Lore...</span>
              </>
            ) : (
              <>
                <span>Mine Repository</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Engine status indicator & Buttercream highlights */}
      <div className="flex items-center justify-center gap-2 text-xs text-[#685549] font-mono">
        <span>Engine: <strong className="text-[#2b1d16] font-bold">{engine === 'ollama' ? `Ollama (${ollamaModel})` : 'Gemini 3.8 Flash'}</strong></span>
        <span className="text-[#d8cdbd]">·</span>
        <span className="text-[#785611] font-semibold">Extracts unwritten rules with exact PR citations</span>
      </div>

      {/* Presets */}
      <div className="pt-4 border-t border-[#e8dfcf] max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-[#685549] font-mono mr-1 font-semibold">Curated Repositories:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.fullName}
              onClick={() => handleSelectPreset(preset.fullName)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#faf6ef] hover:bg-[#fbf2d5] hover:text-[#785611] hover:border-[#eed68e] border border-[#dfd5c2] text-xs font-mono text-[#2b1d16] transition-colors font-medium shadow-2xs"
            >
              <span>{preset.icon}</span>
              <span className="font-bold">{preset.fullName}</span>
              <span className="text-[10px] text-[#685549] font-semibold">({preset.stars})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
