import React, { useEffect, useState } from 'react';
import { GitPullRequest, MessageSquareCode, FileCode, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface AnalysisProgressProps {
  repoName: string;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ repoName }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Connecting to GitHub API',
      detail: `Fetching ${repoName} commits, merged PRs & closed issues...`,
      icon: GitPullRequest,
    },
    {
      title: 'Mining Review Comments & Discussions',
      detail: 'Extracting maintainer rejection feedback and code comments...',
      icon: MessageSquareCode,
    },
    {
      title: 'Clustering Unwritten Rules & Lore',
      detail: 'Detecting recurring patterns: dependencies, logging, backwards compat...',
      icon: FileCode,
    },
    {
      title: 'Synthesizing Agent Skill & Citations',
      detail: 'Compiling SKILL.md, .cursorrules & citation evidence links...',
      icon: Sparkles,
    },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(1), 1200);
    const timer2 = setTimeout(() => setCurrentStep(2), 2600);
    const timer3 = setTimeout(() => setCurrentStep(3), 4200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="bg-white border border-[#e8dfcf] rounded-2xl p-6 sm:p-7 shadow-xs max-w-2xl mx-auto my-8 space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-[#e8dfcf]">
        <div>
          <h3 className="font-bold text-[#2b1d16] text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e8b030] animate-ping" />
            <span>Archaeologist Agent Mining Lore</span>
          </h3>
          <p className="text-xs text-[#685549] mt-0.5 font-mono">
            Scanning review history from <span className="font-bold text-[#3d2a1f]">{repoName}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#785611] font-mono bg-[#fbf2d5] px-3 py-1.5 rounded-xl border border-[#eed68e] font-semibold">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#785611]" />
          <span>Processing</span>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-[#eaf3f8] border-[#b7d6e6] shadow-2xs'
                  : isDone
                  ? 'bg-[#fbf2d5]/60 border-[#eed68e] opacity-95'
                  : 'bg-[#faf6ef] border-[#e8dfcf] opacity-50'
              }`}
            >
              <div className="mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-[#785611]" />
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#1d5372] border-t-transparent animate-spin" />
                ) : (
                  <Icon className="w-5 h-5 text-[#9c897c]" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-semibold ${isCurrent ? 'text-[#1d5372] font-bold' : isDone ? 'text-[#785611]' : 'text-[#9c897c]'}`}>
                    {step.title}
                  </h4>
                  {isCurrent && (
                    <span className="text-[10px] text-[#1d5372] font-mono uppercase tracking-widest font-bold">In Progress</span>
                  )}
                  {isDone && (
                    <span className="text-[10px] text-[#785611] font-mono uppercase tracking-widest font-bold">Complete</span>
                  )}
                </div>
                <p className="text-xs text-[#685549] mt-0.5 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
