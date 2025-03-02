'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getChefs } from '@/firebase/firestore';
import { Chef } from '@/types';

export default function UserProfile() {
  const { user, userProfile, loading } = useAuth();
  const [userChefs, setUserChefs] = useState<Chef[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserChefs = async () => {
      if (userProfile && userProfile.chefs && userProfile.chefs.length > 0) {
        try {
          const allChefs = await getChefs();
          const filteredChefs = allChefs.filter(chef => 
            userProfile.chefs.includes(chef.id)
          );
          setUserChefs(filteredChefs);
        } catch (error) {
          console.error('Error fetching user chefs:', error);
        }
      }
      setIsLoading(false);
    };

    if (userProfile) {
      fetchUserChefs();
    } else {
      setIsLoading(false);
    }
  }, [userProfile]);

  if (loading || isLoading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="text-center p-4">
        Please sign in to view your profile
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
      <div className="flex flex-col items-center">
        {user.photoURL ? (
          <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden">
            <Image
              src={user.photoURL}
              alt={user.displayName || 'User'}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-24 h-24 mb-4 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-2xl text-gray-600">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
        )}
        
        <h2 className="text-xl font-bold mb-2 text-gray-900">{user.displayName || 'User'}</h2>
        <p className="text-gray-700 mb-4">{user.email}</p>
        
        {userProfile && (
          <div className="w-full mt-2 p-2 bg-blue-100 rounded-md">
            <p className="text-sm text-blue-900">
              Total Points: <span className="font-bold">{userProfile.points}</span>
            </p>
          </div>
        )}
        
        <div className="w-full mt-4 p-4 bg-gray-100 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-900">Your Fantasy Team</h3>
            <Link href="/fantasy-team" className="text-sm text-blue-700 hover:underline">
              Edit Team
            </Link>
          </div>
          
          {userChefs.length === 0 ? (
            <p className="text-gray-700">
              No chefs drafted yet. <Link href="/fantasy-team" className="text-blue-700 hover:underline">Create your team</Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {userChefs.map(chef => (
                <li key={chef.id} className="flex items-center p-2 bg-white rounded-md shadow-sm">
                  <div className="relative w-10 h-10 mr-3 rounded-full overflow-hidden">
                    <Image
                      src={chef.photoURL || 'https://via.placeholder.com/40'}
                      alt={chef.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{chef.name}</p>
                    <p className="text-xs text-gray-700">
                      {chef.status === 'active' ? 'Active' : 
                       chef.status === 'eliminated' ? 'Eliminated' : 'Last Chance Kitchen'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 