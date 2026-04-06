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
    try { const r = await axios.post(`${apiUrl}/anomalies/detect`, { contamination }); setResult(r.data); }
    catch (e) { setError(e.response?.data?.detail || 'Detection failed.'); }
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
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <AlertCircle className="w-8 h-8 text-gray-300" />
      <p className="text-sm text-gray-500">No numeric columns found</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="section-title">Anomaly Detection</p>
      <p className="text-xs text-gray-400">Isolation Forest on {numericCols.length} numeric column{numericCols.length > 1 ? 's' : ''}.</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500">Contamination</label>
          <span className="text-xs font-mono text-gray-700">{(contamination * 100).toFixed(0)}%</span>
        </div>
        <input type="range" min="0.01" max="0.2" step="0.01" value={contamination}
          onChange={e => setContamination(parseFloat(e.target.value))}
          className="w-full accent-gray-900 h-1.5" />
      </div>

      <button onClick={detect} disabled={loading} className="btn-primary w-full">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
        Detect Anomalies
      </button>

      {error && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}

      {result && (
        <div className="space-y-3 animate-slide-up">
          <div className="grid grid-cols-2 gap-2">
            <div className="stat-card"><span className="text-xs text-gray-400">Anomalies</span><span className="text-xl font-semibold text-red-500">{result.anomaly_count}</span></div>
            <div className="stat-card"><span className="text-xs text-gray-400">Normal</span><span className="text-xl font-semibold text-emerald-500">{result.normal_count}</span></div>
          </div>

          {result.plot_data?.length > 0 && (
            <div className="border border-gray-100 rounded-xl p-3">
              <ResponsiveContainer width="100%" height={160}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="x" tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="y" tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 8, fontSize: 11 }} />
                  <Scatter data={result.plot_data}>
                    {result.plot_data.map((p, i) => <Cell key={i} fill={p.is_anomaly ? '#ef4444' : '#6366f1'} fillOpacity={0.6} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-1">
                <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />Normal</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Anomaly</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => doAction('flag')} disabled={actionLoading} className="btn-secondary flex-1 text-xs">
              {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />}Flag
            </button>
            <button onClick={() => doAction('remove')} disabled={actionLoading} className="btn-danger flex-1 text-xs">
              {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
