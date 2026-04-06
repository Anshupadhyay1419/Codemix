import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils';

const STRATEGIES = {
  numeric: ['mean','median','mode','fixed','drop','interpolate','ffill','bfill'],
  categorical: ['mode','fixed','drop','ffill','bfill'],
  text: ['mode','fixed','drop','ffill','bfill'],
  email: ['mode','fixed','drop','ffill','bfill'],
  phone: ['mode','fixed','drop','ffill','bfill'],
  url: ['mode','fixed','drop','ffill','bfill'],
  id: ['mode','fixed','drop','ffill','bfill'],
  boolean: ['mode','fixed','drop'],
  datetime: ['ffill','bfill','fixed','drop'],
};
const LABELS = { mean:'Mean', median:'Median', mode:'Mode', fixed:'Fixed Value', drop:'Drop Rows', interpolate:'Interpolate', ffill:'Forward Fill', bfill:'Backward Fill' };

export default function Step3MissingValues({ apiUrl, colTypes, profileData, setProfileData }) {
  const [col, setCol] = useState('');
  const [strategy, setStrategy] = useState('');
  const [fixedVal, setFixedVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const missingCols = useMemo(() =>
    profileData?.columns?.filter(c => c.missing_count > 0).sort((a, b) => b.missing_count - a.missing_count) || [],
    [profileData]
  );

  const colType = col && colTypes ? colTypes[col]?.type : null;
  const available = colType ? (STRATEGIES[colType] || STRATEGIES.text) : [];

  const handleApply = async () => {
    if (!col || !strategy) return;
    if (strategy === 'fixed' && !fixedVal) { setError('Enter a fixed value.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await axios.post(`${apiUrl}/missing_strategy`, { column: col, strategy, value: strategy === 'fixed' ? fixedVal : null });
      setResult({ col, ...r.data });
      const p = await axios.get(`${apiUrl}/profile`);
      setProfileData(p.data);
    } catch (e) { setError(e.response?.data?.detail || 'Failed.'); }
    finally { setLoading(false); }
  };

  if (missingCols.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <CheckCircle className="w-8 h-8 text-emerald-400" />
      <p className="text-sm font-medium text-gray-700">No missing values</p>
      <p className="text-xs text-gray-400">Your dataset looks clean</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-1.5">
        <p className="section-title">Columns with missing values</p>
        {missingCols.map(c => (
          <button key={c.name} onClick={() => { setCol(c.name); setStrategy(''); setResult(null); }}
            className={cn('w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-all',
              col === c.name ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50')}>
            <span className="text-sm text-gray-700">{c.name}</span>
            <div className="flex items-center gap-2">
              <div className="progress-bar w-16">
                <div className="progress-fill bg-amber-400" style={{ width: `${Math.min(100, (c.missing_count / Math.max(c.missing_count + c.unique_count, 1)) * 100)}%` }} />
              </div>
              <span className="text-xs text-amber-500 font-mono w-12 text-right">{c.missing_count}</span>
            </div>
          </button>
        ))}
      </div>

      {col && (
        <div className="space-y-3 pt-2 border-t border-gray-100 animate-slide-up">
          <p className="text-xs text-gray-500">Strategy for <span className="font-medium text-gray-800">{col}</span></p>
          <div className="grid grid-cols-2 gap-1.5">
            {available.map(s => (
              <button key={s} onClick={() => setStrategy(s)}
                className={cn('px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                  strategy === s ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                {LABELS[s]}
              </button>
            ))}
          </div>

          {strategy === 'fixed' && (
            <input value={fixedVal} onChange={e => setFixedVal(e.target.value)} placeholder="Fixed value..." className="input" />
          )}

          {error && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}

          {result && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs">
              <CheckCircle className="w-3.5 h-3.5" />Fixed {result.rows_affected} rows in <strong>{result.col}</strong>
            </div>
          )}

          <button onClick={handleApply} disabled={!strategy || loading} className="btn-primary w-full">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Apply
          </button>
        </div>
      )}
    </div>
  );
}
