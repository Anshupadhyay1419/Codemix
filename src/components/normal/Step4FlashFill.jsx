import React, { useState } from 'react';
import axios from 'axios';
import { Wand2, CheckCircle, Loader2, AlertCircle, Zap } from 'lucide-react';
import { cn } from '../../utils';

export default function Step4FlashFill({ apiUrl, colTypes }) {
  const [col, setCol] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const cols = colTypes ? Object.keys(colTypes) : [];

  const getSuggestions = async () => {
    if (!col) return;
    setLoading(true); setError(''); setSuggestions([]); setResult(null);
    try {
      const r = await axios.post(`${apiUrl}/flashfill/suggest`, { column: col });
      setSuggestions(r.data.suggestions);
      if (!r.data.suggestions.length) setError('No transformations found for this column.');
    } catch (e) { setError('Failed to get suggestions.'); }
    finally { setLoading(false); }
  };

  const applyTransform = async (id) => {
    setApplying(id); setError('');
    try {
      const r = await axios.post(`${apiUrl}/flashfill/apply`, { column: col, transform_id: id });
      setResult(r.data);
    } catch (e) { setError('Failed to apply transformation.'); }
    finally { setApplying(null); }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Wand2 className="w-5 h-5 text-brand-400" />
          <p className="font-semibold text-slate-200">Intelligent FlashFill</p>
        </div>
        <p className="text-xs text-slate-500">Auto-detect and apply smart transformations to your columns.</p>

        <div className="flex gap-3">
          <select value={col} onChange={e => { setCol(e.target.value); setSuggestions([]); setResult(null); }} className="select flex-1">
            <option value="">Select a column...</option>
            {cols.map(c => <option key={c} value={c}>{c} ({colTypes[c]?.type})</option>)}
          </select>
          <button onClick={getSuggestions} disabled={!col || loading} className="btn-primary shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Analyze
          </button>
        </div>

        {error && <p className="text-amber-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2 animate-slide-up">
          <p className="section-title">Suggested Transformations</p>
          {suggestions.map(s => (
            <div key={s.id} className="glass-light rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200">{s.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
                {s.preview && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {s.preview.slice(0, 3).map((v, i) => (
                      <span key={i} className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-brand-400 border border-slate-700">{String(v)}</span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => applyTransform(s.id)} disabled={applying === s.id} className="btn-primary shrink-0 text-xs">
                {applying === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Apply
              </button>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-slide-up">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Created column <strong className="font-mono">{result.new_column}</strong> — {result.success_count} rows transformed, {result.fail_count} failed</span>
        </div>
      )}
    </div>
  );
}
