export interface ReviewCitation {
  prNumber: number;
  prTitle: string;
  author: string;
  comment: string;
  link: string;
  date?: string;
}

export interface UnwrittenRule {
  id: string;
  title: string;
  category: 'architecture' | 'dependencies' | 'code-style' | 'error-handling' | 'testing' | 'api-stability' | 'git-commits' | 'docs-changelog';
  severity: 'critical' | 'strict' | 'recommended';
  summary: string;
  whyEnforced: string;
  badExample: string;
  goodExample: string;
  citations: ReviewCitation[];
}

export interface RejectionPitfall {
  title: string;
  description: string;
  prevention: string;
}

export interface CodebaseMentalMap {
  overview: string;
  architectureSummary: string;
  coreDirectories: { path: string; purpose: string }[];
  maintainerPhilosophy: string[];
}

export interface ModuleCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  html_url: string;
}

export interface CodebaseModuleNode {
  id: string;
  name: string;
  path: string;
  layer: 'core' | 'routing' | 'context' | 'session' | 'cli' | 'middleware' | 'helpers' | 'tests';
  summary: string;
  implementationDetails: {
    purpose: string;
    keyClasses: string[];
    exportedMethods: string[];
    internalMechanics: string;
    designPatterns: string[];
    maintainerSensitivity: 'critical' | 'high' | 'medium';
  };
  dependencies: string[];
  commits: ModuleCommit[];
  associatedRules: string[];
  citationsCount: number;
}

export interface CodebaseGraphEdge {
  from: string;
  to: string;
  relationship: string;
}

export interface CodebaseKnowledgeGraph {
  nodes: CodebaseModuleNode[];
  edges: CodebaseGraphEdge[];
}

export interface RepoLoreAnalysis {
  repo: {
    owner: string;
    name: string;
    fullName: string;
    description: string;
    stars: number;
    forks: number;
    language: string;
    defaultBranch: string;
    url: string;
  };
  stats: {
    prsScanned: number;
    reviewCommentsMined: number;
    commitsAnalyzed: number;
    issuesScanned: number;
  };
  mentalMap: CodebaseMentalMap;
  moduleGraph: CodebaseKnowledgeGraph;
  unwrittenRules: UnwrittenRule[];
  rejectionPitfalls: RejectionPitfall[];
  firstPrChecklist: string[];
  skillMd: string;
  cursorRules: string;
  generatedAt: string;
  aiEngineUsed: string;
}

export interface DiffLintResult {
  status: 'passed' | 'warning' | 'failed';
  score: number; // 0 - 100
  summary: string;
  violations: {
    ruleId: string;
    ruleTitle: string;
    severity: 'critical' | 'strict' | 'recommended';
    issue: string;
    suggestion: string;
  }[];
  praise: string[];
}
