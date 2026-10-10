import React, { useState } from 'react';
import { Copy, Download, CheckCheck, FileText, Bot, Sparkles, Terminal } from 'lucide-react';

interface SkillExportViewProps {
  skillMd: string;
  cursorRules: string;
  repoName: string;
}

export const SkillExportView: React.FC<SkillExportViewProps> = ({
  skillMd,
  cursorRules,
  repoName,
}) => {
  const [activeTab, setActiveTab] = useState<'skill' | 'cursor'>('skill');
  const [copied, setCopied] = useState(false);

  const activeContent = activeTab === 'skill' ? skillMd : cursorRules;
  const fileName = activeTab === 'skill' ? `${repoName}-lore-SKILL.md` : '.cursorrules';

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Intro card in crisp White */}
      <div className="bg-white border border-[#e8dfcf] rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#3d2a1f] font-bold text-xs tracking-wider uppercase">
              <Bot className="w-4 h-4 text-[#785611]" />
              <span>Agent Skill Artifact</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#2b1d16] tracking-tight">
              Export Lore for AI Coding Agents
            </h3>
            <p className="text-xs text-[#685549] leading-relaxed max-w-2xl">
              Equip Claude Code, Cursor, Windsurf, GitHub Copilot, or Google AI Studio with the unwritten rules and review history of this codebase so they never generate rejected PRs.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#faf6ef] hover:bg-[#fbf2d5] text-xs font-bold text-[#2b1d16] border border-[#dfd5c2] hover:border-[#eed68e] transition-all shadow-2xs"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-4 h-4 text-[#785611]" />
                  <span className="text-[#785611]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#685549]" />
                  <span>Copy Content</span>
                </>
              )}
            </button>

            {/* Walnut Brown Primary Action Button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3d2a1f] hover:bg-[#2b1e17] text-xs font-bold text-[#fbf2d5] transition-all shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download {fileName}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[#e8dfcf] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('skill')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'skill'
                ? 'bg-[#fbf2d5] border border-[#eed68e] text-[#785611] font-bold shadow-2xs'
                : 'text-[#685549] hover:text-[#2b1d16] bg-white border border-[#e8dfcf] hover:bg-[#faf6ef]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#e8b030]" />
            <span>Agent Skill (SKILL.md)</span>
          </button>

          <button
            onClick={() => setActiveTab('cursor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'cursor'
                ? 'bg-[#fbf2d5] border border-[#eed68e] text-[#785611] font-bold shadow-2xs'
                : 'text-[#685549] hover:text-[#2b1d16] bg-white border border-[#e8dfcf] hover:bg-[#faf6ef]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-[#1d5372]" />
            <span>Cursor Rules (.cursorrules)</span>
          </button>
        </div>

        <span className="text-xs font-mono text-[#685549] font-semibold hidden sm:inline">
          Format: {activeTab === 'skill' ? 'YAML Frontmatter + Markdown' : 'System Prompt Text'}
        </span>
      </div>

      {/* Code Editor / Preview Box */}
      <div className="bg-white border border-[#e8dfcf] rounded-2xl overflow-hidden shadow-xs">
        <div className="bg-[#faf6ef] px-4 py-2.5 border-b border-[#e8dfcf] flex items-center justify-between text-xs font-mono text-[#685549]">
          <span className="font-bold text-[#2b1d16] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#785611]" />
            <span>{fileName}</span>
          </span>
          <span>{activeContent.split('\n').length} lines · UTF-8</span>
        </div>

        <pre className="p-5 font-mono text-xs text-[#2b1d16] overflow-x-auto whitespace-pre leading-relaxed max-h-[560px] scrollbar-thin">
          {activeContent}
        </pre>
      </div>
    </div>
  );
};
