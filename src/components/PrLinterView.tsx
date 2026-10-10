import React, { useState } from 'react';
import { UnwrittenRule, DiffLintResult } from '../types.ts';
import {
  GitCommit,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Code2,
} from 'lucide-react';

interface PrLinterViewProps {
  rules: UnwrittenRule[];
  repoFullName: string;
  engine: 'gemini' | 'ollama';
  ollamaHost: string;
  ollamaModel: string;
}

const SAMPLE_BAD_DIFF = `diff --git a/src/flask/helpers.py b/src/flask/helpers.py
index a12bc3..8f9e01 100644
--- a/src/flask/helpers.py
+++ b/src/flask/helpers.py
@@ -10,6 +10,7 @@
 import os
 import sys
+import external_utils_lib  # Added new third party helper
 
 def stream_with_context(generator_or_function):
+    print("Starting stream context generation")  # debug print
+    result = external_utils_lib.wrap_stream(generator_or_function)
     return result
`;

const SAMPLE_GOOD_DIFF = `diff --git a/src/flask/helpers.py b/src/flask/helpers.py
index a12bc3..8f9e01 100644
--- a/src/flask/helpers.py
+++ b/src/flask/helpers.py
@@ -14,6 +14,8 @@ from .globals import current_app
 
 def stream_with_context(generator_or_function):
+    current_app.logger.debug("Initializing stream context generator")
     return _StreamWithContext(generator_or_function)
 
diff --git a/tests/test_helpers.py b/tests/test_helpers.py
new file mode 100644
--- /dev/null
+++ b/tests/test_helpers.py
@@ -0,0 +1,6 @@
+def test_stream_context_regression(app):
+    with app.test_request_context():
+        gen = stream_with_context(lambda: ["data"])
+        assert list(gen()) == ["data"]
`;

