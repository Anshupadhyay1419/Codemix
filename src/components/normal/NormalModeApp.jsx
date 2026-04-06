import React, { useState } from 'react';
import { BarChart2, AlertTriangle, Wand2, Activity, Download, Database, RefreshCw } from 'lucide-react';
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

const TYPE_COLOR = {
  numeric: 'badge-blue', categorical: 'badge-green', text: 'badge-slate',
  datetime: 'badge-amber', email: 'badge-blue', phone: 'badge-green',
  url: 'badge-slate', boolean: 'badge-amber', id: 'badge-slate',
};

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

  if (!datasetInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
        <div className="text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Data Cleaning</p>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1.5">Upload a dataset</h2>
          <p className="text-sm text-gray-400">Start your data cleaning journey with a CSV file</p>
        </div>
        <Step1Upload apiUrl={API_URL} onSuccess={onUpload} />
      </div>
    );
  }

  const cols = colTypes ? Object.keys(colTypes) : [];

  return (
    <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 104px)' }}>
      {/* LEFT — Data Table */}
      <div className="flex-1 card-flat flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <Database className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="font-medium text-gray-800 text-sm truncate">{datasetInfo.filename}</span>
            <span className="text-xs text-gray-400 shrink-0">{datasetInfo.rows.toLocaleString()} rows</span>
          </div>
          <button onClick={() => { setDatasetInfo(null); setColTypes(null); setPreviewData([]); setProfileData(null); }}
            className="btn-ghost text-xs">
            <RefreshCw className="w-3 h-3" />New file
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {previewData.length > 0 ? (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white border-b border-gray-100">
                <tr>
                  {cols.map(c => (
                    <th key={c} className="px-4 py-2.5 text-left font-medium text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('text-[10px]', TYPE_COLOR[colTypes[c]?.type] || 'badge-slate')}>
                          {colTypes[c]?.type?.slice(0, 3)}
                        </span>
                        {c}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    {cols.map(c => (
                      <td key={c} className={cn('px-4 py-2 whitespace-nowrap max-w-[180px] truncate font-mono',
                        !row[c] && row[c] !== 0 ? 'text-gray-300 italic' : 'text-gray-700')}>
                        {!row[c] && row[c] !== 0 ? 'null' : String(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">No preview</div>
          )}
        </div>
      </div>

      {/* RIGHT — Tools */}
      <div className="w-full lg:w-80 card-flat flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-0.5 p-2 border-b border-gray-100 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                activeTab === t.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')}>
              <t.icon className="w-3 h-3" />{t.label}
            </button>
          ))}
        </div>

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
