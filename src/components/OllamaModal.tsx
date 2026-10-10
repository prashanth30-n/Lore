import React, { useState } from 'react';
import { X, Cpu, CheckCircle2, AlertCircle, RefreshCw, Terminal } from 'lucide-react';

interface OllamaModalProps {
  isOpen: boolean;
  onClose: () => void;
  ollamaHost: string;
  setOllamaHost: (host: string) => void;
  ollamaModel: string;
  setOllamaModel: (model: string) => void;
  ollamaConnected: boolean | null;
  setOllamaConnected: (connected: boolean | null) => void;
}

const COMMON_MODELS = [
  'qwen2.5-coder:7b',
  'qwen2.5-coder:14b',
  'qwen2.5-coder:32b',
  'llama3.1:8b',
  'deepseek-coder-v2:16b',
  'codellama:7b',
];

export const OllamaModal: React.FC<OllamaModalProps> = ({
  isOpen,
  onClose,
  ollamaHost,
  setOllamaHost,
  ollamaModel,
  setOllamaModel,
  ollamaConnected,
  setOllamaConnected,
}) => {
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [detectedModels, setDetectedModels] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestMessage(null);
    try {
      const res = await fetch('/api/test-ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: ollamaHost }),
      });

      const data = await res.json();
      if (data.ok) {
        setOllamaConnected(true);
        setTestMessage(`Successfully connected to Ollama (${data.models?.length || 0} models detected)`);
        if (data.models && data.models.length > 0) {
          setDetectedModels(data.models);
        }
      } else {
        setOllamaConnected(false);
        setTestMessage(data.error || 'Connection failed.');
      }
    } catch (err: any) {
      setOllamaConnected(false);
      setTestMessage(err.message || 'Connection failed.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-[#e8dfcf] rounded-3xl w-full max-w-lg overflow-hidden shadow-xl space-y-5 p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#f5efe4]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#fbf2d5] text-[#785611] border border-[#eed68e]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2b1d16]">
                Ollama Open-Weights Configuration
              </h3>
              <p className="text-xs text-[#685549]">
                Run Lore analysis on your local GPU or private server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9c897c] hover:text-[#2b1d16] p-1.5 rounded-xl hover:bg-[#faf6ef] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form fields */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[#2b1d16] font-bold mb-1.5">
              Ollama Host Endpoint
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ollamaHost}
                onChange={(e) => setOllamaHost(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full bg-[#faf6ef] border-2 border-[#dfd5c2] focus:border-[#3d2a1f] rounded-xl px-3.5 py-2 text-[#2b1d16] font-mono placeholder-[#9c897c] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 rounded-xl bg-[#3d2a1f] hover:bg-[#2b1e17] text-[#fbf2d5] font-mono text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Pinging...</span>
                  </>
                ) : (
                  <span>Test Link</span>
                )}
              </button>
            </div>
          </div>

          {/* Test connection status message */}
          {testMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                ollamaConnected
                  ? 'bg-[#fbf2d5] border-[#eed68e] text-[#785611]'
                  : 'bg-[#fff8f5] border-[#f8d9ce] text-[#9c381c]'
              }`}
            >
              {ollamaConnected ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#785611]" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-[#2b1d16] font-bold mb-1.5">
              Target LLM Model Identifier
            </label>
            <input
              type="text"
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              placeholder="e.g. qwen2.5-coder:7b"
              className="w-full bg-[#faf6ef] border-2 border-[#dfd5c2] focus:border-[#3d2a1f] rounded-xl px-3.5 py-2 text-[#2b1d16] font-mono placeholder-[#9c897c] focus:outline-none"
            />
          </div>

          {/* Detected or Recommended models */}
          <div>
            <label className="block text-[#685549] font-semibold mb-1.5">
              {detectedModels.length > 0 ? 'Detected on your Ollama instance:' : 'Recommended Models:'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(detectedModels.length > 0 ? detectedModels : COMMON_MODELS).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setOllamaModel(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                    ollamaModel === m
                      ? 'bg-[#3d2a1f] text-[#fbf2d5] font-bold'
                      : 'bg-[#faf6ef] border border-[#dfd5c2] text-[#2b1d16] hover:bg-[#fbf2d5]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f5efe4]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#3d2a1f] hover:bg-[#2b1e17] text-xs font-bold font-mono text-[#fbf2d5] transition-all shadow-xs"
          >
            Apply Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
