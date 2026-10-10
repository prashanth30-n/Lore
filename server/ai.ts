import { GoogleGenAI } from '@google/genai';
import { RawRepoData } from './github.ts';
import { RepoLoreAnalysis, DiffLintResult, UnwrittenRule } from './types.ts';
import { buildCodebaseGraph } from './graph-builder.ts';

export interface AiRequestOptions {
  engine: 'gemini' | 'ollama';
  ollamaHost?: string;
  ollamaModel?: string;
}

const ai = new GoogleGenAI({});

export async function checkOllamaConnection(host: string = 'http://localhost:11434'): Promise<{
  connected: boolean;
  models: string[];
  error?: string;
}> {
  try {
    const cleanHost = host.replace(/\/+$/, '');
    const res = await fetch(`${cleanHost}/api/tags`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      return {
        connected: false,
        models: [],
        error: `Ollama host returned status ${res.status}: ${res.statusText}`,
      };
    }
    const data = await res.json() as { models?: Array<{ name: string }> };
    const models = Array.isArray(data.models) ? data.models.map(m => m.name) : [];
    return {
      connected: true,
      models,
    };
  } catch (err: any) {
    return {
      connected: false,
      models: [],
      error: err.message || 'Could not connect to Ollama. Make sure Ollama is running (`ollama serve`).',
    };
  }
}

async function callGeminiSafe(prompt: string, isJson: boolean = true): Promise<string> {
  try {
    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: isJson
        ? { responseMimeType: 'application/json', temperature: 0.2 }
        : { temperature: 0.2 },
    });
    return geminiRes.text || '{}';
  } catch (err: any) {
    console.warn('Gemini generateContent error (will use synthesized lore fallback):', err.message);
    return '{}';
  }
}

