import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet, FileText, CheckCircle, Wand2, Loader2 } from 'lucide-react';
import { cn } from '../../utils';

export default function Step6Export({ apiUrl }) {
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
    } catch (e) { alert('Failed.'); }
    finally { setApplying(false); }
  };

  const download = async (type) => {
    setExporting(type);
    try {
      const r = await axios.get(`${apiUrl}/export/data`);
      const { filename, data, columns } = r.data;
      const base = filename.replace('.csv', '');
      if (type === 'csv') {
        const blob = new Blob([Papa.unparse(data, { columns })], { type: 'text/csv' });
        trigger(blob, `${base}_cleaned.csv`);
      } else {
        const ws = XLSX.utils.json_to_sheet(data, { header: columns });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cleaned');
        XLSX.writeFile(wb, `${base}_cleaned.xlsx`);
      }
    } catch (e) { alert('Export failed.'); }
    finally { setExporting(null); }
  };

  const trigger = (blob, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Renames */}
      <div className="space-y-3">
        <p className="section-title">Column Rename Suggestions</p>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-xs"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading...</div>
        ) : suggestions.length === 0 ? (
          <p className="text-xs text-gray-400">No suggestions available.</p>
        ) : (
          <>
            {suggestions.map((s, i) => (
              <label key={s.original} className={cn('flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                s.accepted ? 'border-gray-300 bg-gray-50' : 'border-gray-100 hover:border-gray-200')}>
                <input type="checkbox" checked={!!s.accepted} onChange={() => toggle(i)} className="accent-gray-900 w-3.5 h-3.5" />
                <span className="font-mono text-xs text-gray-500">{s.original}</span>
                <span className="text-gray-300">→</span>
                <span className="font-mono text-xs text-gray-800 font-medium">{s.suggested}</span>
              </label>
            ))}
            {!applied ? (
              <button onClick={applyRenames} disabled={applying} className="btn-primary w-full">
                {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Apply Renames
              </button>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs">
                <CheckCircle className="w-3.5 h-3.5" />Applied successfully
              </div>
            )}
          </>
        )}
      </div>

      {/* Export */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <p className="section-title">Export</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => download('csv')} disabled={!!exporting} className="btn-secondary flex-col py-4 h-auto gap-1.5">
            {exporting === 'csv' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 text-emerald-500" />}
            <span className="text-xs">CSV</span>
          </button>
          <button onClick={() => download('xlsx')} disabled={!!exporting} className="btn-secondary flex-col py-4 h-auto gap-1.5">
            {exporting === 'xlsx' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5 text-indigo-500" />}
            <span className="text-xs">Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
