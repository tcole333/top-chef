'use client';

import { useEffect, useState } from 'react';
import { getChefs } from '@/firebase/firestore';
import { Chef } from '@/types';
import Image from 'next/image';

export default function ChefsPage() {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChefs = async () => {
      try {
        const chefsData = await getChefs();
        setChefs(chefsData);
      } catch (err) {
        console.error('Error fetching chefs:', err);
        setError('Failed to load chefs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchChefs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 p-4 rounded-md text-red-700 max-w-4xl mx-auto my-8">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Top Chef Contestants</h1>
      
      {chefs.length === 0 ? (
        <p className="text-gray-600">No chefs available yet. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chefs.map((chef) => (
            <div key={chef.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="relative h-48 w-full">
                <Image
                  src={chef.photoURL || 'https://via.placeholder.com/300'}
                  alt={chef.name}
                  fill
                  className="object-cover"
                />
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white ${
                  chef.status === 'active' ? 'bg-green-500' : 
                  chef.status === 'eliminated' ? 'bg-red-500' : 'bg-yellow-500'
                }`}>
                  {chef.status === 'active' ? 'Active' : 
                   chef.status === 'eliminated' ? 'Eliminated' : 'Last Chance Kitchen'}
                </div>
              </div>
              
              <div className="p-4">
                <h2 className="text-xl font-bold mb-2 text-gray-900">{chef.name}</h2>
                <p className="text-gray-700 mb-4 text-sm">{chef.bio}</p>
                
                <div className="border-t pt-3">
                  <h3 className="font-semibold text-sm mb-2 text-gray-900">Stats</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-700">Quickfire Wins:</span> {chef.stats.quickfireWins}
                    </div>
                    <div>
                      <span className="text-gray-700">Elimination Wins:</span> {chef.stats.eliminationWins}
                    </div>
                    <div>
                      <span className="text-gray-700">Times in Bottom:</span> {chef.stats.timesInBottom}
                    </div>
                    <div>
                      <span className="text-gray-700">LCK Wins:</span> {chef.stats.lastChanceKitchenWins}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 