export const PrLinterView: React.FC<PrLinterViewProps> = ({
  rules,
  repoFullName,
  engine,
  ollamaHost,
  ollamaModel,
}) => {
  const [diffText, setDiffText] = useState(SAMPLE_BAD_DIFF);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lintResult, setLintResult] = useState<DiffLintResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEvaluate = async () => {
    if (!diffText.trim() || isEvaluating) return;
    setIsEvaluating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/check-diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diffText,
          rules,
          engine,
          ollamaHost,
          ollamaModel,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to audit diff against lore.');
      }

      const data = await res.json();
      setLintResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while auditing diff.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro in crisp White */}
      <div className="bg-white border border-[#e8dfcf] rounded-2xl p-6 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-[#3d2a1f] font-bold text-xs uppercase tracking-wider">
          <Code2 className="w-4 h-4 text-[#785611]" />
          <span>Pre-Flight PR Linter</span>
        </div>
        <h3 className="text-xl font-extrabold text-[#2b1d16] tracking-tight">
          Test Your Diff Against {repoFullName} Lore
        </h3>
        <p className="text-xs text-[#685549] leading-relaxed max-w-3xl">
          Paste your candidate pull request diff or code changes below. The Lore Reviewer will audit your code against all {rules.length} mined unwritten rules before maintainers ever see it.
        </p>
      </div>

      {/* Editor & Actions */}
      <div className="bg-white border border-[#e8dfcf] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f5efe4]">
          <span className="text-xs font-mono text-[#2b1d16] font-bold flex items-center gap-1.5">
            <GitCommit className="w-4 h-4 text-[#3d2a1f]" />
            <span>Proposed Git Diff / Code Patch</span>
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#685549] font-semibold mr-1">Load sample:</span>
            <button
              onClick={() => setDiffText(SAMPLE_BAD_DIFF)}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-[#fff8f5] text-[#9c381c] hover:bg-[#faeae0] border border-[#f8d9ce] transition-colors font-bold"
            >
              ❌ Violating Diff
            </button>
            <button
              onClick={() => setDiffText(SAMPLE_GOOD_DIFF)}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-[#fbf2d5] text-[#785611] hover:bg-[#faebd0] border border-[#eed68e] transition-colors font-bold"
            >
              ✅ Compliant Diff
            </button>
          </div>
        </div>

        <textarea
          value={diffText}
          onChange={(e) => setDiffText(e.target.value)}
          rows={10}
          placeholder="Paste git diff here..."
          className="w-full bg-[#faf6ef] border-2 border-[#dfd5c2] focus:border-[#3d2a1f] rounded-2xl p-4 font-mono text-xs text-[#2b1d16] placeholder-[#9c897c] focus:outline-none focus:ring-4 focus:ring-[#3d2a1f]/10 leading-relaxed resize-y"
        />

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-[#685549] font-mono font-medium">
            Checking against {rules.length} unwritten rules via {engine === 'ollama' ? `Ollama (${ollamaModel})` : 'Gemini 3.8 Flash'}
          </span>

          {/* Walnut Brown Primary Action Button */}
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating || !diffText.trim()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold font-mono text-[#fbf2d5] transition-all shadow-xs ${
              isEvaluating || !diffText.trim()
                ? 'bg-[#e8dfcf] text-[#9c897c] cursor-not-allowed'
                : 'bg-[#3d2a1f] hover:bg-[#2b1e17] active:bg-[#20150e]'
            }`}
          >
            {isEvaluating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#fbf2d5]/20 border-t-[#fbf2d5] rounded-full animate-spin" />
                <span>Auditing Diff...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Lore Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-[#fff9f4] border border-[#f5d5c0] rounded-2xl p-4 text-xs text-[#9c381c] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#9c381c] shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Audit Report Results */}
      {lintResult && (
        <div className="bg-white border border-[#e8dfcf] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f5efe4]">
            <div>
              <div className="flex items-center gap-2">
                {lintResult.status === 'passed' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fbf2d5] text-[#785611] border border-[#eed68e]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#785611]" />
                    Passed Lore Audit
                  </span>
                ) : lintResult.status === 'warning' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fdf3ec] text-[#9c381c] border border-[#f5d5c0]">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#e8b030]" />
                    Warning: Maintainer Feedback Expected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fff8f5] text-[#9c381c] border border-[#f8d9ce]">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#9c381c]" />
                    Failed: Will Be Rejected in Review
                  </span>
                )}
              </div>
              <p className="text-sm text-[#2b1d16] mt-2 font-medium">
                {lintResult.summary}
              </p>
            </div>

            {/* Powder Blue Score Module */}
            <div className="bg-[#eaf3f8] px-5 py-3 rounded-2xl border border-[#b7d6e6] text-center shrink-0">
              <span className="text-[10px] text-[#1d5372] uppercase tracking-wider block font-bold">
                Merge Readiness Score
              </span>
              <span
                className={`text-2xl font-black font-mono ${
                  lintResult.score >= 85
                    ? 'text-[#785611]'
                    : lintResult.score >= 60
                    ? 'text-[#e8b030]'
                    : 'text-[#9c381c]'
                }`}
              >
                {lintResult.score}%
              </span>
            </div>
          </div>

          {/* Violations List */}
          {lintResult.violations.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#9c381c] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#e8b030]" />
                <span>Violated Unwritten Rules ({lintResult.violations.length})</span>
              </h4>

              <div className="space-y-3">
                {lintResult.violations.map((v, i) => (
                  <div
                    key={i}
                    className="bg-[#fff9f4] border border-[#f5d5c0] rounded-xl p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#2b1d16]">
                        {v.ruleTitle}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#f5d5c0] text-[#9c381c]">
                        {v.severity}
                      </span>
                    </div>

                    <p className="text-xs text-[#685549] leading-relaxed">
                      {v.issue}
                    </p>

                    <div className="bg-white rounded-xl p-3 text-xs text-[#3d2a1f] font-mono border border-[#eed68e] shadow-2xs">
                      <strong className="text-[#2b1d16] block mb-1">
                        Recommended Fix:
                      </strong>
                      {v.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#fbf2d5] border border-[#eed68e] rounded-xl p-4 text-xs text-[#785611] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#785611] shrink-0" />
              <span className="font-semibold">Zero rule violations detected! Your diff complies with all maintainer conventions.</span>
            </div>
          )}

          {/* Praise */}
          {lintResult.praise && lintResult.praise.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#f5efe4]">
              <h4 className="text-xs font-bold text-[#785611] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#e8b030]" />
                <span>Approved Practices Observed</span>
              </h4>
              <ul className="space-y-1 text-xs text-[#685549]">
                {lintResult.praise.map((p, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e8b030]" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
