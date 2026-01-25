// src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Layout, LogOut, Cpu, Calendar } from 'lucide-react';

// Define what a Project looks like
type Project = {
  id: number;
  title: string;
  description: string;
  created_at: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  // 1. Check if user is logged in & Fetch Projects
  useEffect(() => {
    const getData = async () => {
      // Get User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/'); // Kick them back to login if not logged in
        return;
      }
      setUserEmail(user.email || '');

      // Get Projects
      const { data, error } = await supabase
        .from('projects')
        .select('*')
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
  const createNewProject = async () => {
    const title = prompt("Enter project name:");
    if (!title) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('projects')
      .insert([
        { 
          title: title, 
          description: 'A new composable AI flow', 
          user_id: user.id,
          flow_data: {} // Empty flow to start
        }
      ]);

    if (error) alert(error.message);
    else window.location.reload(); // Refresh to see the new project
  };

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
            onClick={createNewProject}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="h-5 w-5" />
            New Flow
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          // Empty State
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
            <Layout className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300">No projects yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">Get started by creating a new AI flow to process data or build agents.</p>
          </div>
        ) : (
          // List of Projects
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
  key={project.id} 
  onClick={() => router.push(`/editor/${project.id}`)} // <--- Add this
  className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 transition-all hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer"
>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-500/10 p-2 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                    <Layout className="h-6 w-6 text-indigo-400" />
                  </div>
                  <span className="text-xs text-slate-500 font-mono">ID: {project.id}</span>
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
    </div>
  );
}