'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getChefs, addEpisode, updateChefStatus, updateChefStats } from '@/firebase/firestore';
import { Chef } from '@/types';
import { useRouter } from 'next/navigation';

export default function AdminEpisodesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [formData, setFormData] = useState({
    number: 1,
    season: 'Season 20',
    title: '',
    airDate: new Date().toISOString().split('T')[0],
    recap: '',
    quickfireWinner: '',
    eliminationWinner: '',
    eliminatedChef: '',
    lastChanceKitchenWinner: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Fetch chefs
  useEffect(() => {
    const fetchChefs = async () => {
      try {
        const chefsData = await getChefs();
        setChefs(chefsData);
      } catch (err) {
        console.error('Error fetching chefs:', err);
        setError('Failed to load chefs. Please try again later.');
      }
    };

    fetchChefs();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');

    try {
      // Add episode
      const episodeId = await addEpisode({
        ...formData,
        number: Number(formData.number)
      });

      // Update chef statuses and stats
      if (formData.quickfireWinner) {
        await updateChefStats(formData.quickfireWinner, { quickfireWins: 1 });
      }

      if (formData.eliminationWinner) {
        await updateChefStats(formData.eliminationWinner, { eliminationWins: 1 });
      }

      if (formData.eliminatedChef) {
        await updateChefStatus(
          formData.eliminatedChef, 
          'eliminated', 
          Number(formData.number)
        );
      }

      if (formData.lastChanceKitchenWinner) {
        await updateChefStats(formData.lastChanceKitchenWinner, { lastChanceKitchenWins: 1 });
      }

      setMessage(`Episode added successfully with ID: ${episodeId}`);
      
      // Reset form
      setFormData({
        number: formData.number + 1,
        season: formData.season,
        title: '',
        airDate: new Date().toISOString().split('T')[0],
        recap: '',
        quickfireWinner: '',
        eliminationWinner: '',
        eliminatedChef: '',
        lastChanceKitchenWinner: ''
      });
    } catch (error) {
      console.error('Error adding episode:', error);
      setError(`Error adding episode: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Admin: Manage Episodes</h1>

      {message && (
        <div className={`p-4 mb-6 rounded bg-green-100 text-green-700`}>
          {message}
        </div>
      )}

      {error && (
        <div className={`p-4 mb-6 rounded bg-red-100 text-red-700`}>
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Add New Episode</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="number">
                Episode Number
              </label>
              <input
                type="number"
                id="number"
                name="number"
                value={formData.number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                min="1"
              />
            </div>

            <div>
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
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="title">
              Episode Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="airDate">
              Air Date
            </label>
            <input
              type="date"
              id="airDate"
              name="airDate"
              value={formData.airDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="recap">
              Episode Recap
            </label>
            <textarea
              id="recap"
              name="recap"
              value={formData.recap}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="quickfireWinner">
                Quickfire Winner
              </label>
              <select
                id="quickfireWinner"
                name="quickfireWinner"
                value={formData.quickfireWinner}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Chef</option>
                {chefs
                  .filter(chef => chef.status === 'active')
                  .map(chef => (
                    <option key={chef.id} value={chef.id}>
                      {chef.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="eliminationWinner">
                Elimination Winner
              </label>
              <select
                id="eliminationWinner"
                name="eliminationWinner"
                value={formData.eliminationWinner}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Chef</option>
                {chefs
                  .filter(chef => chef.status === 'active')
                  .map(chef => (
                    <option key={chef.id} value={chef.id}>
                      {chef.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="eliminatedChef">
                Eliminated Chef
              </label>
              <select
                id="eliminatedChef"
                name="eliminatedChef"
                value={formData.eliminatedChef}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Chef</option>
                {chefs
                  .filter(chef => chef.status === 'active')
                  .map(chef => (
                    <option key={chef.id} value={chef.id}>
                      {chef.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="lastChanceKitchenWinner">
                Last Chance Kitchen Winner
              </label>
              <select
                id="lastChanceKitchenWinner"
                name="lastChanceKitchenWinner"
                value={formData.lastChanceKitchenWinner}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Chef</option>
                {chefs
                  .filter(chef => chef.status === 'eliminated' || chef.status === 'last-chance-kitchen')
                  .map(chef => (
                    <option key={chef.id} value={chef.id}>
                      {chef.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Episode'}
          </button>
        </form>
      </div>
    </div>
  );
} 