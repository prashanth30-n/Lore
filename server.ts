import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parseRepoUrl, fetchGithubData, getPresetRepoData } from './server/github.ts';
import { analyzeRepoLore, lintDiffWithLore, checkOllamaConnection } from './server/ai.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // Check Ollama status
  app.post('/api/ollama-status', async (req, res) => {
    const { host } = req.body || {};
    try {
      const result = await checkOllamaConnection(host || 'http://localhost:11434');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ connected: false, models: [], error: err.message });
    }
  });

  // Presets list
  app.get('/api/presets', (req, res) => {
    res.json([
      {
        name: 'Flask',
        fullName: 'pallets/flask',
        language: 'Python',
        description: 'The classic Python WSGI microframework. Strict rules on dependencies, logging, and Werkzeug internals.',
        icon: 'flask',
        stars: '69.2k',
      },
      {
        name: 'FastAPI',
        fullName: 'fastapi/fastapi',
        language: 'Python',
        description: 'Modern, high-performance web framework. Strict rules on typing.Annotated, Pydantic v2 compatibility, and docs_src examples.',
        icon: 'zap',
        stars: '81.5k',
      },
      {
        name: 'Express',
        fullName: 'expressjs/express',
        language: 'JavaScript',
        description: 'Minimalist web framework for Node.js. Strict rules on ES5 compatibility, external middleware separation, and 4-argument error handlers.',
        icon: 'server',
        stars: '65.1k',
      },
      {
        name: 'Ripgrep',
        fullName: 'BurntSushi/ripgrep',
        language: 'Rust',
        description: 'Ultra-fast search tool. Strict rules on memory allocations, benchmark tests for any regex change, and zero unneeded allocations.',
        icon: 'search',
        stars: '48.9k',
      },
      {
        name: 'Zod',
        fullName: 'colinhacks/zod',
        language: 'TypeScript',
        description: 'TypeScript-first schema declaration. Strict rules on pure zero-dependencies, exact inference types, and bundle footprint.',
        icon: 'shield',
        stars: '35.4k',
      },
    ]);
  });

  // Analyze repository endpoint
  app.post('/api/analyze-repo', async (req, res) => {
    const { repoUrl, githubToken, engine = 'gemini', ollamaHost, ollamaModel } = req.body || {};

    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid GitHub repository URL or owner/repo shorthand.' });
    }

    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid repository format. Please use "https://github.com/owner/repo" or "owner/repo".' });
    }

    try {
      // 1. Fetch GitHub data (or rich preset if rate limited)
      let rawData;
      try {
        rawData = await fetchGithubData(parsed.owner, parsed.repo, githubToken);
      } catch (ghErr: any) {
        if (ghErr.message === 'RATE_LIMITED') {
          const preset = getPresetRepoData(parsed.owner, parsed.repo);
          if (preset) {
            rawData = preset;
          } else {
            return res.status(429).json({
              error: 'GitHub API rate limit exceeded (60 requests/hour unauthenticated). Please add a free GitHub Personal Access Token in Settings or pick one of the featured preset repositories.',
            });
          }
        } else if (ghErr.message === 'NOT_FOUND') {
          return res.status(404).json({ error: `Repository "${parsed.owner}/${parsed.repo}" was not found or is private.` });
        } else {
          // If network failed, check preset
          const preset = getPresetRepoData(parsed.owner, parsed.repo);
          if (preset) {
            rawData = preset;
          } else {
            throw ghErr;
          }
        }
      }

      // 2. Run AI synthesis
      const analysis = await analyzeRepoLore(rawData, {
        engine: engine === 'ollama' ? 'ollama' : 'gemini',
        ollamaHost,
        ollamaModel,
      });

      res.json(analysis);
    } catch (err: any) {
      console.error('Error analyzing repository:', err);
      res.status(500).json({ error: err.message || 'Failed to analyze repository lore.' });
    }
  });

  // Test diff endpoint
  app.post('/api/check-diff', async (req, res) => {
    const { diffText, rules, engine = 'gemini', ollamaHost, ollamaModel } = req.body || {};

    if (!diffText || typeof diffText !== 'string') {
      return res.status(400).json({ error: 'Please provide code diff text to check.' });
    }

    if (!Array.isArray(rules) || rules.length === 0) {
      return res.status(400).json({ error: 'No rules provided to evaluate against.' });
    }

    try {
      const result = await lintDiffWithLore(diffText, rules, {
        engine: engine === 'ollama' ? 'ollama' : 'gemini',
        ollamaHost,
        ollamaModel,
      });
      res.json(result);
    } catch (err: any) {
      console.error('Error testing diff:', err);
      res.status(500).json({ error: err.message || 'Failed to evaluate diff.' });
    }
  });

  // Mount Vite or static server
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RepoLore full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
