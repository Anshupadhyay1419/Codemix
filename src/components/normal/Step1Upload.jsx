import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { UploadCloud, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../utils';

export default function Step1Upload({ apiUrl, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { setError('File exceeds 200MB limit.'); return; }
    setLoading(true); setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post(`${apiUrl}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.');
    } finally { setLoading(false); }
  }, [apiUrl, onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'text/csv': ['.csv'] }, multiple: false, disabled: loading,
  });

  return (
    <div className="max-w-md mx-auto space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200',
          isDragActive ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50',
          loading && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {loading
            ? <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            : <UploadCloud className={cn('w-8 h-8 transition-colors', isDragActive ? 'text-gray-600' : 'text-gray-300')} />
          }
          <div>
            <p className="text-sm font-medium text-gray-700">
              {loading ? 'Uploading...' : isDragActive ? 'Drop to upload' : 'Drop your CSV here'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">or click to browse · max 200MB</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}
    </div>
  );
}
