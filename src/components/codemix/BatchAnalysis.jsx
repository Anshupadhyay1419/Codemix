import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { UploadCloud, Play, Download, Loader2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { cn } from '../../utils';
import { API_URL } from '../../config';

const MODELS = [
  { value: 'smart',    label: 'Auto-Route' },
  { value: 'all',      label: 'All Models' },
  { value: 'misinfo',  label: 'Misinformation' },
  { value: 'fakenews', label: 'Fake News' },
  { value: 'emosen',   label: 'Sentiment' },
];

export default function BatchAnalysis() {
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
      setResults(await res.json());
    } catch (e) { setError(e.message || 'Analysis failed.'); }
    finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!results) return;
    const blob = new Blob([Papa.unparse(results.data, { columns: results.columns })], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'batch_results.csv'; a.click();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Config */}
      <div className="w-full lg:w-72 flex flex-col gap-3">
        <div className="card space-y-4">
          <p className="text-sm font-medium text-gray-800">Configuration</p>

          <label className={cn('flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all',
            file ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:border-gray-300')}>
            <input type="file" accept=".csv,.xlsx" onChange={handleFile} className="hidden" />
            {file ? (
              <><FileSpreadsheet className="w-6 h-6 text-indigo-500" /><span className="text-xs text-gray-600 text-center font-medium">{file.name}</span></>
            ) : (
              <><UploadCloud className="w-6 h-6 text-gray-300" /><span className="text-xs text-gray-400">Upload CSV or Excel</span></>
            )}
          </label>

          {columns.length > 0 && (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Text Column</label>
                <select value={col} onChange={e => setCol(e.target.value)} className="select">{columns.map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Model</label>
                <select value={model} onChange={e => setModel(e.target.value)} className="select">{MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}

          <button onClick={run} disabled={!file || !col || loading} className="btn-primary w-full">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {loading ? 'Analysing...' : 'Run Analysis'}
          </button>
        </div>

        {results && (
          <button onClick={exportCSV} className="btn-secondary w-full">
            <Download className="w-3.5 h-3.5" />Export CSV
          </button>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 card-flat flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="font-medium text-gray-800 text-sm">Results</p>
          {results && <span className="badge-blue">{results.results?.length} rows</span>}
        </div>
        <div className="flex-1 overflow-auto">
          {!results && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300">
              <Play className="w-8 h-8" /><p className="text-sm">Run analysis to see results</p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" /><p className="text-sm text-gray-400">Processing...</p>
            </div>
          )}
          {results && !loading && (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white border-b border-gray-100">
                <tr>{results.columns?.slice(0, 8).map(c => <th key={c} className="px-4 py-2.5 text-left font-medium text-gray-500 whitespace-nowrap">{c}</th>)}</tr>
              </thead>
              <tbody>
                {results.data?.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    {results.columns?.slice(0, 8).map(c => (
                      <td key={c} className="px-4 py-2 text-gray-700 font-mono whitespace-nowrap max-w-[160px] truncate">{String(row[c] ?? '')}</td>
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