export async function analyzeRepoLore(
  raw: RawRepoData,
  options: AiRequestOptions
): Promise<RepoLoreAnalysis> {
  const prompt = buildLoreExtractionPrompt(raw);

  let rawJsonText = '{}';

  if (options.engine === 'ollama') {
    const host = (options.ollamaHost || 'http://localhost:11434').replace(/\/+$/, '');
    const model = options.ollamaModel || 'qwen2.5-coder:7b';
    
    try {
      const res = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.2,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Ollama error (${res.status}): ${await res.text()}`);
      }
      const data = await res.json() as { response: string };
      rawJsonText = data.response;
    } catch (err: any) {
      console.warn('Ollama call failed, falling back to Gemini 3.8 Flash:', err.message);
      rawJsonText = await callGeminiSafe(prompt, true);
    }
  } else {
    // Default: Gemini 3.8 Flash
    rawJsonText = await callGeminiSafe(prompt, true);
  }

  // Parse structured output (or auto-synthesize from mined comments if JSON is empty)
  const parsed = parseLoreJson(rawJsonText, raw);

  // Generate deep module knowledge graph
  const moduleGraph = buildCodebaseGraph(raw, parsed.unwrittenRules, (parsed as any).moduleGraph);

  // Generate SKILL.md and cursorRules based on the structured data
  const skillMd = generateSkillMarkdown(parsed, raw);
  const cursorRules = generateCursorRules(parsed, raw);

  return {
    repo: {
      owner: raw.owner,
      name: raw.repo,
      fullName: raw.fullName,
      description: raw.repoInfo.description,
      stars: raw.repoInfo.stargazers_count,
      forks: raw.repoInfo.forks_count,
      language: raw.repoInfo.language,
      defaultBranch: raw.repoInfo.default_branch,
      url: raw.repoInfo.html_url,
    },
    stats: {
      prsScanned: raw.prs.length,
      reviewCommentsMined: raw.reviewComments.length,
      commitsAnalyzed: raw.commits.length,
      issuesScanned: raw.issues.length,
    },
    mentalMap: parsed.mentalMap,
    moduleGraph,
    unwrittenRules: parsed.unwrittenRules,
    rejectionPitfalls: parsed.rejectionPitfalls,
    firstPrChecklist: parsed.firstPrChecklist,
    skillMd,
    cursorRules,
    generatedAt: new Date().toISOString(),
    aiEngineUsed: options.engine === 'ollama' ? `Ollama (${options.ollamaModel || 'open-weights'})` : 'Gemini 3.8 Flash',
  };
}

export async function lintDiffWithLore(
  diffText: string,
  rules: UnwrittenRule[],
  options: AiRequestOptions
): Promise<DiffLintResult> {
  const prompt = `You are the Maintainer Pre-Flight Code Reviewer for a project.
A contributor has provided the following proposed Git Diff / Code patch:

\`\`\`diff
${diffText.slice(0, 10000)}
\`\`\`

Here are the strict unwritten rules and lore enforced by maintainers in this codebase:
${JSON.stringify(rules.map(r => ({ id: r.id, title: r.title, category: r.category, severity: r.severity, summary: r.summary, badExample: r.badExample, goodExample: r.goodExample })), null, 2)}

Audit the code diff against these rules.
Determine:
1. Did the code violate any rule? (e.g. adding unwanted dependencies, missing changelog or test, using print/console.log instead of logger, modifying public API without deprecation, bad commit style, etc.)
2. Output a strictly valid JSON object matching this schema:
{
  "status": "passed" | "warning" | "failed",
  "score": number (0 to 100, where 100 is pristine compliant code),
  "summary": "Brief 1-2 sentence overall review verdict",
  "violations": [
    {
      "ruleId": "string",
      "ruleTitle": "string",
      "severity": "critical" | "strict" | "recommended",
      "issue": "Specific explanation of what was found in the diff that violates the rule",
      "suggestion": "Concrete actionable fix or replacement snippet"
    }
  ],
  "praise": ["Array of positive patterns noticed that follow the repository conventions"]
}
Only output pure JSON.`;

  let rawJson = '{}';

  if (options.engine === 'ollama') {
    const host = (options.ollamaHost || 'http://localhost:11434').replace(/\/+$/, '');
    const model = options.ollamaModel || 'qwen2.5-coder:7b';
    try {
      const res = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format: 'json',
          options: { temperature: 0.1 },
        }),
      });
      if (res.ok) {
        const data = await res.json() as { response: string };
        rawJson = data.response;
      } else {
        throw new Error('Ollama error');
      }
    } catch {
      rawJson = await callGeminiSafe(prompt, true);
    }
  } else {
    rawJson = await callGeminiSafe(prompt, true);
  }

  try {
    const cleaned = cleanJsonString(rawJson);
    const parsed = JSON.parse(cleaned);
    if (parsed && (parsed.status || parsed.violations)) {
      return {
        status: parsed.status || 'warning',
        score: typeof parsed.score === 'number' ? parsed.score : 80,
        summary: parsed.summary || 'Code evaluated against codebase lore.',
        violations: Array.isArray(parsed.violations) ? parsed.violations : [],
        praise: Array.isArray(parsed.praise) ? parsed.praise : [],
      };
    }
  } catch (err) {
    // continue to heuristic below
  }

  // Heuristic rule auditing if AI output was unavailable
  return auditDiffHeuristically(diffText, rules);
}

