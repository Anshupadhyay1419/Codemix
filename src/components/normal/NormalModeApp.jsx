import React, { useState } from 'react';
import { UploadCloud, BarChart2, AlertTriangle, Wand2, Activity, Download, Database, RefreshCw } from 'lucide-react';
import { cn } from '../../utils';
import { API_URL } from '../../config';
import Step1Upload from './Step1Upload';
import Step2Profile from './Step2Profile';
import Step3MissingValues from './Step3MissingValues';
import Step4FlashFill from './Step4FlashFill';
import Step5Anomalies from './Step5Anomalies';
import Step6Export from './Step6Export';

const TABS = [
  { id: 'profile',   label: 'Profile',   icon: BarChart2 },
  { id: 'missing',   label: 'Missing',   icon: AlertTriangle },
  { id: 'transform', label: 'Transform', icon: Wand2 },
  { id: 'anomalies', label: 'Anomalies', icon: Activity },
  { id: 'export',    label: 'Export',    icon: Download },
];

const TYPE_BADGE = { numeric:'badge-blue', categorical:'badge-green', text:'badge-slate', datetime:'badge-amber', email:'badge-blue', phone:'badge-green', url:'badge-slate', boolean:'badge-amber', id:'badge-slate' };

export default function NormalModeApp() {
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [colTypes, setColTypes] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const onUpload = (data) => {
    setDatasetInfo({ filename: data.filename, rows: data.rows, columns: data.columns });
    setPreviewData(data.preview);
    setColTypes(data.col_types);
    setProfileData(null);
    setActiveTab('profile');
  };

  const reset = () => { setDatasetInfo(null); setColTypes(null); setPreviewData([]); setProfileData(null); };

  if (!datasetInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Upload a Dataset</h2>
          <p className="text-slate-500 text-sm">Start your data cleaning journey with a CSV file</p>
        </div>
        <Step1Upload apiUrl={API_URL} onSuccess={onUpload} />
      </div>
    );
  }

  const cols = colTypes ? Object.keys(colTypes) : [];

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)]">
      {/* LEFT — Data Table */}
      <div className="flex-1 flex flex-col min-w-0 glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <div>
            <h2 className="font-semibold text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-400" />
              {datasetInfo.filename}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{datasetInfo.rows.toLocaleString()} rows · {datasetInfo.columns} columns</p>
          </div>
          <button onClick={reset} className="btn-ghost text-xs gap-1">
            <RefreshCw className="w-3 h-3" />New File
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {previewData.length > 0 ? (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm">
                <tr>
                  {cols.map(c => (
                    <th key={c} className="px-3 py-2.5 text-left font-medium text-slate-400 border-b border-slate-700/50 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-semibold', TYPE_BADGE[colTypes[c]?.type] || 'badge-slate')}>
                          {colTypes[c]?.type?.slice(0, 3) || '?'}
                        </span>
                        {c}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                    {cols.map(c => (
                      <td key={c} className={cn('px-3 py-2 font-mono whitespace-nowrap max-w-[160px] truncate',
                        row[c] === '' || row[c] === null || row[c] === undefined
                          ? 'text-slate-600 italic' : 'text-slate-300')}>
                        {row[c] === '' || row[c] === null || row[c] === undefined ? 'null' : String(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-600 text-sm">No preview available</div>
          )}
        </div>
      </div>

      {/* RIGHT — Tools Panel */}
      <div className="w-full lg:w-96 flex flex-col glass rounded-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-2 border-b border-slate-700/50 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                activeTab === t.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800')}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'profile'   && <Step2Profile apiUrl={API_URL} profileData={profileData} setProfileData={setProfileData} colTypes={colTypes} datasetInfo={datasetInfo} setDatasetInfo={setDatasetInfo} />}
          {activeTab === 'missing'   && <Step3MissingValues apiUrl={API_URL} colTypes={colTypes} profileData={profileData} setProfileData={setProfileData} />}
          {activeTab === 'transform' && <Step4FlashFill apiUrl={API_URL} colTypes={colTypes} setColTypes={setColTypes} />}
          {activeTab === 'anomalies' && <Step5Anomalies apiUrl={API_URL} colTypes={colTypes} setDatasetInfo={setDatasetInfo} />}
          {activeTab === 'export'    && <Step6Export apiUrl={API_URL} datasetInfo={datasetInfo} />}
        </div>
      </div>
    </div>
  );
}
