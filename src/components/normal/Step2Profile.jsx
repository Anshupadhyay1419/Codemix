import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trash2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils';

const TYPE_BADGE = { numeric:'badge-blue', categorical:'badge-green', text:'badge-slate', datetime:'badge-amber', email:'badge-blue', phone:'badge-green', url:'badge-slate', boolean:'badge-amber', id:'badge-slate' };
const COLORS = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#64748b'];

export default function Step2Profile({ apiUrl, profileData, setProfileData, colTypes, datasetInfo, setDatasetInfo }) {
  const [loading, setLoading] = useState(!profileData);
  const [dupData, setDupData] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { if (!profileData) fetchProfile(); fetchDups(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try { const r = await axios.get(`${apiUrl}/profile`); setProfileData(r.data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchDups = async () => {
    try { const r = await axios.get(`${apiUrl}/duplicates`); setDupData(r.data); } catch (e) {}
  };

  const removeDups = async () => {
    setRemoving(true);
    try {
      const r = await axios.post(`${apiUrl}/remove_duplicates`);
      setDatasetInfo(p => ({ ...p, rows: p.rows - r.data.removed }));
      fetchProfile(); fetchDups();
    } catch (e) {} finally { setRemoving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>;
  if (!profileData) return null;

  const totalMissing = profileData.columns?.reduce((s, c) => s + c.missing_count, 0) || 0;
  const missingPct = datasetInfo?.rows ? ((totalMissing / (datasetInfo.rows * (profileData.columns?.length || 1))) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Rows', value: datasetInfo?.rows?.toLocaleString() || '—', color: 'text-brand-400' },
          { label: 'Columns', value: profileData.columns?.length || '—', color: 'text-emerald-400' },
          { label: 'Missing Cells', value: `${missingPct}%`, color: totalMissing > 0 ? 'text-amber-400' : 'text-emerald-400' },
          { label: 'Duplicates', value: dupData?.count ?? '—', color: dupData?.count > 0 ? 'text-red-400' : 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="text-xs text-slate-500">{s.label}</span>
            <span className={cn('text-2xl font-bold', s.color)}>{s.value}</span>
          </div>
        ))}
      </div>

      {dupData?.count > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{dupData.count} duplicate rows detected</span>
          </div>
          <button onClick={removeDups} disabled={removing} className="btn-danger text-xs">
            {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Remove All
          </button>
        </div>
      )}

      <p className="section-title">Column Profiles</p>
      {profileData.columns?.map((col) => (
        <div key={col.name} className="glass-light rounded-xl overflow-hidden">
          <button onClick={() => setExpanded(expanded === col.name ? null : col.name)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/20 transition-colors text-left">
            <div className="flex items-center gap-3 min-w-0">
              <span className={cn('shrink-0', TYPE_BADGE[col.type] || 'badge-slate')}>{col.type}</span>
              <span className="font-medium text-slate-200 truncate text-sm">{col.name}</span>
            </div>
            <div className="flex items-center gap-4 shrink-0 ml-4">
              {col.missing_count > 0 && <span className="text-xs text-amber-400">{col.missing_count} missing</span>}
              <span className="text-xs text-slate-500">{col.unique_count} unique</span>
              <span className="text-slate-600 text-xs">{expanded === col.name ? '▲' : '▼'}</span>
            </div>
          </button>

          {expanded === col.name && (
            <div className="px-4 pb-4 border-t border-slate-700/40 pt-3 animate-fade-in">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[['Mean', col.mean], ['Median', col.median], ['Std', col.std], ['Min', col.min], ['Max', col.max]].filter(([, v]) => v !== undefined).map(([k, v]) => (
                  <div key={k} className="stat-card">
                    <span className="text-xs text-slate-500">{k}</span>
                    <span className="text-sm font-semibold text-slate-200">{typeof v === 'number' ? v.toFixed(2) : v}</span>
                  </div>
                ))}
              </div>
              {col.top_values?.length > 0 && (
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={col.top_values.slice(0, 6).map(v => ({ name: String(v.value).slice(0, 10), count: v.count }))}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {col.top_values.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
