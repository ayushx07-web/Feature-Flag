import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, LayoutGrid, LogOut } from 'lucide-react';
import api from '../api';
import { Project } from '../types';
import { useAuth } from '../hooks/AuthContext';
import Modal from '../components/Modal';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return data;
    }
  });

  const createProject = useMutation({
    mutationFn: async (payload: { name: string, description: string }) => {
      const { data } = await api.post('/projects', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      setNewProject({ name: '', description: '' });
    }
  });

  const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-surface border-b border-border py-4 px-6 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-xl font-bold text-white">FF</span>
          </div>
          <h1 className="text-xl font-semibold">Console</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-textMuted hidden md:block">{user?.email}</span>
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold border border-border">
              {getInitials(user?.fullName || user?.email || '')}
            </div>
            <button onClick={logout} className="p-2 text-textMuted hover:text-white transition-colors" title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-1">Projects</h2>
            <p className="text-textMuted text-sm">Manage your environments and feature flags</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus size={20} />
            <span>New Project</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : projects?.length === 0 ? (
          <div className="bg-surface border border-border border-dashed rounded-xl p-12 text-center flex flex-col items-center">
            <LayoutGrid size={48} className="text-border mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
            <p className="text-textMuted mb-6 max-w-sm">Get started by creating a project to manage your feature flags.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-primary/20"
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map(project => (
              <Link 
                key={project.id} 
                to={`/projects/${project.id}`}
                className="bg-surface hover:bg-surface/80 border border-border hover:border-primary/50 p-6 rounded-xl transition-all block group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-white group-hover:text-primary transition-colors">{project.name}</h3>
                  <span className="text-xs bg-background text-textMuted px-2 py-1 rounded border border-border">
                    {project.slug}
                  </span>
                </div>
                <p className="text-sm text-textMuted mb-6 line-clamp-2 h-10">
                  {project.description || "No description provided."}
                </p>
                <div className="flex justify-between items-center text-xs text-textMuted border-t border-border pt-4">
                  <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
        <form onSubmit={(e) => { e.preventDefault(); createProject.mutate(newProject); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1">Project Name</label>
            <input
              type="text"
              required
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="e.g. Production Environment"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1">Description</label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all h-24 resize-none"
              placeholder="What is this project for?"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="bg-transparent border border-border hover:bg-surface text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="bg-primary hover:bg-primaryHover disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DashboardPage;
