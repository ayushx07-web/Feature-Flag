import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical, Play } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../api';
import { FeatureFlag, TargetingRule } from '../types';
import Modal from '../components/Modal';

// Sortable Rule Item Component
const SortableRule = ({ rule, onDelete }: { rule: TargetingRule, onDelete: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: rule.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-background border border-border p-4 rounded-lg flex items-center gap-4 group">
      <div {...attributes} {...listeners} className="cursor-grab text-textMuted hover:text-white px-1">
        <GripVertical size={16} />
      </div>
      
      <div className="flex-1 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-white px-2 py-1 bg-surface rounded">IF {rule.attribute}</span>
        <span className="text-primary font-mono">{rule.operator}</span>
        <span className="text-white px-2 py-1 bg-surface rounded max-w-xs truncate" title={rule.value}>"{rule.value}"</span>
        <span className="text-textMuted mx-2">THEN</span>
        <span className={`px-2 py-1 rounded font-medium ${rule.ruleValue ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-surface border border-border text-textMuted'}`}>
          {rule.ruleValue ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      <button 
        onClick={() => onDelete(rule.id)}
        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 p-2 transition-all"
        title="Delete Rule"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

const FlagDetailPage: React.FC = () => {
  const { projectId, flagId } = useParams<{ projectId: string, flagId: string }>();
  const queryClient = useQueryClient();
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({ attribute: '', operator: 'EQUALS', value: '', ruleValue: true });
  
  // Tester State
  const [testerUserId, setTesterUserId] = useState('test_user_1');
  const [testerAttributes, setTesterAttributes] = useState('{\n  "email": "user@example.com",\n  "plan": "pro"\n}');
  const [testerResult, setTesterResult] = useState<any>(null);

  const { data: flag, isLoading } = useQuery<FeatureFlag>({
    queryKey: ['flag', projectId, flagId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/flags/${flagId}`);
      return data;
    }
  });

  const updateFlagMutation = useMutation({
    mutationFn: async (payload: Partial<FeatureFlag>) => {
      const { data } = await api.put(`/projects/${projectId}/flags/${flagId}`, {
        name: payload.name || flag?.name,
        description: payload.description || flag?.description,
        enabled: payload.enabled ?? flag?.enabled,
        rolloutPercentage: payload.rolloutPercentage ?? flag?.rolloutPercentage
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flag', projectId, flagId] })
  });

  const addRuleMutation = useMutation({
    mutationFn: async (payload: any) => {
      // Find highest priority
      const maxPrio = flag?.rules?.length ? Math.max(...flag.rules.map(r => r.priority)) : -1;
      payload.priority = maxPrio + 1;
      const { data } = await api.post(`/projects/${projectId}/flags/${flagId}/rules`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flag', projectId, flagId] });
      setIsRuleModalOpen(false);
      setNewRule({ attribute: '', operator: 'EQUALS', value: '', ruleValue: true });
    }
  });

  const updateRulePriorityMutation = useMutation({
    mutationFn: async ({ ruleId, payload }: { ruleId: string, payload: any }) => {
      const { data } = await api.put(`/projects/${projectId}/flags/${flagId}/rules/${ruleId}`, payload);
      return data;
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      await api.delete(`/projects/${projectId}/flags/${flagId}/rules/${ruleId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flag', projectId, flagId] })
  });

  const testEvaluation = async () => {
    try {
      const parsedAttrs = JSON.parse(testerAttributes);
      
      // Need project apiKey to call evaluate endpoint
      const { data: project } = await api.get(`/projects/${projectId}`);
      
      // Call hot path (requires careful setting of header)
      const evaluateRes = await api.post('/evaluate', {
        flagKey: flag?.key,
        userId: testerUserId,
        userAttributes: parsedAttrs
      }, {
        headers: {
          'X-API-Key': project.apiKey 
        }
      });
      
      setTesterResult({ success: true, ...evaluateRes.data });
    } catch (e: any) {
      setTesterResult({ success: false, error: e.message || 'Invalid JSON or Request Failed' });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && flag) {
      const oldIndex = flag.rules.findIndex((r) => r.id === active.id);
      const newIndex = flag.rules.findIndex((r) => r.id === over.id);
      
      const newRules = arrayMove(flag.rules, oldIndex, newIndex);
      
      // Optimistic update
      queryClient.setQueryData(['flag', projectId, flagId], { ...flag, rules: newRules });
      
      // Send sequential updates for priority
      newRules.forEach((rule, idx) => {
        if (rule.priority !== idx) {
          updateRulePriorityMutation.mutate({ 
            ruleId: rule.id, 
            payload: { ...rule, priority: idx } 
          });
        }
      });
    }
  };

  if (isLoading || !flag) return <div className="flex-1 flex justify-center items-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

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
          <span className="text-white font-medium">{flag.key}</span>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-background">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Config */}
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-surface border border-border p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-6 text-white text-wrap break-words">{flag.name} <span className="text-primary block text-sm font-mono mt-1">{flag.key}</span></h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                  <div>
                    <h3 className="font-semibold text-white">Enable Flag</h3>
                    <p className="text-xs text-textMuted max-w-[200px]">Global Kill Switch. Overrides all rules if disabled.</p>
                  </div>
                  <button 
                    onClick={() => updateFlagMutation.mutate({ enabled: !flag.enabled })}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${flag.enabled ? 'bg-emerald-500' : 'bg-surface border border-border'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${flag.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div>
                  <label className="flex justify-between items-center text-sm font-medium text-white mb-2">
                    Percentage Rollout
                    <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs">{flag.rolloutPercentage}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={flag.rolloutPercentage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      // Optimistic local state updates only happen after save, but we can debounce or just trigger
                      updateFlagMutation.mutate({ rolloutPercentage: val });
                    }}
                    className="w-full accent-primary h-2 bg-surface rounded-lg cursor-pointer"
                  />
                  <div className="mt-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs leading-relaxed text-indigo-200">
                    If enabled, users who don't match any targeting rules will be consistently bucketed into this rollout percentage.
                  </div>
                </div>
              </div>
            </div>
            
            {/* Rule Tester Panel */}
            <div className="bg-surface border border-border p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center justify-between">
                <span>Rule Tester</span>
                <button onClick={testEvaluation} className="bg-primary hover:bg-primaryHover text-white p-2 rounded-lg transition-colors"><Play size={16} fill="white" /></button>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-textMuted mb-1">User ID</label>
                  <input type="text" value={testerUserId} onChange={e => setTesterUserId(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-textMuted mb-1">User Attributes (JSON)</label>
                  <textarea value={testerAttributes} onChange={e => setTesterAttributes(e.target.value)} className="w-full h-24 font-mono text-xs bg-background border border-border rounded p-3 focus:border-primary outline-none resize-none" />
                </div>
                
                {testerResult && (
                  <div className={`p-4 rounded-lg border text-sm ${testerResult.success ? 'bg-background border-border' : 'bg-red-500/10 border-red-500/30'}`}>
                    {testerResult.success ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center pb-2 border-b border-border">
                          <span className="text-textMuted">Result</span>
                          <span className={`px-2 py-1 rounded font-medium text-xs ${testerResult.enabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-surface text-textMuted'}`}>
                            {testerResult.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-textMuted">Reason</span>
                          <span className="text-primary font-mono">{testerResult.reason}</span>
                        </div>
                        {testerResult.ruleId && (
                           <div className="flex justify-between items-center text-xs mt-1">
                             <span className="text-textMuted">Rule Match</span>
                             <span className="text-white truncate max-w-[150px]">{testerResult.ruleId}</span>
                           </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-red-400">{testerResult.error}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Rules */}
          <div className="w-full lg:w-2/3">
            <div className="bg-surface border border-border p-6 rounded-xl shadow-lg min-h-full">
              <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Targeting Rules</h2>
                  <p className="text-sm text-textMuted">Rules are evaluated sequentially top-to-bottom.</p>
                </div>
                <button 
                  onClick={() => setIsRuleModalOpen(true)}
                  className="bg-background border border-border hover:border-primary text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                >
                  <Plus size={16} /> Add Rule
                </button>
              </div>

              {flag.rules.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                  <p className="text-textMuted">No targeting rules configured.</p>
                  <button onClick={() => setIsRuleModalOpen(true)} className="text-primary hover:text-primaryHover mt-2 text-sm font-medium">Create one now</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={flag.rules.map(r => r.id)} strategy={verticalListSortingStrategy}>
                      {flag.rules.map((rule) => (
                        <SortableRule 
                          key={rule.id} 
                          rule={rule} 
                          onDelete={(id) => {
                            if (window.confirm("Are you sure?")) {
                              deleteRuleMutation.mutate(id);
                            }
                          }}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Modal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)} title="Add Targeting Rule">
        <form onSubmit={(e) => { e.preventDefault(); addRuleMutation.mutate(newRule); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-textMuted mb-1">Attribute Name</label>
              <input type="text" required value={newRule.attribute} onChange={e => setNewRule({...newRule, attribute: e.target.value})} className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none" placeholder="e.g. email, plan" />
            </div>
            <div>
              <label className="block text-xs font-medium text-textMuted mb-1">Operator</label>
              <select value={newRule.operator} onChange={e => setNewRule({...newRule, operator: e.target.value})} className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none appearance-none">
                <option value="EQUALS">Equals</option>
                <option value="NOT_EQUALS">Not Equals</option>
                <option value="CONTAINS">Contains</option>
                <option value="EXACTLY_MATCHES">Case-Insensitive Match</option>
                <option value="IN">In List (Comma separated)</option>
                <option value="NOT_IN">Not In List</option>
                <option value="STARTS_WITH">Starts With</option>
                <option value="ENDS_WITH">Ends With</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-textMuted mb-1">Value Match</label>
            <input type="text" required value={newRule.value} onChange={e => setNewRule({...newRule, value: e.target.value})} className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none" placeholder="Match string..." />
          </div>

          <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg mt-2">
            <span className="text-sm font-medium">Return Value if Matched</span>
            <button 
              type="button"
              onClick={() => setNewRule({ ...newRule, ruleValue: !newRule.ruleValue })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${newRule.ruleValue ? 'bg-emerald-500' : 'bg-background border border-border'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newRule.ruleValue ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-2">
            <button type="button" onClick={() => setIsRuleModalOpen(false)} className="px-4 py-2 text-sm rounded bg-surface hover:bg-border text-white transition-colors">Cancel</button>
            <button type="submit" disabled={addRuleMutation.isPending} className="px-4 py-2 text-sm rounded bg-primary hover:bg-primaryHover text-white transition-colors">Add Rule</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FlagDetailPage;
