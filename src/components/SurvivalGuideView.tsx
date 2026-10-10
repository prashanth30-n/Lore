import React, { useState } from 'react';
import { RejectionPitfall } from '../types.ts';
import { AlertOctagon, CheckSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface SurvivalGuideViewProps {
  pitfalls: RejectionPitfall[];
  checklist: string[];
  repoFullName: string;
}

export const SurvivalGuideView: React.FC<SurvivalGuideViewProps> = ({
  pitfalls,
  checklist,
  repoFullName,
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const isAllChecked = checklist.length > 0 && completedCount === checklist.length;

  return (
    <div className="space-y-8">
      {/* Top PR Rejection Traps */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[#785611] font-bold text-sm">
          <AlertOctagon className="w-4 h-4 text-[#e8b030]" />
          <span>Top PR Rejection Pitfalls</span>
        </div>
        <p className="text-xs text-[#685549]">
          The most frequent reasons maintainers reject or stall PRs in {repoFullName}:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pitfalls.map((pitfall, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#e8dfcf] rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-[#eed68e] transition-all shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#fbf2d5] border border-[#eed68e] text-[#785611] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-bold text-[#2b1d16] leading-snug">
                    {pitfall.title}
                  </h4>
                </div>

                <p className="text-xs text-[#685549] leading-relaxed pl-7">
                  {pitfall.description}
                </p>
              </div>

              {/* Buttercream Prevention */}
              <div className="bg-[#fbf2d5]/60 rounded-xl p-3 border border-[#eed68e] text-xs text-[#785611] leading-relaxed">
                <span className="font-bold text-[#3d2a1f] block mb-1">
                  💡 How to avoid:
                </span>
                {pitfall.prevention}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* First PR Checklist */}
      <div className="bg-white border border-[#e8dfcf] rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f5efe4]">
          <div>
            <div className="flex items-center gap-2 text-[#3d2a1f] font-bold text-sm">
              <CheckSquare className="w-4 h-4 text-[#785611]" />
              <span>Pre-Flight PR Checklist</span>
            </div>
            <h3 className="text-lg font-bold text-[#2b1d16] mt-1">
              Checklist for Getting Your First PR Merged in {repoFullName}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#685549] font-semibold">
              {completedCount} of {checklist.length} completed
            </span>
            <div className="w-24 h-2 bg-[#e8dfcf] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#785611] transition-all duration-300"
                style={{
                  width: `${checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {isAllChecked && (
          <div className="bg-[#fbf2d5] border border-[#eed68e] rounded-xl p-4 flex items-center gap-3 text-[#785611] text-xs font-mono">
            <CheckCircle2 className="w-5 h-5 text-[#785611] shrink-0" />
            <div>
              <span className="font-bold block">All pre-flight checks satisfied!</span>
              <span>Your patch complies with repository unwritten rules. Ready to open PR.</span>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {checklist.map((item, idx) => {
            const isChecked = !!checkedItems[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleCheck(idx)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                  isChecked
                    ? 'bg-[#fbf2d5] border-[#eed68e] text-[#785611]'
                    : 'bg-[#faf6ef] border-[#e8dfcf] text-[#2b1d16] hover:bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-[#3d2a1f] border-[#dfd5c2] focus:ring-[#3d2a1f] accent-[#3d2a1f]"
                />
                <span
                  className={`text-xs leading-relaxed ${
                    isChecked ? 'line-through opacity-85 font-medium' : 'font-medium'
                  }`}
                >
                  {item}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
