'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config-simple';
import { UserProfile } from '@/types';
import Image from 'next/image';

export default function ScoreboardPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('points', 'desc'));
        const snapshot = await getDocs(q);
        const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
        setUsers(usersData);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load scoreboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
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
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Scoreboard</h1>
      
      {users.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-700">No players have joined the fantasy league yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="py-3 px-4 text-left">Rank</th>
                <th className="py-3 px-4 text-left">Player</th>
                <th className="py-3 px-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.uid} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700">
                    {index + 1}
                    {index === 0 && <span className="ml-2 text-yellow-500">👑</span>}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {user.photoURL ? (
                        <div className="relative w-8 h-8 mr-3 rounded-full overflow-hidden">
                          <Image
                            src={user.photoURL}
                            alt={user.displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 mr-3 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm text-gray-600">
                            {user.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-gray-900 font-medium">{user.displayName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">{user.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-8 bg-blue-50 p-4 rounded-md">
        <h2 className="font-bold mb-2 text-gray-900">How Points Are Calculated</h2>
        <p className="text-gray-700">
          Points are awarded based on your chefs' performance in each episode. 
          Visit the <a href="/rules" className="text-blue-700 hover:underline">Rules page</a> for 
          detailed information on the scoring system.
        </p>
      </div>
    </div>
  );
} 