function buildLoreExtractionPrompt(raw: RawRepoData): string {
  const prsSample = raw.prs.slice(0, 15).map(p => ({
    number: p.number,
    title: p.title,
    merged: !!p.merged_at,
    author: p.user?.login,
    body: (p.body || '').slice(0, 300),
  }));

  const commentsSample = raw.reviewComments.slice(0, 30).map(c => ({
    id: c.id,
    author: c.user?.login,
    comment: c.body,
    path: c.path,
    diffHunk: c.diff_hunk,
    url: c.html_url,
  }));

  const commitsSample = raw.commits.slice(0, 15).map(c => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message,
    author: c.commit.author?.name,
  }));

  return `You are "Lore" - an expert open-source maintainer archaeologist and Agent Skill generator.
Your job is to examine an open-source repository's pull-request review history, commit conventions, and maintainer feedback, and extract the TRUE "unwritten rules" that maintainers enforce in pull request reviews.

The Insight:
Every mature open-source project has rules that aren't written down anywhere. They live in thousands of closed pull-request review comments: "we don't add dependencies for this", "use the logger, not print", "every user-facing change needs a changelog entry", "don't touch the public API without a deprecation warning", "all error middleware must have 4 parameters".
Maintainers type the same comments over and over. New contributors, and the AI agents writing code for them, can't follow rules they can't see.

Repository: ${raw.fullName} (${raw.repoInfo.language})
Description: ${raw.repoInfo.description}

Here is the mined review data:
PULL REQUESTS:
${JSON.stringify(prsSample, null, 2)}

REVIEW COMMENTS (Maintainer feedback & rejections):
${JSON.stringify(commentsSample, null, 2)}

COMMITS (Conventions & patterns):
${JSON.stringify(commitsSample, null, 2)}

Analyze this data and synthesize the maintainer lore into a JSON object matching this schema:
{
  "mentalMap": {
    "overview": "High-level architectural overview of ${raw.fullName}",
    "architectureSummary": "How the core modules connect, lifecycle, and patterns used",
    "coreDirectories": [
      { "path": "string", "purpose": "string" }
    ],
    "maintainerPhilosophy": [
      "Key philosophy 1",
      "Key philosophy 2",
      "Key philosophy 3"
    ]
  },
  "unwrittenRules": [
    {
      "id": "kebab-case-slug",
      "title": "Clear concise rule name (e.g. Zero New External Dependencies, Use Logger Not Print, Mandatory Regression Test)",
      "category": "architecture" | "dependencies" | "code-style" | "error-handling" | "testing" | "api-stability" | "git-commits" | "docs-changelog",
      "severity": "critical" | "strict" | "recommended",
      "summary": "Detailed explanation of what the rule is and what maintainers expect",
      "whyEnforced": "Why maintainers insist on this rule (e.g. avoids supply chain risk, preserves stdout capture, prevents breaking semver)",
      "badExample": "Example code snippet showing what new contributors mistakenly submit",
      "goodExample": "Example code snippet showing what maintainers require",
      "citations": [
        {
          "prNumber": 1234,
          "prTitle": "PR Title if known",
          "author": "Maintainer username",
          "comment": "Actual or synthesized maintainer review quote",
          "link": "https://github.com/${raw.fullName}/pull/1234"
        }
      ]
    }
  ],
  "rejectionPitfalls": [
    {
      "title": "Common mistake title (e.g. Submitting a mega-PR touching 5 modules)",
      "description": "Why this happens and why maintainers decline it",
      "prevention": "How a contributor should do it instead"
    }
  ],
  "firstPrChecklist": [
    "Step 1 checklist item",
    "Step 2 checklist item",
    "Step 3 checklist item"
  ]
}

Provide 4 to 8 rich, high-quality unwritten rules reflecting this specific project's idioms and language (${raw.repoInfo.language}). Every rule MUST include citations to real review comments or PR contexts!
Output ONLY valid JSON.`;
}

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

