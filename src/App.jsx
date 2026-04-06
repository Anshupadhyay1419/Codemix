import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Database, Globe } from 'lucide-react';
import { cn } from './utils';
import NormalModeApp from './components/normal/NormalModeApp';
import CodeMixApp from './components/codemix/CodeMixApp';

const MODES = [
  { id: 'normal',  label: 'Data Cleaning', icon: Database },
  { id: 'codemix', label: 'Code-Mix NLP',  icon: Globe },
];

export default function App() {
  const [mode, setMode] = useState('normal');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">AI Data Copilot</span>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                  mode === m.id ? 'bg-white text-gray-900 shadow-soft' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <m.icon className="w-3.5 h-3.5" />
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-5 py-6">
        <AnimatePresence mode="wait">
          {mode === 'normal' ? (
            <motion.div key="normal" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <NormalModeApp />
            </motion.div>
          ) : (
            <motion.div key="codemix" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <CodeMixApp />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
