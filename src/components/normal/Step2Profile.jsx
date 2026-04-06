import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trash2, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils';

const TYPE_COLOR = { numeric:'badge-blue', categorical:'badge-green', text:'badge-slate', datetime:'badge-amber', email:'badge-blue', phone:'badge-green', url:'badge-slate', boolean:'badge-amber', id:'badge-slate' };
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
    catch (e) {} finally { setLoading(false); }
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

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-gray-400 animate-spin" /></div>;
  if (!profileData) return null;

  const totalMissing = profileData.columns?.reduce((s, c) => s + c.missing_count, 0) || 0;
  const missingPct = datasetInfo?.rows ? ((totalMissing / (datasetInfo.rows * (profileData.columns?.length || 1))) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Rows', value: datasetInfo?.rows?.toLocaleString() },
          { label: 'Columns', value: profileData.columns?.length },
          { label: 'Missing', value: `${missingPct}%`, warn: totalMissing > 0 },
          { label: 'Duplicates', value: dupData?.count ?? '—', warn: dupData?.count > 0 },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="text-xs text-gray-400">{s.label}</span>
            <span className={cn('text-xl font-semibold', s.warn ? 'text-amber-500' : 'text-gray-800')}>{s.value}</span>
          </div>
        ))}
      </div>

      {dupData?.count > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
          <span className="text-xs text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{dupData.count} duplicates</span>
          <button onClick={removeDups} disabled={removing} className="btn-danger text-xs py-1 px-2.5">
            {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}Remove
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        <p className="section-title">Columns</p>
        {profileData.columns?.map(col => (
          <div key={col.name} className="border border-gray-100 rounded-xl overflow-hidden">
            <button onClick={() => setExpanded(expanded === col.name ? null : col.name)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn('shrink-0 text-[10px]', TYPE_COLOR[col.type] || 'badge-slate')}>{col.type}</span>
                <span className="text-sm text-gray-700 truncate">{col.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                {col.missing_count > 0 && <span className="text-xs text-amber-500">{col.missing_count}✗</span>}
                <span className="text-xs text-gray-400">{col.unique_count} uniq</span>
                {expanded === col.name ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
              </div>
            </button>

            {expanded === col.name && (
              <div className="px-3.5 pb-3.5 border-t border-gray-100 pt-3 animate-fade-in">
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {[['Mean', col.mean], ['Median', col.median], ['Std', col.std], ['Min', col.min], ['Max', col.max]]
                    .filter(([, v]) => v !== undefined)
                    .map(([k, v]) => (
                      <div key={k} className="stat-card py-2">
                        <span className="text-[10px] text-gray-400">{k}</span>
                        <span className="text-xs font-semibold text-gray-700">{typeof v === 'number' ? v.toFixed(2) : v}</span>
                      </div>
                    ))}
                </div>
                {col.top_values?.length > 0 && (
                  <ResponsiveContainer width="100%" height={90}>
                    <BarChart data={col.top_values.slice(0, 5).map(v => ({ name: String(v.value).slice(0, 8), count: v.count }))}>
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 8, fontSize: 11, boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.08)' }} />
                      <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                        {col.top_values.slice(0, 5).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
