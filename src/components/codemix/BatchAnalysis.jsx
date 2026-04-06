import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { UploadCloud, Play, Download, Loader2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { cn } from '../../utils';
import { API_URL } from '../../config';

const MODELS = [
  { value: 'smart',    label: 'Auto-Route (Smart)' },
  { value: 'all',      label: 'All Models' },
  { value: 'misinfo',  label: 'Misinformation' },
  { value: 'fakenews', label: 'Fake News' },
  { value: 'emosen',   label: 'Sentiment' },
];

export default function BatchAnalysis({ apiUrl }) {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [col, setCol] = useState('');
  const [model, setModel] = useState('smart');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setError(''); setResults(null);

    if (f.name.endsWith('.csv')) {
      Papa.parse(f, { header: true, preview: 1, complete: r => { setColumns(r.meta.fields || []); setCol(r.meta.fields?.[0] || ''); } });
    } else if (f.name.endsWith('.xlsx')) {
      const reader = new FileReader();
      reader.onload = e => {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const headers = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 })[0] || [];
        setColumns(headers); setCol(headers[0] || '');
      };
      reader.readAsArrayBuffer(f);
    }
  };

  const run = async () => {
    if (!file || !col) return;
    setLoading(true); setError(''); setResults(null);
    const fd = new FormData();
    fd.append('file', file); fd.append('model_type', model); fd.append('column', col);
    try {
      const res = await fetch(`${API_URL}/nlp/batch_file`, { method: 'POST', body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed'); }
      const data = await res.json();
      setResults(data);
    } catch (e) { setError(e.message || 'Analysis failed.'); }
    finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!results) return;
    const csv = Papa.unparse(results.data, { columns: results.columns });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `batch_results.csv`; a.click();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Config */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="glass rounded-2xl p-5 space-y-4">
          <p className="font-semibold text-slate-200 text-sm">Batch Configuration</p>

          <label className={cn('flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all',
            file ? 'border-brand-500/40 bg-brand-500/5' : 'border-slate-700 hover:border-slate-600')}>
            <input type="file" accept=".csv,.xlsx" onChange={handleFile} className="hidden" />
            {file ? (
              <>
                <FileSpreadsheet className="w-8 h-8 text-brand-400" />
                <span className="text-xs text-slate-300 text-center font-medium">{file.name}</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-slate-600" />
                <span className="text-xs text-slate-500">Upload CSV or Excel</span>
              </>
            )}
          </label>

          {columns.length > 0 && (
            <>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Text Column</label>
                <select value={col} onChange={e => setCol(e.target.value)} className="select">
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Model</label>
                <select value={model} onChange={e => setModel(e.target.value)} className="select">
                  {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </>
          )}

          {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}

          <button onClick={run} disabled={!file || !col || loading} className="btn-primary w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? 'Analysing...' : 'Run Analysis'}
          </button>
        </div>

        {results && (
          <button onClick={exportCSV} className="btn-ghost border border-slate-700 w-full">
            <Download className="w-4 h-4" />Export Results CSV
          </button>
        )}
      </div>

      {/* Results table */}
      <div className="flex-1 glass rounded-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <p className="font-semibold text-slate-200 text-sm">Results</p>
          {results && <span className="badge-blue">{results.results?.length} rows</span>}
        </div>
        <div className="flex-1 overflow-auto">
          {!results && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
              <Play className="w-10 h-10" />
              <p className="text-sm">Run analysis to see results</p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
              <p className="text-sm text-slate-500">Processing rows...</p>
            </div>
          )}
          {results && !loading && (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm">
                <tr>
                  {results.columns?.slice(0, 8).map(c => (
                    <th key={c} className="px-3 py-2.5 text-left font-medium text-slate-400 border-b border-slate-700/50 whitespace-nowrap">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.data?.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                    {results.columns?.slice(0, 8).map(c => (
                      <td key={c} className="px-3 py-2 text-slate-300 font-mono whitespace-nowrap max-w-[160px] truncate">
                        {String(row[c] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
