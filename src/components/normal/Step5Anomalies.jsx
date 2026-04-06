import React, { useState } from 'react';
import axios from 'axios';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Trash2, Flag, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils';

export default function Step5Anomalies({ apiUrl, colTypes, setDatasetInfo }) {
  const [contamination, setContamination] = useState(0.05);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const numericCols = colTypes ? Object.keys(colTypes).filter(c => colTypes[c].type === 'numeric') : [];

  const detect = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await axios.post(`${apiUrl}/anomalies/detect`, { contamination });
      setResult(r.data);
    } catch (e) { setError(e.response?.data?.detail || 'Detection failed.'); }
    finally { setLoading(false); }
  };

  const doAction = async (action) => {
    if (!result?.anomalies?.length) return;
    if (action === 'remove' && !window.confirm(`Remove ${result.anomaly_count} anomalous rows?`)) return;
    setActionLoading(true);
    try {
      await axios.post(`${apiUrl}/anomalies/action`, { action, indices: result.anomalies.map(a => a._index) });
      if (action === 'remove') setDatasetInfo(p => ({ ...p, rows: p.rows - result.anomaly_count }));
      setResult(null);
    } catch (e) { alert('Action failed.'); }
    finally { setActionLoading(false); }
  };

  if (numericCols.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <AlertCircle className="w-10 h-10 text-slate-600" />
      <p className="text-slate-400 text-sm">No numeric columns found for anomaly detection.</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-400" />
          <p className="font-semibold text-slate-200">Anomaly Detection</p>
        </div>
        <p className="text-xs text-slate-500">Uses Isolation Forest on {numericCols.length} numeric column{numericCols.length > 1 ? 's' : ''}.</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400">Contamination Rate</label>
            <span className="text-xs font-mono text-brand-400">{(contamination * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min="0.01" max="0.2" step="0.01" value={contamination}
            onChange={e => setContamination(parseFloat(e.target.value))}
            className="w-full accent-brand-500" />
          <div className="flex justify-between text-xs text-slate-600"><span>1%</span><span>20%</span></div>
        </div>

        <button onClick={detect} disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
          Detect Anomalies
        </button>

        {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      </div>

      {result && (
        <div className="space-y-4 animate-slide-up">
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card">
              <span className="text-xs text-slate-500">Anomalies Found</span>
              <span className="text-2xl font-bold text-red-400">{result.anomaly_count}</span>
            </div>
            <div className="stat-card">
              <span className="text-xs text-slate-500">Normal Rows</span>
              <span className="text-2xl font-bold text-emerald-400">{result.normal_count}</span>
            </div>
          </div>

          {result.plot_data?.length > 0 && (
            <div className="card">
              <p className="text-xs text-slate-500 mb-3">Scatter Plot (PCA reduced)</p>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="x" name="PC1" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis dataKey="y" name="PC2" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
                  <Scatter data={result.plot_data}>
                    {result.plot_data.map((p, i) => <Cell key={i} fill={p.is_anomaly ? '#ef4444' : '#6366f1'} fillOpacity={0.7} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center">
                <span className="flex items-center gap-1 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />Normal</span>
                <span className="flex items-center gap-1 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Anomaly</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => doAction('flag')} disabled={actionLoading} className="btn-ghost flex-1 border border-slate-700">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
              Flag Rows
            </button>
            <button onClick={() => doAction('remove')} disabled={actionLoading} className="btn-danger flex-1">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Remove Rows
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
