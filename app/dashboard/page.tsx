// src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Layout, LogOut, Cpu, Calendar, Trash2, Search } from 'lucide-react';

// Define what a Project looks like
type Project = {
  id: number;
  title: string;
  description: string;
  created_at: string;
};

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const handleDeleteProject = async (id: number) => {
  // Confirmation is key to prevent accidental clicks
  if (!confirm("Are you sure you want to delete this project permanently?")) return;

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Remove from local state immediately for a "snappy" UI
    setProjects(prev => prev.filter(p => p.id !== id));
  } catch (error: any) {
    alert("Error deleting project: " + error.message);
  }
};

  // 1. Check if user is logged in & Fetch Projects
const [userId, setUserId] = useState<string | null>(null); // Add this state

useEffect(() => {
  const getData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }
    
    setUserEmail(user.email || '');
    setUserId(user.id);

    // Fetch projects for this specific user
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id) // Security: only fetch current user's projects
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching projects:', error);
    else setProjects(data || []);
    
    setLoading(false);
  };
  getData();
}, [router]);

  // 2. Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // 3. Handle Create New Project
  const handleCreateProject = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newProjectTitle.trim() || !userId) return;

  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ 
          title: newProjectTitle, 
          description: 'A new composable AI flow', 
          user_id: userId,
          flow_data: {} 
      }])
      .select();

    if (error) throw error;
    if (data && data[0]) {
      router.push(`/editor/${data[0].id}`);
    }
  } catch (err: any) {
    alert(err.message);
    setLoading(false);
  }
};
const [searchQuery, setSearchQuery] = useState('');

// Filter projects based on the search input
const filteredProjects = projects.filter(project =>
  project.title.toLowerCase().includes(searchQuery.toLowerCase())
);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Studio...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      
      {/* Top Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Composable AI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:block">{userEmail}</span>
            <button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-full transition-colors" title="Sign out">
              <LogOut className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
     <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  
  {/* Header Section */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
    <div>
      <h1 className="text-3xl font-bold">Your Projects</h1>
      <p className="text-slate-400 mt-1">Manage and deploy your AI pipelines.</p>
    </div>
    <button 
      onClick={() => {
        setNewProjectTitle('');
        setIsModalOpen(true);
      }}
      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
    >
      <Plus className="h-5 w-5" />
      New Flow
    </button>
  </div>

  {/* Search Bar Section - Only show if there are projects */}
 {/* Search Bar Section */}
        {projects.length > 0 && (
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search your flows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        )}

        {/* PROJECTS LOGIC */}
        {projects.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
            <Layout className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300">No projects yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">Get started by creating a new AI flow.</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 italic">No projects match "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div 
                key={project.id} 
                onClick={() => router.push(`/editor/${project.id}`)}
                className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 transition-all hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-500/10 p-2 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                    <Layout className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 font-mono">ID: {project.id}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-md transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2">{project.title}</h3>
                <p className="text-slate-400 text-sm line-clamp-2 mb-4">{project.description}</p>
                <div className="flex items-center text-xs text-slate-500 gap-2 border-t border-slate-800 pt-4 mt-auto">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CREATE PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-white mb-2">Create New Flow</h2>
            <p className="text-slate-400 text-sm mb-6">Give your project a name to start building.</p>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Project Name</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="e.g. My Smart Assistant"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 font-medium hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={!newProjectTitle.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div> // Closes root div
  );
} // Closes Dashboard function