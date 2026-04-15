import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Settings, Activity, Flag as FlagIcon, ArrowLeft, Key } from 'lucide-react';
import api from '../api';
import { Project, FeatureFlag } from '../types';
import Modal from '../components/Modal';

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'flags' | 'audit' | 'settings'>('flags');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({ key: '', name: '', description: '' });

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}`);
      return data;
    }
  });

  const { data: flags, isLoading: flagsLoading } = useQuery<FeatureFlag[]>({
    queryKey: ['flags', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/flags`);
      return data;
    }
  });

  const createFlag = useMutation({
    mutationFn: async (payload: typeof newFlag) => {
      const { data } = await api.post(`/projects/${projectId}/flags`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags', projectId] });
      setIsFlagModalOpen(false);
      setNewFlag({ key: '', name: '', description: '' });
    }
  });

  const toggleFlag = useMutation({
    mutationFn: async (flagId: string) => {
      const { data } = await api.patch(`/projects/${projectId}/flags/${flagId}/toggle`);
      return data;
    },
    // Optimistic Update
    onMutate: async (flagId) => {
      await queryClient.cancelQueries({ queryKey: ['flags', projectId] });
      const previousFlags = queryClient.getQueryData<FeatureFlag[]>(['flags', projectId]);
      if (previousFlags) {
        queryClient.setQueryData<FeatureFlag[]>(['flags', projectId], previousFlags.map(f =>
          f.id === flagId ? { ...f, enabled: !f.enabled } : f
        ));
      }
      return { previousFlags };
    },
    onError: (err, flagId, context) => {
      if (context?.previousFlags) {
        queryClient.setQueryData(['flags', projectId], context.previousFlags);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['flags', projectId] });
    }
  });

  const filteredFlags = flags?.filter(f => 
    f.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (projectLoading) {
    return <div className="flex-1 flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!project) return <div>Project not found</div>;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Top Breadcrumb Header */}
      <header className="bg-surface border-b border-border py-4 px-6 flex items-center">
        <Link to="/dashboard" className="text-textMuted hover:text-white transition-colors mr-3">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <Link to="/dashboard" className="text-textMuted hover:text-white transition-colors">Dashboard</Link>
          <span className="text-textMuted">/</span>
          <span className="text-white font-medium">{project.name}</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tabs */}
        <aside className="w-64 bg-background border-r border-border p-4 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('flags')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'flags' ? 'bg-primary/10 text-primary' : 'text-textMuted hover:bg-surface hover:text-white'}`}
          >
            <FlagIcon size={18} /> Feature Flags
          </button>
          <button 
            onClick={() => navigate(`/projects/${projectId}/audit`)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-textMuted hover:bg-surface hover:text-white`}
          >
            <Activity size={18} /> Audit Log
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-primary/10 text-primary' : 'text-textMuted hover:bg-surface hover:text-white'}`}
          >
            <Settings size={18} /> Settings
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-8 bg-background">
          {activeTab === 'flags' && (
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Feature Flags</h2>
                <button 
                  onClick={() => setIsFlagModalOpen(true)}
                  className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
                >
                  <Plus size={20} /> New Flag
                </button>
              </div>

              <div className="bg-surface rounded-xl border border-border shadow-lg overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border flex items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search flags by key or name..." 
                      className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-surface border-b border-border text-sm text-textMuted">
                      <tr>
                        <th className="px-6 py-4 font-medium">Name</th>
                        <th className="px-6 py-4 font-medium">Key</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Rules</th>
                        <th className="px-6 py-4 font-medium text-right">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {flagsLoading ? (
                        <tr><td colSpan={5} className="text-center py-8 text-textMuted">Loading flags...</td></tr>
                      ) : filteredFlags.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-textMuted">No flags found.</td></tr>
                      ) : (
                        filteredFlags.map(flag => (
                          <tr key={flag.id} className="hover:bg-primary/5 transition-colors group cursor-pointer" onClick={() => navigate(`/projects/${projectId}/flags/${flag.id}`)}>
                            <td className="px-6 py-4 font-medium text-white">{flag.name}</td>
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs bg-background border border-border px-2 py-1 rounded text-textMuted group-hover:border-primary/30 transition-colors">
                                {flag.key}
                              </span>
                            </td>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-3">
                                {/* Toggle switch */}
                                <button 
                                  onClick={() => toggleFlag.mutate(flag.id)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${flag.enabled ? 'bg-emerald-500' : 'bg-surface border border-border'}`}
                                >
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flag.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                {flag.enabled ? (
                                  <span className="text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Enabled</span>
                                ) : (
                                  <span className="text-xs text-textMuted font-medium bg-surface px-2 py-0.5 rounded-full border border-border">Disabled</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-textMuted">
                              {flag.rules?.length || 0} rule(s)
                            </td>
                            <td className="px-6 py-4 text-sm text-textMuted text-right">
                              {new Date(flag.updatedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-8">Project Settings</h2>
              
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-semibold text-white mb-1">API Key Integration</h3>
                  <p className="text-sm text-textMuted mb-6">Use this key in your SDK initialization. Keep it secure.</p>
                  
                  <div className="flex items-center gap-4 bg-background p-4 rounded-lg border border-border">
                    <Key className="text-primary" />
                    <div className="flex-1 font-mono text-sm break-all text-white select-all">
                      {project.apiKey}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-red-500/5 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white mb-1">Rotate API Key</h4>
                    <p className="text-xs text-textMuted max-w-sm">Generating a new key will immediately invalidate the old one. Your running SDKs will lose access until updated.</p>
                  </div>
                  <button 
                    onClick={async () => {
                      if (window.confirm("Are you sure? This will break running clients until they are updated with the new key.")) {
                        await api.post(`/projects/${projectId}/rotate-key`);
                        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
                      }
                    }}
                    className="border border-red-500/50 hover:bg-red-500/10 text-red-500 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    Rotate Key
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Modal isOpen={isFlagModalOpen} onClose={() => setIsFlagModalOpen(false)} title="Create Feature Flag">
        <form onSubmit={(e) => { e.preventDefault(); createFlag.mutate(newFlag); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1">Name</label>
            <input
              type="text"
              required
              value={newFlag.name}
              onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none transition-all"
              placeholder="e.g. New Checkout Design"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1">Flag Key</label>
            <input
              type="text"
              required
              pattern="^[a-z0-9-]+$"
              title="Lowercase alphanumeric and hyphens only"
              value={newFlag.key}
              onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none transition-all font-mono text-sm"
              placeholder="e.g. new-checkout-design"
            />
            <p className="text-xs text-textMuted mt-1">Lowercase alphanumeric with hyphens only.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1">Description</label>
            <textarea
              value={newFlag.description}
              onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none transition-all h-20 resize-none"
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsFlagModalOpen(false)}
              className="bg-transparent border border-border hover:bg-surface px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createFlag.isPending}
              className="bg-primary hover:bg-primaryHover disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {createFlag.isPending ? 'Creating...' : 'Create Flag'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectPage;
