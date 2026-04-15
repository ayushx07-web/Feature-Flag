import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Activity } from 'lucide-react';
import api from '../api';
import { AuditLog, FeatureFlag } from '../types';

const AuditLogPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [page, setPage] = useState(0);
  const [selectedFlagId, setSelectedFlagId] = useState<string>('');

  const { data: flags } = useQuery<FeatureFlag[]>({
    queryKey: ['flags', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/flags`);
      return data;
    }
  });

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs', projectId, page, selectedFlagId],
    queryFn: async () => {
      let url = `/projects/${projectId}/audit-logs?page=${page}&size=25`;
      if (selectedFlagId) url += `&flagId=${selectedFlagId}`;
      const { data } = await api.get(url);
      return data;
    }
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="bg-surface border-b border-border py-4 px-6 flex items-center">
        <Link to={`/projects/${projectId}`} className="text-textMuted hover:text-white transition-colors mr-3">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <Link to="/dashboard" className="text-textMuted hover:text-white transition-colors">Dashboard</Link>
          <span className="text-textMuted">/</span>
          <Link to={`/projects/${projectId}`} className="text-textMuted hover:text-white transition-colors">Project</Link>
          <span className="text-textMuted">/</span>
          <span className="text-white font-medium">Audit Logs</span>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3"><Activity /> Audit Logs</h2>
            
            <div className="w-64">
              <select 
                value={selectedFlagId} 
                onChange={(e) => { setSelectedFlagId(e.target.value); setPage(0); }}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary appearance-none"
              >
                <option value="">All Flags</option>
                {flags?.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.key})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-background border-b border-border text-textMuted">
                <tr>
                  <th className="px-6 py-4 font-medium w-48">Timestamp</th>
                  <th className="px-6 py-4 font-medium">Actor</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={4} className="text-center py-8">Loading logs...</td></tr>
                ) : logs?.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8">No activity found.</td></tr>
                ) : (
                  logs?.map(log => (
                    <tr key={log.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4 text-textMuted align-top whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 align-top text-white font-medium">{log.changedByEmail}</td>
                      <td className="px-6 py-4 align-top">
                        <span className="inline-block bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded text-xs font-mono font-bold">
                          {log.action}
                        </span>
                        {log.flagId && <div className="mt-2 text-xs text-textMuted">Flag ID: <span className="font-mono">{log.flagId.substring(0,8)}...</span></div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {log.oldValue && (
                             <div className="bg-red-500/5 border border-red-500/20 rounded p-2 text-red-200">
                               <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">Old Value</div>
                               <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap">{JSON.stringify(log.oldValue, null, 2)}</pre>
                             </div>
                          )}
                          {log.newValue && (
                             <div className="bg-emerald-500/5 border border-emerald-500/20 rounded p-2 text-emerald-200">
                               <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">New Value</div>
                               <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap">{JSON.stringify(log.newValue, null, 2)}</pre>
                             </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            <div className="p-4 border-t border-border flex justify-between items-center bg-background">
              <button 
                disabled={page === 0} 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="px-4 py-2 text-sm bg-surface disabled:opacity-50 border border-border rounded text-white"
              >
                Previous
              </button>
              <span className="text-textMuted text-sm">Page {page + 1}</span>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={logs?.length !== 25} // Basic logic for next disable
                className="px-4 py-2 text-sm bg-surface disabled:opacity-50 border border-border rounded text-white"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuditLogPage;
