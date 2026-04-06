import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { RefreshCw, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '../../utils';
import { NLP_API_URL } from '../../config';
import SingleTextAnalysis from './SingleTextAnalysis';
import BatchAnalysis from './BatchAnalysis';

export default function CodeMixApp() {
  const [status, setStatus] = useState('checking');
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
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 104px)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-white border border-gray-100 rounded-xl shadow-soft">
          {[{ id: 'single', label: 'Single Text' }, { id: 'batch', label: 'Batch CSV' }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                activeTab === t.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700')}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => checkStatus()} className="btn-ghost text-xs">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
          <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border',
            status === 'online'   ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            status === 'checking' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-red-50 text-red-600 border-red-100')}>
            {status === 'online'   && <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Models Online</>}
            {status === 'checking' && <><Loader2 className="w-3 h-3 animate-spin" />Waking up...</>}
            {status === 'offline'  && <><WifiOff className="w-3 h-3" />Offline</>}
          </div>
        </div>
      </div>

      {/* Wake-up notice */}
      {status === 'checking' && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-xs animate-fade-in">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          HuggingFace Space is waking up — this may take 20–30 seconds on first load.
        </div>
      )}

      {status === 'offline' && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 animate-fade-in">
          <p className="text-sm font-medium text-red-700 mb-0.5">Models Offline</p>
          <p className="text-xs text-red-500">
            The HuggingFace Space may be sleeping. Click Refresh or{' '}
            <a href="https://huggingface.co/spaces/anant-ai/backend" target="_blank" rel="noreferrer" className="underline">visit the Space</a> to wake it up.
          </p>
        </div>
      )}

      {/* Content */}
      <div className={cn('flex-1 min-h-0 transition-opacity duration-200', status !== 'online' ? 'opacity-30 pointer-events-none' : '')}>
        {activeTab === 'single' ? <SingleTextAnalysis apiUrl={NLP_API_URL} /> : <BatchAnalysis apiUrl={NLP_API_URL} />}
      </div>
    </div>
  );
}
