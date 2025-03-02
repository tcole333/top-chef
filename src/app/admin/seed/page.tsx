'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { seedDatabase } from '@/scripts/seedData';

export default function AdminSeedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSeeding, setIsSeeding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="text-center p-4">
        Please sign in to access this page
      </div>
    );
  }

  const handleSeedDatabase = async () => {
    if (!confirm('This will clear existing data and add sample data. Are you sure?')) {
      return;
    }
    
    setIsSeeding(true);
    setMessage('');
    setError('');
    
    try {
      await seedDatabase();
      setMessage('Database seeded successfully!');
    } catch (error) {
      console.error('Error seeding database:', error);
      setError(`Failed to seed database: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Admin: Seed Database</h1>
      
      {message && (
        <div className="bg-green-100 p-4 rounded-md text-green-700 mb-6">
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 p-4 rounded-md text-red-700 mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Seed Database with Sample Data</h2>
        <p className="text-gray-700 mb-6">
          This will clear all existing data and populate the database with sample chefs, teams, and episodes.
          Use this for testing purposes only.
        </p>
        
        <div className="bg-yellow-50 p-4 rounded-md mb-6">
          <h3 className="font-bold text-yellow-800 mb-2">Warning</h3>
          <p className="text-yellow-700">
            This action will delete all existing data in the database. This cannot be undone.
          </p>
        </div>
        
        <button
          onClick={handleSeedDatabase}
          disabled={isSeeding}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-red-300"
        >
          {isSeeding ? 'Seeding Database...' : 'Seed Database'}
        </button>
      </div>
      
      <div className="mt-6">
        <a href="/admin" className="text-blue-600 hover:underline">
          &larr; Back to Admin Dashboard
        </a>
      </div>
    </div>
  );
} 