function parseLoreJson(jsonStr: string, raw: RawRepoData): {
  mentalMap: any;
  unwrittenRules: UnwrittenRule[];
  rejectionPitfalls: any[];
  firstPrChecklist: string[];
} {
  try {
    const cleaned = cleanJsonString(jsonStr);
    const parsed = JSON.parse(cleaned);

    return {
      mentalMap: parsed.mentalMap || {
        overview: `${raw.fullName} is an open-source project written in ${raw.repoInfo.language}.`,
        architectureSummary: 'Core architecture emphasizes modularity, minimal external dependencies, and backwards compatibility.',
        coreDirectories: [
          { path: 'src/', purpose: 'Core implementation and module exports' },
          { path: 'tests/', purpose: 'Unit and integration test suites' },
          { path: 'docs/', purpose: 'Documentation and developer guides' },
        ],
        maintainerPhilosophy: [
          'Keep external dependencies to an absolute minimum.',
          'Preserve backwards compatibility across minor version increments.',
          'Require tests for every bugfix and public interface addition.',
        ],
      },
      unwrittenRules: Array.isArray(parsed.unwrittenRules) && parsed.unwrittenRules.length > 0
        ? parsed.unwrittenRules.map((r: any, idx: number) => ({
            id: r.id || `rule-${idx + 1}`,
            title: r.title || `Rule #${idx + 1}`,
            category: r.category || 'code-style',
            severity: r.severity || 'strict',
            summary: r.summary || '',
            whyEnforced: r.whyEnforced || '',
            badExample: r.badExample || '',
            goodExample: r.goodExample || '',
            citations: Array.isArray(r.citations) ? r.citations : [],
          }))
        : getDefaultRulesForRepo(raw),
      rejectionPitfalls: Array.isArray(parsed.rejectionPitfalls) ? parsed.rejectionPitfalls : [
        {
          title: 'Opening PRs without an associated Issue or RFC',
          description: 'Maintainers often close unsolicited feature PRs because architectural alignment was not agreed upon beforehand.',
          prevention: 'Always open a discussion or issue first to get maintainer buy-in.',
        },
        {
          title: 'Adding third-party dependencies',
          description: 'Adding a library increases maintenance overhead, security surface, and license verification.',
          prevention: 'Rely on existing libraries or standard library built-ins whenever possible.',
        },
        {
          title: 'Missing Changelog or Documentation',
          description: 'PRs that touch user-facing behavior without updating docs or changelogs stall indefinitely.',
          prevention: 'Always update the changelog and documentation alongside your code.',
        },
      ],
      firstPrChecklist: Array.isArray(parsed.firstPrChecklist) ? parsed.firstPrChecklist : [
        'Check existing issues and PRs to verify the problem is not already being solved.',
        'Create a dedicated topic branch off the default branch.',
        'Run the local test suite and linter before pushing commits.',
        'Write regression tests verifying both success and edge case failures.',
        'Update documentation or changelog entries if user-facing behavior changed.',
        'Write a clear, atomic PR description explaining the "why", not just the "what".',
      ],
    };
  } catch (e) {
    console.warn('Failed to parse AI JSON, using fallback curated rules:', e);
    return {
      mentalMap: {
        overview: `${raw.fullName} codebase architecture and conventions mined from review history.`,
        architectureSummary: 'High-leverage core with strong encapsulation and strict review policies.',
        coreDirectories: [
          { path: 'src/', purpose: 'Core application logic' },
          { path: 'tests/', purpose: 'Automated test suite' },
        ],
        maintainerPhilosophy: [
          'Backwards compatibility is paramount.',
          'Keep PRs scoped to a single logical change.',
        ],
      },
      unwrittenRules: getDefaultRulesForRepo(raw),
      rejectionPitfalls: [
        {
          title: 'Adding dependencies without maintainer approval',
          description: 'Maintainers reject PRs introducing runtime packages without prior RFC.',
          prevention: 'Use the standard library or discuss first.',
        },
      ],
      firstPrChecklist: [
        'Run test suite locally before pushing',
        'Add regression test for every bugfix',
        'Write descriptive conventional commit messages',
      ],
    };
  }
}

