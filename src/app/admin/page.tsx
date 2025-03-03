'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="text-center p-4">
        Please sign in to access the admin dashboard
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/chefs" className="block">
          <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Manage Chefs</h2>
            <p className="text-gray-700">Add, edit, or remove chefs from the competition.</p>
          </div>
        </Link>
        
        <Link href="/admin/episodes" className="block">
          <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Manage Episodes</h2>
            <p className="text-gray-700">Add new episodes and update chef statuses.</p>
          </div>
        </Link>
        
        <Link href="/admin/teams" className="block">
          <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Manage Teams</h2>
            <p className="text-gray-700">View and manage fantasy teams.</p>
          </div>
        </Link>
        
        <Link href="/admin/seed" className="block">
          <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Seed Database</h2>
            <p className="text-gray-700">Populate the database with sample data for testing.</p>
          </div>
        </Link>
        
        <Link href="/admin/draft" className="block">
          <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Manage Draft</h2>
            <p className="text-gray-700">Set up and control the fantasy draft.</p>
          </div>
        </Link>
      </div>
    </div>
  );
} 