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
      // refresh profile
      const p = await axios.get(`${apiUrl}/profile`);
      setProfileData(p.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to apply strategy.');
    } finally { setLoading(false); }
  };

  if (missingCols.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <CheckCircle className="w-12 h-12 text-emerald-400" />
      <p className="text-slate-300 font-medium">No missing values detected</p>
      <p className="text-slate-500 text-sm">Your dataset looks clean!</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Missing columns overview */}
      <div className="space-y-2">
        <p className="section-title">Columns with Missing Values</p>
        {missingCols.map(c => (
          <button key={c.name} onClick={() => { setCol(c.name); setStrategy(''); setResult(null); }}
            className={cn('w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left',
              col === c.name ? 'border-brand-500/60 bg-brand-500/10' : 'border-slate-700/50 glass-light hover:border-slate-600')}>
            <span className="text-sm font-medium text-slate-200">{c.name}</span>
            <div className="flex items-center gap-3">
              <div className="progress-bar w-24">
                <div className="progress-fill bg-amber-500" style={{ width: `${Math.min(100, (c.missing_count / (c.missing_count + c.unique_count)) * 100)}%` }} />
              </div>
              <span className="text-xs text-amber-400 font-mono w-16 text-right">{c.missing_count} missing</span>
            </div>
          </button>
        ))}
      </div>

      {/* Strategy selector */}
      {col && (
        <div className="card space-y-4 animate-slide-up">
          <p className="text-sm font-semibold text-slate-200">Fix: <span className="text-brand-400">{col}</span></p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {available.map(s => (
              <button key={s} onClick={() => setStrategy(s)}
                className={cn('px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                  strategy === s ? 'bg-brand-600 border-brand-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200')}>
                {LABELS[s]}
              </button>
            ))}
          </div>

          {strategy === 'fixed' && (
            <input value={fixedVal} onChange={e => setFixedVal(e.target.value)} placeholder="Enter fixed value..." className="input" />
          )}

          {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}

          {result && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Fixed {result.rows_affected} rows in <strong>{result.col}</strong>
            </div>
          )}

          <button onClick={handleApply} disabled={!strategy || loading} className="btn-primary w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Apply Strategy
          </button>
        </div>
      )}
    </div>
  );
}