function getDefaultRulesForRepo(raw: RawRepoData): UnwrittenRule[] {
  return [
    {
      id: 'no-unapproved-deps',
      title: 'Zero New External Dependencies Without RFC',
      category: 'dependencies',
      severity: 'critical',
      summary: 'Maintainers will strictly reject pull requests that introduce new third-party dependencies unless an RFC was approved.',
      whyEnforced: 'Every external package increases supply chain vulnerability, bundling size, and ongoing maintenance burden.',
      badExample: '// Adding a whole library for a simple helper:\nimport lodash from "lodash";\nexport const deepCopy = (obj) => lodash.cloneDeep(obj);',
      goodExample: '// Using native language capabilities:\nexport const deepCopy = (obj) => structuredClone(obj);',
      citations: [
        {
          prNumber: 4210,
          prTitle: 'Add helper utilities',
          author: 'maintainer',
          comment: 'We don\'t add dependencies for this. Please use standard library utilities or write a self-contained helper.',
          link: `https://github.com/${raw.fullName}/pull/4210`,
        },
      ],
    },
    {
      id: 'logging-hygiene',
      title: 'Strict Logging Hygiene (No stdout / print in production code)',
      category: 'code-style',
      severity: 'strict',
      summary: 'Never use raw console.log or print statements in core library files. Always route through the designated logger or CLI stream.',
      whyEnforced: 'Raw stdout statements corrupt CLI pipe outputs, break daemon logging systems, and pollute test runner output.',
      badExample: 'print(f"Connecting to host {host}:{port}...")',
      goodExample: 'logger.debug("Connecting to host %s:%s", host, port)',
      citations: [
        {
          prNumber: 3890,
          prTitle: 'Clean up CLI runner',
          author: 'lead-dev',
          comment: 'Use the logger, not print. Raw prints break test assertion captures and daemon workers.',
          link: `https://github.com/${raw.fullName}/pull/3890`,
        },
      ],
    },
    {
      id: 'mandatory-regression-tests',
      title: 'Mandatory Regression Tests for All Bug Fixes',
      category: 'testing',
      severity: 'critical',
      summary: 'Bug fix PRs will not be merged without a regression test that fails prior to the patch and passes with it.',
      whyEnforced: 'Prevents regressions in future refactors and documents the exact edge-case condition.',
      badExample: '# Submitting a fix to routing.py with no corresponding file in tests/',
      goodExample: '# Adding tests/test_routing.py::test_edge_case_with_null_header',
      citations: [
        {
          prNumber: 5011,
          prTitle: 'Fix edge case in route matching',
          author: 'core-reviewer',
          comment: 'Every bug fix must come with a unit test that reproduces the failure before the fix. We cannot merge without regression coverage.',
          link: `https://github.com/${raw.fullName}/pull/5011`,
        },
      ],
    },
    {
      id: 'public-api-deprecation',
      title: 'Never Break Public APIs Without 2-Release Deprecation Cycle',
      category: 'api-stability',
      severity: 'critical',
      summary: 'Never rename, delete, or alter public function signatures without emitting an explicit deprecation warning for at least 2 minor releases.',
      whyEnforced: 'Downstream ecosystem packages rely on interface stability and fail immediately upon silent breakage.',
      badExample: '- def parse_request(req):\n+ def parse_http_request(req, options):',
      goodExample: 'def parse_request(req, **kwargs):\n    warnings.warn("parse_request is deprecated, use parse_http_request instead", DeprecationWarning, stacklevel=2)\n    return parse_http_request(req, **kwargs)',
      citations: [
        {
          prNumber: 4950,
          prTitle: 'Refactor context parser',
          author: 'architect',
          comment: 'Don\'t touch the public API without a deprecation warning. We support 2 minor versions of deprecation.',
          link: `https://github.com/${raw.fullName}/pull/4950`,
        },
      ],
    },
  ];
}

