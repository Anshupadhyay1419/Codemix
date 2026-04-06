import React, { useState } from 'react';
import axios from 'axios';
import { Send, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils';

const MODELS = [
  { value: 'smart',    label: 'Auto-Route (Smart Predict)' },
  { value: 'all',      label: 'Run All Models' },
  { value: 'misinfo',  label: 'Misinformation Detector' },
  { value: 'fakenews', label: 'Fake News Classifier' },
  { value: 'emosen',   label: 'Sentiment Analysis' },
  { value: 'text',     label: 'Text Analysis Only' },
];

function ConfBar({ value, color = 'bg-indigo-500' }) {
  return (
    <div className="progress-bar mt-1.5">
      <div className={cn('progress-fill', color)} style={{ width: `${value}%` }} />
    </div>
  );
}

function ResultCard({ title, children }) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function MisinfoResult({ data }) {
  const isInfo = data.label === 'misinfo';
  return (
    <ResultCard title="Misinformation">
      <div className="flex items-center justify-between mb-2">
        <span className={cn('font-semibold text-sm', isInfo ? 'text-red-600' : 'text-emerald-600')}>
          {isInfo ? '⚠️ Misinformation' : '✅ Not Misinformation'}
        </span>
        <span className="text-xs text-gray-400 font-mono">{data.confidence}%</span>
      </div>
      <ConfBar value={data.confidence} color={isInfo ? 'bg-red-500' : 'bg-emerald-500'} />
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="stat-card py-2"><span className="text-xs text-gray-400">Misinfo</span><span className="text-sm font-semibold text-red-500">{data.prob_misinfo}%</span></div>
        <div className="stat-card py-2"><span className="text-xs text-gray-400">Non-Misinfo</span><span className="text-sm font-semibold text-emerald-500">{data.prob_nonmisinfo}%</span></div>
      </div>
    </ResultCard>
  );
}

function FakeNewsResult({ data }) {
  const COLOR_MAP = { true:'text-emerald-600', 'mostly true':'text-emerald-500', mix:'text-amber-500', misleading:'text-amber-600', 'mostly fake':'text-red-500', fake:'text-red-600' };
  return (
    <ResultCard title="Fake News">
      <div className="flex items-center justify-between mb-2">
        <span className={cn('font-semibold text-sm capitalize', COLOR_MAP[data.label] || 'text-gray-700')}>
          {data.emoji} {data.label}
        </span>
        <span className="text-xs text-gray-400 font-mono">{data.confidence}%</span>
      </div>
      <ConfBar value={data.confidence} />
      {data.all_scores && (
        <div className="mt-3 space-y-1.5">
          {Object.entries(data.all_scores).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-24 capitalize">{k}</span>
              <div className="flex-1 progress-bar"><div className="progress-fill bg-indigo-400" style={{ width: `${v}%` }} /></div>
              <span className="text-xs font-mono text-gray-500 w-10 text-right">{v}%</span>
            </div>
          ))}
        </div>
      )}
    </ResultCard>
  );
}

function SentimentResult({ data }) {
  const COLOR_MAP = { positive: 'text-emerald-600', neutral: 'text-gray-500', negative: 'text-red-600' };
  return (
    <ResultCard title="Sentiment">
      <div className="flex items-center justify-between mb-2">
        <span className={cn('font-semibold text-sm capitalize', COLOR_MAP[data.label?.toLowerCase()] || 'text-gray-700')}>
          {data.emoji} {data.label}
        </span>
        <span className="text-xs text-gray-400 font-mono">{data.confidence}%</span>
      </div>
      <ConfBar value={data.confidence} />
      {data.all_scores && (
        <div className="mt-3 space-y-1.5">
          {Object.entries(data.all_scores).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-20 capitalize">{k}</span>
              <div className="flex-1 progress-bar"><div className="progress-fill bg-indigo-400" style={{ width: `${v}%` }} /></div>
              <span className="text-xs font-mono text-gray-500 w-10 text-right">{v}%</span>
            </div>
          ))}
        </div>
      )}
    </ResultCard>
  );
}

function TextAnalysis({ data }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Text Analysis</p>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {open && (
        <div className="p-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            <div className="stat-card py-2"><span className="text-xs text-gray-400">Words</span><span className="text-lg font-semibold text-gray-800">{data.text_stats?.word_count}</span></div>
            <div className="stat-card py-2"><span className="text-xs text-gray-400">Code-Mix</span><span className="text-lg font-semibold text-indigo-600">{(data.code_mix_ratio * 100).toFixed(0)}%</span></div>
          </div>
          {data.languages_detected?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Languages</p>
              <div className="flex flex-wrap gap-1.5">{data.languages_detected.map(l => <span key={l} className="badge-blue">{l}</span>)}</div>
            </div>
          )}
          {data.slang_analysis?.internet_slang?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Slang detected</p>
              <div className="flex flex-wrap gap-1">{data.slang_analysis.internet_slang.map(s => <span key={s} className="font-mono text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100">{s}</span>)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SingleTextAnalysis({ apiUrl }) {
  const [text, setText] = useState('');
  const [model, setModel] = useState('smart');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const analyse = async () => {
    if (text.trim().length < 3) { setError('Please enter at least a few words.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await axios.post(`${apiUrl}/predict/${model}`, { text });
      setResult(res.data);
    } catch (e) { setError(e.response?.data?.detail || e.response?.data?.error || 'Analysis failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Input */}
      <div className="flex-1 card-flat flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="font-medium text-gray-800 text-sm">Text Input</p>
          <p className="text-xs text-gray-400 mt-0.5">Supports English, Hinglish, and Code-Mix</p>
        </div>
        <div className="flex-1 p-4 flex flex-col gap-3">
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Enter text, tweet, or news headline here..."
            className="flex-1 input resize-none min-h-[140px] font-mono text-sm leading-relaxed" />
          <select value={model} onChange={e => setModel(e.target.value)} className="select">
            {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          {error && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
          <button onClick={analyse} disabled={loading || !text.trim()} className="btn-primary">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Analyse
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 card-flat flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="font-medium text-gray-800 text-sm">Results</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300">
              <Send className="w-8 h-8" />
              <p className="text-sm">Run an analysis to see results</p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-400">Analysing...</p>
            </div>
          )}
          {result && !loading && (
            <div className="space-y-3 animate-slide-up">
              {result.misinfo  && <MisinfoResult data={result.misinfo} />}
              {result.fakenews && <FakeNewsResult data={result.fakenews} />}
              {result.label !== undefined && result.emoji !== undefined && !result.misinfo && <SentimentResult data={result} />}
              {result.text_analysis && <TextAnalysis data={result.text_analysis} />}
              {result.routed_to && <p className="text-xs text-gray-400 text-center">Routed to: <span className="font-mono text-gray-600">{result.routed_to}</span></p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
