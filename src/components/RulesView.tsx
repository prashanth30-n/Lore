import React, { useState } from 'react';
import {
  UnwrittenRule,
  ReviewCitation,
} from '../types.ts';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  ExternalLink,
  MessageSquareQuote,
  Check,
  X,
  Search,
  Filter,
  Copy,
  CheckCheck,
} from 'lucide-react';

interface RulesViewProps {
  rules: UnwrittenRule[];
  repoFullName: string;
}

export const RulesView: React.FC<RulesViewProps> = ({ rules, repoFullName }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Lore' },
    { id: 'dependencies', label: 'Dependencies' },
    { id: 'code_style', label: 'Code Style' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'error_handling', label: 'Error Handling' },
    { id: 'testing', label: 'Testing' },
    { id: 'api_stability', label: 'API Stability' },
    { id: 'git_commits', label: 'Git & Commits' },
  ];

  const filteredRules = rules.filter((rule) => {
    const matchesCategory =
      selectedCategory === 'all' || rule.category === selectedCategory;
    const matchesSeverity =
      selectedSeverity === 'all' || rule.severity === selectedSeverity;
    const matchesSearch =
      searchQuery === '' ||
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.citations.some(
        (c) =>
          c.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.author.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesCategory && matchesSeverity && matchesSearch;
  });

  const handleCopyRule = (rule: UnwrittenRule) => {
    const text = `## Rule: ${rule.title} (${rule.severity.toUpperCase()})\nCategory: ${rule.category}\n\nSummary:\n${rule.summary}\n\nMaintainer Rationale:\n${rule.whyEnforced || 'N/A'}\n\nRejected Pattern:\n${rule.badExample}\n\nApproved Pattern:\n${rule.goodExample}`;
    navigator.clipboard.writeText(text);
    setCopiedId(rule.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white border border-[#e8dfcf] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9c897c] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules by keyword, author, or review quote..."
            className="w-full bg-[#faf6ef] border border-[#dfd5c2] rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-[#2b1d16] placeholder-[#9c897c] focus:outline-none focus:border-[#3d2a1f] focus:bg-white focus:ring-2 focus:ring-[#3d2a1f]/10 transition-all"
          />
        </div>

        {/* Severity Selector */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#685549]">
          <Filter className="w-3.5 h-3.5 text-[#785611]" />
          <span className="font-semibold">Severity:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-[#faf6ef] border border-[#dfd5c2] rounded-xl px-2.5 py-1.5 text-xs text-[#2b1d16] focus:outline-none focus:border-[#3d2a1f] font-medium"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="strict">Strict</option>
            <option value="recommended">Recommended</option>
          </select>
        </div>
      </div>

      {/* Category Segmented Controls (Buttercream Selected State) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => {
          const count =
            cat.id === 'all'
              ? rules.length
              : rules.filter((r) => r.category === cat.id).length;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#fbf2d5] border border-[#eed68e] text-[#785611] font-bold shadow-2xs'
                  : 'bg-white border border-[#e8dfcf] text-[#685549] hover:text-[#2b1d16] hover:bg-[#faf6ef]'
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] opacity-75 font-mono font-semibold">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Metadata Counter */}
      <div className="flex items-center justify-between text-xs text-[#685549] font-mono px-1">
        <span>
          Showing <strong className="text-[#2b1d16]">{filteredRules.length}</strong> of {rules.length} mined maintainer enforcements
        </span>
        <span className="font-semibold">Repository: {repoFullName}</span>
      </div>

      {/* Rules List */}
      {filteredRules.length === 0 ? (
        <div className="bg-white border border-[#e8dfcf] rounded-2xl p-12 text-center text-xs text-[#9c897c] font-mono">
          No rules matched your criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white border border-[#e8dfcf] hover:border-[#eed68e] rounded-2xl p-6 transition-all shadow-xs space-y-4"
            >
              {/* Header: Title, Category, Severity, Copy */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f5efe4]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="font-bold text-[#3d2a1f] uppercase tracking-wider">
                      {rule.category}
                    </span>
                    <span className="text-[#d8cdbd]">·</span>
                    <span
                      className={`font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        rule.severity === 'critical'
                          ? 'bg-[#fdf3ec] text-[#9c381c] border border-[#f5d5c0]'
                          : rule.severity === 'strict'
                          ? 'bg-[#eaf3f8] text-[#1d5372] border border-[#b7d6e6]'
                          : 'bg-[#fbf2d5] text-[#785611] border border-[#eed68e]'
                      }`}
                    >
                      {rule.severity}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#2b1d16] tracking-tight">
                    {rule.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleCopyRule(rule)}
                    className="p-2 rounded-xl hover:bg-[#fbf2d5] text-[#685549] hover:text-[#785611] transition-colors border border-transparent hover:border-[#eed68e]"
                    title="Copy rule"
                  >
                    {copiedId === rule.id ? (
                      <CheckCheck className="w-4 h-4 text-[#785611]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Rule Summary & Maintainer Rationale */}
              <div className="space-y-2.5">
                <p className="text-xs sm:text-sm text-[#2b1d16] leading-relaxed font-normal">
                  {rule.summary}
                </p>

                {rule.whyEnforced && (
                  <div className="bg-[#faf6ef] rounded-xl p-3.5 border border-[#e8dfcf] text-xs text-[#685549] leading-relaxed">
                    <span className="text-[#2b1d16] font-bold block mb-0.5">
                      Maintainer rationale:
                    </span>
                    {rule.whyEnforced}
                  </div>
                )}
              </div>

              {/* Code comparison: Bad vs Good */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* ❌ Rejected Pattern */}
                <div className="bg-[#fff8f5] border border-[#f8d9ce] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#9c381c]">
                    <X className="w-3.5 h-3.5" />
                    <span>Rejected in Code Reviews</span>
                  </div>
                  <pre className="text-xs font-mono text-[#5c1c0e] overflow-x-auto whitespace-pre-wrap bg-white p-3 rounded-lg border border-[#f8d9ce] shadow-2xs">
                    {rule.badExample}
                  </pre>
                </div>

                {/* ✅ Approved Pattern (Buttercream highlight) */}
                <div className="bg-[#fbf2d5]/60 border border-[#eed68e] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#785611]">
                    <Check className="w-3.5 h-3.5" />
                    <span>Expected by Maintainers</span>
                  </div>
                  <pre className="text-xs font-mono text-[#3d2a1f] overflow-x-auto whitespace-pre-wrap bg-white p-3 rounded-lg border border-[#eed68e] shadow-2xs">
                    {rule.goodExample}
                  </pre>
                </div>
              </div>

              {/* Citations from Real PRs */}
              {rule.citations && rule.citations.length > 0 && (
                <div className="pt-2 border-t border-[#f5efe4] space-y-2">
                  <span className="text-[11px] font-mono font-bold text-[#685549] uppercase tracking-wider block">
                    Historical PR Citations ({rule.citations.length}):
                  </span>
                  <div className="space-y-2">
                    {rule.citations.map((c, i) => (
                      <div
                        key={i}
                        className="bg-[#faf6ef] border border-[#e8dfcf] p-3 rounded-xl flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[#685549] font-mono text-[11px]">
                            <MessageSquareQuote className="w-3.5 h-3.5 text-[#1d5372] shrink-0" />
                            <span className="font-bold text-[#2b1d16]">@{c.author}</span>
                            <span>on</span>
                            <span className="font-semibold text-[#3d2a1f]">PR #{c.prNumber}: &ldquo;{c.prTitle}&rdquo;</span>
                          </div>
                          <p className="text-[#685549] italic text-xs pl-5 font-serif">
                            &ldquo;{c.comment}&rdquo;
                          </p>
                        </div>

                        {c.link && (
                          <a
                            href={c.link}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-white border border-[#dfd5c2] text-[#3d2a1f] hover:text-[#785611] hover:bg-[#fbf2d5] transition-colors shrink-0"
                            title="View comment on GitHub"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
