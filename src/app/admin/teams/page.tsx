'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config-simple';
import { Team, UserProfile, Chef } from '@/types';
import { getChefs } from '@/firebase/firestore';
import Image from 'next/image';

export default function AdminTeamsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<{[key: string]: UserProfile}>({});
  const [chefs, setChefs] = useState<{[key: string]: Chef}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch teams
        const teamsQuery = query(collection(db, 'teams'), orderBy('createdAt', 'desc'));
        const teamsSnapshot = await getDocs(teamsQuery);
        const teamsData = teamsSnapshot.docs.map(doc => doc.data() as Team);
        setTeams(teamsData);
        
        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.reduce((acc, doc) => {
          const userData = doc.data() as UserProfile;
          acc[userData.uid] = userData;
          return acc;
        }, {} as {[key: string]: UserProfile});
        setUsers(usersData);
        
        // Fetch chefs
        const chefsData = await getChefs();
        const chefsMap = chefsData.reduce((acc, chef) => {
          acc[chef.id] = chef;
          return acc;
        }, {} as {[key: string]: Chef});
        setChefs(chefsMap);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load teams data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading || isLoading) {
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
      <h1 className="text-2xl font-bold mb-6">Admin: Manage Teams</h1>
      
      <div className="mb-6">
        <a href="/admin" className="text-blue-600 hover:underline">
          &larr; Back to Admin Dashboard
        </a>
      </div>
      
      {teams.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-700">No teams have been created yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {teams.map(team => (
            <div key={team.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="bg-gray-100 p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">{team.name || 'Unnamed Team'}</h2>
                  <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {team.points || 0} Points
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Invite Code: <span className="font-mono font-bold">{team.inviteCode || 'N/A'}</span>
                </p>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold mb-2 text-gray-900">Team Members</h3>
                <div className="mb-4">
                  {!team.memberIds || team.memberIds.length === 0 ? (
                    <p className="text-gray-500 text-sm">No members</p>
                  ) : (
                    <ul className="space-y-2">
                      {team.memberIds.map(memberId => {
                        const member = users[memberId];
                        return member ? (
                          <li key={memberId} className="flex items-center">
                            {member.photoURL ? (
                              <div className="relative w-8 h-8 mr-3 rounded-full overflow-hidden">
                                <Image
                                  src={member.photoURL}
                                  alt={member.displayName || 'User'}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 mr-3 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-sm text-gray-600">
                                  {member.displayName ? member.displayName.charAt(0).toUpperCase() : 'U'}
                                </span>
                              </div>
                            )}
                            <span className="text-gray-900">{member.displayName || 'Unknown User'}</span>
                          </li>
                        ) : (
                          <li key={memberId} className="text-gray-500">Unknown user ({memberId})</li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                
                <h3 className="font-semibold mb-2 text-gray-900">Selected Chefs</h3>
                <div>
                  {!team.chefs || team.chefs.length === 0 ? (
                    <p className="text-gray-500 text-sm">No chefs selected</p>
                  ) : (
                    <ul className="space-y-2">
                      {team.chefs.map(chefId => {
                        const chef = chefs[chefId];
                        return chef ? (
                          <li key={chefId} className="flex items-center">
                            <div className="relative w-8 h-8 mr-3 rounded-full overflow-hidden">
                              <Image
                                src={chef.photoURL || 'https://via.placeholder.com/40'}
                                alt={chef.name || 'Chef'}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="text-gray-900">{chef.name || 'Unknown Chef'}</span>
                            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                              chef.status === 'active' ? 'bg-green-100 text-green-800' :
                              chef.status === 'eliminated' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {chef.status === 'active' ? 'Active' :
                               chef.status === 'eliminated' ? 'Eliminated' :
                               'Last Chance Kitchen'}
                            </span>
                          </li>
                        ) : (
                          <li key={chefId} className="text-gray-500">Unknown chef ({chefId})</li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 