'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addChef } from '@/firebase/firestore';
import seedChefs from '@/scripts/seed-chefs';
import { useRouter } from 'next/navigation';

export default function AdminChefsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    photoURL: '',
    bio: '',
    season: 'Season 20'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Redirect if not logged in
  if (!loading && !user) {
    router.push('/');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const chefData = {
        ...formData,
        status: 'active' as const,
        stats: {
          quickfireWins: 0,
          eliminationWins: 0,
          timesInBottom: 0,
          lastChanceKitchenWins: 0
        }
      };

      console.log('Submitting chef data:', chefData);
      const chefId = await addChef(chefData);
      console.log('Chef added with ID:', chefId);
      setMessage(`Chef added successfully with ID: ${chefId}`);
      setFormData({
        name: '',
        photoURL: '',
        bio: '',
        season: 'Season 20'
      });
    } catch (error) {
      console.error('Error adding chef:', error);
      setMessage(`Error adding chef: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedChefs = async () => {
    setIsSubmitting(true);
    setMessage('');

    try {
      await seedChefs();
      setMessage('Sample chefs added successfully!');
    } catch (error) {
      console.error('Error seeding chefs:', error);
      setMessage('Error adding sample chefs. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Admin: Manage Chefs</h1>

      {message && (
        <div className={`p-4 mb-6 rounded ${message.includes('Error') ? 'bg-red-100' : 'bg-green-100'}`}>
          {message}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Chef</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="name">
              Chef Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="photoURL">
              Photo URL
            </label>
            <input
              type="url"
              id="photoURL"
              name="photoURL"
              value={formData.photoURL}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="https://example.com/photo.jpg"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="bio">
              Biography
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={4}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="season">
              Season
            </label>
            <input
              type="text"
              id="season"
              name="season"
              value={formData.season}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Chef'}
          </button>
        </form>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <button
          onClick={handleSeedChefs}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Sample Chefs'}
        </button>
        <p className="mt-2 text-sm text-gray-600">
          This will add 6 sample chefs to the database for testing purposes.
        </p>
      </div>
    </div>
  );
} 