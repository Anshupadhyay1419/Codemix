import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../utils';

export default function Step1Upload({ apiUrl, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { setError('File exceeds 200MB limit.'); return; }

    setLoading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post(`${apiUrl}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'text/csv': ['.csv'] }, multiple: false, disabled: loading,
  });

  return (
    <div className="max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300',
          isDragActive
            ? 'border-brand-500 bg-brand-500/10 scale-[1.02]'
            : 'border-slate-700 hover:border-brand-500/60 hover:bg-slate-800/40',
          loading && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          {loading ? (
            <Loader2 className="w-12 h-12 text-brand-400 animate-spin" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <UploadCloud className="w-8 h-8 text-brand-400" />
            </div>
          )}
          <div>
            <p className="text-base font-semibold text-slate-200">
              {loading ? 'Uploading...' : isDragActive ? 'Drop it here' : 'Drop your CSV file here'}
            </p>
            <p className="text-sm text-slate-500 mt-1">or click to browse · max 200MB</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400 font-mono">.csv</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
