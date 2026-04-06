import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Activity, RefreshCw, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '../../utils';
import { NLP_API_URL } from '../../config';
import SingleTextAnalysis from './SingleTextAnalysis';
import BatchAnalysis from './BatchAnalysis';

export default function CodeMixApp() {
  const [status, setStatus] = useState('checking'); // checking | online | offline
  const [activeTab, setActiveTab] = useState('single');

  const checkStatus = useCallback(async (retries = 5) => {
    setStatus('checking');
    for (let i = 0; i < retries; i++) {
      try {
        const res = await axios.get(`${NLP_API_URL}/health`, { timeout: 20000 });
        if (res.status === 200) { setStatus('online'); return; }
      } catch (err) {
        if (err?.response?.status === 503 && i < retries - 1) {
          await new Promise(r => setTimeout(r, 6000));
          continue;
        }
      }
    }
    setStatus('offline');
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="glass rounded-2xl px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-800/60 rounded-xl">
          {[{ id: 'single', label: 'Single Text' }, { id: 'batch', label: 'Batch CSV' }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                activeTab === t.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-slate-400 hover:text-slate-200')}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => checkStatus()} className="btn-ghost text-xs gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
          <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border',
            status === 'online'   ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            status === 'checking' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-red-500/10 text-red-400 border-red-500/20')}>
            {status === 'online'   && <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><Wifi className="w-3 h-3" />Models Online</>}
            {status === 'checking' && <><Loader2 className="w-3 h-3 animate-spin" />Waking up HF Space...</>}
            {status === 'offline'  && <><WifiOff className="w-3 h-3" />Models Offline</>}
          </div>
        </div>
      </div>

      {/* Wake-up notice */}
      {status === 'checking' && (
        <div className="glass-light rounded-xl px-5 py-3 text-sm text-amber-400 flex items-center gap-2 animate-fade-in">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          HuggingFace Space is waking up — this can take 20–30 seconds on first load. Please wait...
        </div>
      )}

      {status === 'offline' && (
        <div className="glass-light rounded-xl px-5 py-4 border border-red-500/20 animate-fade-in">
          <p className="text-red-400 font-semibold text-sm mb-1">NLP Models Offline</p>
          <p className="text-slate-500 text-xs">The HuggingFace Space may be sleeping. Click Refresh to retry, or visit <a href="https://huggingface.co/spaces/anant-ai/backend" target="_blank" rel="noreferrer" className="text-brand-400 underline">the Space directly</a> to wake it up.</p>
        </div>
      )}

      {/* Main content */}
      <div className={cn('flex-1 min-h-0 transition-opacity duration-300', status !== 'online' ? 'opacity-40 pointer-events-none' : 'opacity-100')}>
        {activeTab === 'single' ? <SingleTextAnalysis apiUrl={NLP_API_URL} /> : <BatchAnalysis apiUrl={NLP_API_URL} />}
      </div>
    </div>
  );
}
