import React, { useState } from 'react';
import axios from 'axios';
import { Send, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils';

const MODELS = [
  { value: 'smart',    label: 'Auto-Route (Smart Predict)' },
  { value: 'all',      label: 'Run All Models' },
  { value: 'misinfo',  label: 'Misinformation Detector' },
  { value: 'fakenews', label: 'Fake News Classifier' },
  { value: 'emosen',   label: 'Sentiment Analysis (EmoSen)' },
  { value: 'text',     label: 'Text Analysis Only' },
];

const FAKE_COLORS = { true:'text-emerald-400', 'mostly true':'text-emerald-300', mix:'text-amber-400', misleading:'text-amber-500', 'mostly fake':'text-red-400', fake:'text-red-500' };
const SENT_COLORS = { positive:'text-emerald-400', neutral:'text-slate-400', negative:'text-red-400' };

function ConfBar({ value, color = 'bg-brand-500' }) {
  return (
    <div className="progress-bar mt-1.5">
      <div className={cn('progress-fill', color)} style={{ width: `${value}%` }} />
    </div>
  );
}

function MisinfoResult({ data }) {
  const isInfo = data.label === 'misinfo';
  return (
    <div className={cn('p-4 rounded-xl border', isInfo ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20')}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn('font-bold text-sm', isInfo ? 'text-red-400' : 'text-emerald-400')}>
          {isInfo ? '⚠️ Misinformation' : '✅ Not Misinformation'}
        </span>
        <span className="text-xs text-slate-400 font-mono">{data.confidence}%</span>
      </div>
      <ConfBar value={data.confidence} color={isInfo ? 'bg-red-500' : 'bg-emerald-500'} />
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="stat-card"><span className="text-xs text-slate-500">Misinfo</span><span className="text-sm font-bold text-red-400">{data.prob_misinfo}%</span></div>
        <div className="stat-card"><span className="text-xs text-slate-500">Non-Misinfo</span><span className="text-sm font-bold text-emerald-400">{data.prob_nonmisinfo}%</span></div>
      </div>
    </div>
  );
}

function FakeNewsResult({ data }) {
  return (
    <div className="p-4 rounded-xl border border-slate-700/50 glass-light">
      <div className="flex items-center justify-between mb-3">
        <span className={cn('font-bold text-sm capitalize', FAKE_COLORS[data.label] || 'text-slate-300')}>
          {data.emoji} {data.label}
        </span>
        <span className="text-xs text-slate-400 font-mono">{data.confidence}%</span>
      </div>
      <ConfBar value={data.confidence} color="bg-brand-500" />
      {data.all_scores && (
        <div className="mt-3 space-y-1.5">
          {Object.entries(data.all_scores).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-24 capitalize">{k}</span>
              <div className="flex-1 progress-bar"><div className="progress-fill bg-brand-500/60" style={{ width: `${v}%` }} /></div>
              <span className="text-xs font-mono text-slate-400 w-10 text-right">{v}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SentimentResult({ data }) {
  return (
    <div className="p-4 rounded-xl border border-slate-700/50 glass-light">
      <div className="flex items-center justify-between mb-2">
        <span className={cn('font-bold text-sm capitalize', SENT_COLORS[data.label?.toLowerCase()] || 'text-slate-300')}>
          {data.emoji} {data.label}
        </span>
        <span className="text-xs text-slate-400 font-mono">{data.confidence}%</span>
      </div>
      <ConfBar value={data.confidence} color="bg-brand-500" />
      {data.all_scores && (
        <div className="mt-3 space-y-1.5">
          {Object.entries(data.all_scores).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-20 capitalize">{k}</span>
              <div className="flex-1 progress-bar"><div className="progress-fill bg-brand-500/60" style={{ width: `${v}%` }} /></div>
              <span className="text-xs font-mono text-slate-400 w-10 text-right">{v}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TextAnalysis({ data }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-light rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/20 transition-colors">
        <span className="text-sm font-semibold text-slate-300">Text Analysis</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            <div className="stat-card"><span className="text-xs text-slate-500">Words</span><span className="text-lg font-bold text-slate-200">{data.text_stats?.word_count}</span></div>
            <div className="stat-card"><span className="text-xs text-slate-500">Code-Mix Ratio</span><span className="text-lg font-bold text-brand-400">{(data.code_mix_ratio * 100).toFixed(0)}%</span></div>
          </div>
          {data.languages_detected?.length > 0 && (
            <div><p className="text-xs text-slate-500 mb-1.5">Languages</p>
              <div className="flex flex-wrap gap-1.5">{data.languages_detected.map(l => <span key={l} className="badge-blue">{l}</span>)}</div>
            </div>
          )}
          {data.slang_analysis?.internet_slang?.length > 0 && (
            <div><p className="text-xs text-slate-500 mb-1.5">Internet Slang</p>
              <div className="flex flex-wrap gap-1">{data.slang_analysis.internet_slang.map(s => <span key={s} className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">{s}</span>)}</div>
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
      <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50">
          <p className="font-semibold text-slate-200 text-sm">Text Input</p>
          <p className="text-xs text-slate-500 mt-0.5">Supports English, Hinglish, and Code-Mix text</p>
        </div>
        <div className="flex-1 p-4 flex flex-col gap-4">
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Enter text, tweet, or news headline here..."
            className="flex-1 input resize-none min-h-[160px] font-mono text-sm leading-relaxed" />

          <select value={model} onChange={e => setModel(e.target.value)} className="select">
            {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>

          {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}

          <button onClick={analyse} disabled={loading || !text.trim()} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Analyse
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50">
          <p className="font-semibold text-slate-200 text-sm">Analysis Results</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
              <Send className="w-10 h-10" />
              <p className="text-sm">Run an analysis to see results</p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
              <p className="text-sm text-slate-500">Analysing...</p>
            </div>
          )}
          {result && !loading && (
            <div className="space-y-3 animate-slide-up">
              {result.misinfo  && <div><p className="section-title">Misinformation</p><MisinfoResult data={result.misinfo} /></div>}
              {result.fakenews && <div><p className="section-title">Fake News</p><FakeNewsResult data={result.fakenews} /></div>}
              {(result.label && result.emoji !== undefined) && <div><p className="section-title">Sentiment</p><SentimentResult data={result} /></div>}
              {result.text_analysis && <TextAnalysis data={result.text_analysis} />}
              {result.routed_to && <p className="text-xs text-slate-600 text-center">Routed to: <span className="text-brand-400 font-mono">{result.routed_to}</span></p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