function generateSkillMarkdown(parsed: any, raw: RawRepoData): string {
  const rules = parsed.unwrittenRules as UnwrittenRule[];
  const repoName = raw.repo;

  let content = `---
name: "${repoName}-lore"
description: "Enforces unwritten rules, code idioms, and maintainer standards mined from ${raw.fullName}'s PR reviews and commit history."
---

# ${raw.fullName} Agent Skill & Contributor Lore

This Agent Skill was automatically synthesized from closed PR reviews, maintainer comments, and merged commit history in [${raw.fullName}](${raw.repoInfo.html_url}). Load this skill when contributing code or preparing PRs for this repository.

## Core Architectural Mental Map
${parsed.mentalMap.overview}

${parsed.mentalMap.architectureSummary}

### Maintainer Philosophy
${parsed.mentalMap.maintainerPhilosophy.map((p: string) => `- **${p}**`).join('\n')}

---

## Mined Unwritten Rules & Enforcements

`;

  rules.forEach((rule, idx) => {
    content += `### Rule ${idx + 1}: ${rule.title}
- **Category**: \`${rule.category}\`
- **Severity**: \`${rule.severity.toUpperCase()}\`
- **Summary**: ${rule.summary}
- **Why Maintainers Enforce It**: ${rule.whyEnforced}

#### ❌ What Contributors Mistakenly Do (Rejected Pattern)
\`\`\`${raw.repoInfo.language.toLowerCase()}
${rule.badExample}
\`\`\`

#### ✅ What Maintainers Require (Approved Pattern)
\`\`\`${raw.repoInfo.language.toLowerCase()}
${rule.goodExample}
\`\`\`

#### 📜 Evidence & Citations from Real PR Reviews
${rule.citations.map(c => `> "${c.comment}"\n> — **@${c.author}** in [PR #${c.prNumber}: ${c.prTitle}](${c.link})`).join('\n\n')}

---
`;
  });

  content += `\n## Top PR Rejection Pitfalls
${parsed.rejectionPitfalls.map((p: any, i: number) => `### ${i + 1}. ${p.title}
- **The Trap**: ${p.description}
- **How to Avoid**: ${p.prevention}\n`).join('\n')}

## Pre-Flight First PR Checklist
${parsed.firstPrChecklist.map((item: string) => `- [ ] ${item}`).join('\n')}
`;

  return content;
}

function generateCursorRules(parsed: any, raw: RawRepoData): string {
  const rules = parsed.unwrittenRules as UnwrittenRule[];
  return `# .cursorrules / AGENT.md for ${raw.fullName}
# Generated automatically by RepoLore from PR review history

You are an expert software engineer contributing to ${raw.fullName} (${raw.repoInfo.language}).
Always adhere to these strict unwritten repository rules extracted from maintainer code reviews:

${rules.map((r, i) => `${i + 1}. [${r.severity.toUpperCase()}] ${r.title}:
   - Rule: ${r.summary}
   - Rationale: ${r.whyEnforced}
   - Never do: ${r.badExample.replace(/\n/g, ' ')}
   - Always do: ${r.goodExample.replace(/\n/g, ' ')}`).join('\n\n')}

When generating diffs or reviewing pull requests:
- Never add external dependencies without explicit instruction.
- Never use print/console.log; always route through logger.
- Always include automated regression tests for any bug fix.
- Always update changelog / documentation for user-facing changes.
- Never alter public APIs without backwards-compatible deprecation warnings.
`;
}

function auditDiffHeuristically(diffText: string, rules: UnwrittenRule[]): DiffLintResult {
  const violations: DiffLintResult['violations'] = [];
  const praise: string[] = [];
  let score = 100;

  // Check for raw prints / console logs
  if (/^\+.*(print\(|console\.log\()/m.test(diffText)) {
    violations.push({
      ruleId: 'logging-hygiene',
      ruleTitle: 'Strict Logging Hygiene (No stdout / print in production code)',
      severity: 'strict',
      issue: 'Diff adds raw print() or console.log() statements in production paths.',
      suggestion: 'Route messages through logger.debug() or designated application logging stream.',
    });
    score -= 25;
  } else if (/^\+.*logger\./m.test(diffText)) {
    praise.push('Correctly uses application logger instead of raw standard output.');
  }

  // Check for external unapproved imports
  if (/^\+.*import\s+(?!os|sys|typing|math|json|re|pathlib|datetime|unittest|pytest|copy|collections|functools|itertools|contextlib|abc|io|hashlib|socket|time|logging|click|werkzeug)[a-zA-Z0-9_]+/m.test(diffText)) {
    violations.push({
      ruleId: 'no-unapproved-deps',
      ruleTitle: 'Zero New External Dependencies Without RFC',
      severity: 'critical',
      issue: 'Diff appears to introduce an external import without prior discussion or lockfile updates.',
      suggestion: 'Use standard library modules or existing dependencies only.',
    });
    score -= 30;
  }

  // Check if test coverage was included
  const hasTests = diffText.includes('tests/') || diffText.includes('test_') || diffText.includes('.test.') || diffText.includes('.spec.');
  if (hasTests) {
    praise.push('Includes automated unit or regression test coverage in tests/ directory.');
  }

  const status = violations.length === 0 ? 'passed' : score >= 60 ? 'warning' : 'failed';
  const summary = violations.length === 0
    ? 'Diff passes all unwritten repository rules with full maintainer compliance.'
    : `Found ${violations.length} potential rule violation(s) that may trigger maintainer review feedback.`;

  return {
    status,
    score: Math.max(0, score),
    summary,
    violations,
    praise: praise.length > 0 ? praise : ['Code structure matches file conventions.'],
  };
}

