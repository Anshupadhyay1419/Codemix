import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Globe, Database } from 'lucide-react';
import { cn } from './utils';
import NormalModeApp from './components/normal/NormalModeApp';
import CodeMixApp from './components/codemix/CodeMixApp';

const MODES = [
  { id: 'normal',  label: 'Data Cleaning',  icon: Database, desc: 'Upload, clean, transform & export CSV datasets' },
  { id: 'codemix', label: 'Code-Mix NLP',   icon: Globe,    desc: 'Misinformation, fake news & sentiment analysis' },
];

export default function App() {
  const [mode, setMode] = useState('normal');

  return (
    <div className="min-h-screen bg-grid-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">AI Data Copilot</h1>
              <p className="text-xs text-slate-500 mt-0.5">Powered by HuggingFace models</p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-1 p-1 glass rounded-xl">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  mode === m.id
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                )}
              >
                <m.icon className="w-4 h-4" />
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Mode subtitle */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-1">
        <AnimatePresence mode="wait">
          <motion.p
            key={mode}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-slate-500"
          >
            {MODES.find(m => m.id === mode)?.desc}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {mode === 'normal' ? (
            <motion.div key="normal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <NormalModeApp />
            </motion.div>
          ) : (
            <motion.div key="codemix" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <CodeMixApp />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
