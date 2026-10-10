import React from 'react';
import { CodebaseMentalMap } from '../types.ts';
import { Compass, FolderGit2, Lightbulb, GitBranch } from 'lucide-react';

interface MentalMapViewProps {
  mentalMap: CodebaseMentalMap;
  repoFullName: string;
}

export const MentalMapView: React.FC<MentalMapViewProps> = ({
  mentalMap,
  repoFullName,
}) => {
  return (
    <div className="space-y-6">
      {/* Overview & Core Philosophy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Architectural Overview */}
        <div className="lg:col-span-2 bg-white border border-[#e8dfcf] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#3d2a1f] font-bold text-sm">
            <Compass className="w-4 h-4 text-[#785611]" />
            <span>Architecture &amp; Mental Model</span>
          </div>

          <h2 className="text-xl font-bold text-[#2b1d16] tracking-tight">
            How {repoFullName} is structured
          </h2>

          <p className="text-sm text-[#685549] leading-relaxed">
            {mentalMap.overview}
          </p>

          {/* Powder Blue Observability & Runtime Dynamics */}
          <div className="bg-[#eaf3f8] rounded-xl p-4 border border-[#b7d6e6] text-xs text-[#1d5372] space-y-2 leading-relaxed">
            <div className="font-bold text-[#1d5372] flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-[#3882a8]" />
              <span>Architectural Dynamics &amp; Core Runtime Info</span>
            </div>
            <p className="text-[#1d5372]/90">{mentalMap.architectureSummary}</p>
          </div>
        </div>

        {/* Maintainer Philosophy (Buttercream Signals) */}
        <div className="bg-white border border-[#e8dfcf] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#785611] font-bold text-sm">
            <Lightbulb className="w-4 h-4 text-[#e8b030]" />
            <span>Maintainer Philosophy</span>
          </div>

          <h3 className="text-base font-bold text-[#2b1d16] tracking-tight">
            Core Beliefs of Maintainers
          </h3>

          <p className="text-xs text-[#685549]">
            Rules that guide decisions on PR acceptance:
          </p>

          <div className="space-y-2.5">
            {mentalMap.maintainerPhilosophy.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-[#fbf2d5] border border-[#eed68e] text-xs text-[#785611]"
              >
                <span className="w-4 h-4 rounded-full bg-[#eed68e] text-[#785611] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Directory Mental Map Table */}
      <div className="bg-white border border-[#e8dfcf] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2.5 text-[#3d2a1f] font-bold text-sm mb-4">
          <FolderGit2 className="w-4 h-4 text-[#785611]" />
          <span>Core Directory Mental Map</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e8dfcf] text-xs uppercase tracking-wider text-[#685549] font-mono">
                <th className="py-3 px-4 font-bold">Directory Path</th>
                <th className="py-3 px-4 font-bold">Purpose &amp; Conventions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5efe4] text-sm">
              {mentalMap.coreDirectories.map((dir, idx) => (
                <tr key={idx} className="hover:bg-[#faf6ef] transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-[#1d5372] font-bold whitespace-nowrap">
                    {dir.path}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#685549] leading-relaxed">
                    {dir.purpose}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
