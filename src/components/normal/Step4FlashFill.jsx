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

  const apply = async (id) => {
    setApplying(id); setError('');
    try {
      const r = await axios.post(`${apiUrl}/flashfill/apply`, { column: col, transform_id: id });
      setResult(r.data);
    } catch (e) { setError('Failed to apply.'); }
    finally { setApplying(null); }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-3">
        <p className="section-title">FlashFill Transformations</p>
        <div className="flex gap-2">
          <select value={col} onChange={e => { setCol(e.target.value); setSuggestions([]); setResult(null); }} className="select flex-1">
            <option value="">Select column...</option>
            {cols.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={getSuggestions} disabled={!col || loading} className="btn-primary shrink-0">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          </button>
        </div>
        {error && <p className="text-amber-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2 animate-slide-up">
          {suggestions.map(s => (
            <div key={s.id} className="border border-gray-100 rounded-xl p-3.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">{s.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>
                {s.preview?.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {s.preview.slice(0, 3).map((v, i) => (
                      <span key={i} className="font-mono text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">{String(v)}</span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => apply(s.id)} disabled={applying === s.id} className="btn-secondary shrink-0 text-xs py-1.5 px-3">
                {applying === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
              </button>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs animate-slide-up">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          Created <span className="font-mono font-medium">{result.new_column}</span> — {result.success_count} rows
        </div>
      )}
    </div>
  );
}
