import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet, FileText, CheckCircle, Wand2, Loader2 } from 'lucide-react';
import { cn } from '../../utils';

export default function Step6Export({ apiUrl, datasetInfo }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [exporting, setExporting] = useState(null);

  useEffect(() => { fetchSuggestions(); }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    try { const r = await axios.get(`${apiUrl}/rename/suggest`); setSuggestions(r.data.suggestions); }
    catch (e) {} finally { setLoading(false); }
  };

  const toggle = (i) => setSuggestions(s => s.map((x, j) => j === i ? { ...x, accepted: !x.accepted } : x));

  const applyRenames = async () => {
    setApplying(true);
    const renames = {};
    suggestions.forEach(s => { if (s.accepted && s.original !== s.suggested) renames[s.original] = s.suggested; });
    try {
      if (Object.keys(renames).length) await axios.post(`${apiUrl}/rename/apply`, { renames });
      setApplied(true);
    } catch (e) { alert('Failed to apply renames.'); }
    finally { setApplying(false); }
  };

  const download = async (type) => {
    setExporting(type);
    try {
      const r = await axios.get(`${apiUrl}/export/data`);
      const { filename, data, columns } = r.data;
      const base = filename.replace('.csv', '');

      if (type === 'csv') {
        const csv = Papa.unparse(data, { columns });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, `${base}_cleaned.csv`);
      } else if (type === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(data, { header: columns });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cleaned Data');
        XLSX.writeFile(wb, `${base}_cleaned.xlsx`);
      }
    } catch (e) { alert('Export failed.'); }
    finally { setExporting(null); }
  };

  const triggerDownload = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Column renames */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-brand-400" />
          <p className="font-semibold text-slate-200">AI Column Rename Suggestions</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading suggestions...</div>
        ) : suggestions.length === 0 ? (
          <p className="text-slate-500 text-sm">No rename suggestions available.</p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <label key={s.original} className={cn('flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                s.accepted ? 'border-brand-500/40 bg-brand-500/5' : 'border-slate-700/50 glass-light')}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!s.accepted} onChange={() => toggle(i)} className="accent-brand-500 w-4 h-4" />
                  <span className="font-mono text-xs text-slate-400">{s.original}</span>
                  <span className="text-slate-600">→</span>
                  <span className="font-mono text-xs text-brand-400">{s.suggested}</span>
                </div>
                {s.reason && <span className="text-xs text-slate-600 hidden sm:block">{s.reason}</span>}
              </label>
            ))}
            {!applied ? (
              <button onClick={applyRenames} disabled={applying} className="btn-primary w-full mt-2">
                {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Apply Selected Renames
              </button>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <CheckCircle className="w-4 h-4" />Renames applied successfully
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export */}
      <div className="card space-y-4">
        <p className="font-semibold text-slate-200">Export Cleaned Dataset</p>
        <p className="text-xs text-slate-500">Download your cleaned data in your preferred format.</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => download('csv')} disabled={!!exporting} className="btn-ghost border border-slate-700 flex-col py-4 h-auto gap-2">
            {exporting === 'csv' ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6 text-emerald-400" />}
            <span className="text-xs">CSV</span>
          </button>
          <button onClick={() => download('xlsx')} disabled={!!exporting} className="btn-ghost border border-slate-700 flex-col py-4 h-auto gap-2">
            {exporting === 'xlsx' ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileSpreadsheet className="w-6 h-6 text-brand-400" />}
            <span className="text-xs">Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
