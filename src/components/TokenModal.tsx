import React, { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Trash2 } from 'lucide-react';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  setToken: (token: string) => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({
  isOpen,
  onClose,
  token,
  setToken,
}) => {
  const [val, setVal] = useState(token);

  if (!isOpen) return null;

  const handleSave = () => {
    const clean = val.trim();
    setToken(clean);
    if (clean) {
      localStorage.setItem('repolore_gh_token', clean);
    } else {
      localStorage.removeItem('repolore_gh_token');
    }
    onClose();
  };

  const handleClear = () => {
    setVal('');
    setToken('');
    localStorage.removeItem('repolore_gh_token');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-[#e8dfcf] rounded-3xl w-full max-w-md overflow-hidden shadow-xl space-y-5 p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#f5efe4]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#fbf2d5] text-[#785611] border border-[#eed68e]">
              <Key className="w-5 h-5 text-[#785611]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2b1d16]">
                GitHub Access Token (Optional)
              </h3>
              <p className="text-xs text-[#685549]">
                Unlock 5,000 GitHub API requests per hour
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

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[#2b1d16] font-bold mb-1.5">
              Personal Access Token (classic or fine-grained)
            </label>
            <input
              type="password"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-[#faf6ef] border-2 border-[#dfd5c2] focus:border-[#3d2a1f] rounded-xl px-3.5 py-2.5 text-[#2b1d16] font-mono placeholder-[#9c897c] focus:outline-none focus:ring-2 focus:ring-[#3d2a1f]/10"
            />
            <span className="text-[11px] text-[#685549] mt-1 block">
              Stored exclusively in browser localStorage. Never sent to third parties.
            </span>
          </div>

          <div className="bg-[#eaf3f8] border border-[#b7d6e6] rounded-2xl p-3.5 space-y-1.5 text-[#1d5372] text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-[#1d5372]">
              <ShieldCheck className="w-4 h-4 text-[#3882a8]" />
              <span>Why add a token?</span>
            </div>
            <p className="leading-relaxed">
              Without a token, GitHub strictly limits anonymous requests to 60/hr. With any token (even with zero permissions / public repo read only), you get 5,000 requests/hr.
            </p>
          </div>

          <div className="pt-1">
            <a
              href="https://github.com/settings/tokens/new?description=RepoLore%20Analyzer&scopes=public_repo"
              target="_blank"
              rel="noreferrer"
              className="text-[#3d2a1f] hover:text-[#785611] flex items-center gap-1 font-semibold hover:underline"
            >
              <span>Generate a token on GitHub (no scopes needed for public repos)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#f5efe4]">
          {val ? (
            <button
              onClick={handleClear}
              className="text-[#9c381c] hover:text-black flex items-center gap-1 font-mono text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Token</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#dfd5c2] text-xs font-mono text-[#685549] hover:bg-[#faf6ef] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#3d2a1f] hover:bg-[#2b1e17] text-xs font-bold font-mono text-[#fbf2d5] transition-all shadow-xs"
            >
              Save Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
