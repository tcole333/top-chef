'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveChefs, updateUserChefs, updateTeamChefs } from '@/firebase/firestore';
import { Chef } from '@/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getDraftSettings, isTeamsTurnToDraft, makeDraftPick } from '@/firebase/draft';
import { DraftSettings } from '@/types';

export default function FantasyTeamPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [selectedChefs, setSelectedChefs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [draftSettings, setDraftSettings] = useState<DraftSettings | null>(null);
  
  const MAX_TEAM_SIZE = 3; // Maximum number of chefs a user can select

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchChefs = async () => {
      try {
        const chefsData = await getActiveChefs();
        setChefs(chefsData);
        
        // Initialize selected chefs from user profile
        if (userProfile && userProfile.chefs) {
          setSelectedChefs(userProfile.chefs);
        }
      } catch (err) {
        console.error('Error fetching chefs:', err);
        setError('Failed to load chefs. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (userProfile) {
      fetchChefs();
    }
  }, [userProfile]);

  useEffect(() => {
    const checkDraftStatus = async () => {
      if (userProfile && userProfile.teamId) {
        try {
          const settings = await getDraftSettings();
          if (settings && settings.isActive) {
            setIsDraftMode(true);
            setDraftSettings(settings);
            
            const myTurn = await isTeamsTurnToDraft(userProfile.teamId);
            setIsMyTurn(myTurn);
          } else {
            setIsDraftMode(false);
          }
        } catch (err) {
          console.error('Error checking draft status:', err);
        }
      }
    };
    
    if (userProfile) {
      checkDraftStatus();
    }
  }, [userProfile]);

  const handleChefSelection = async (chefId: string) => {
    if (isDraftMode) {
      if (!isMyTurn) {
        setError("It's not your turn to draft");
        return;
      }
      
      if (!userProfile || !userProfile.teamId || !draftSettings) {
        return;
      }
      
      setIsSaving(true);
      setError('');
      
      try {
        await makeDraftPick(draftSettings.id, userProfile.teamId, chefId);
        setMessage('Draft pick successful!');
        
        // Refresh draft status
        const settings = await getDraftSettings();
        if (settings) {
          setDraftSettings(settings);
          setIsDraftMode(settings.isActive);
          
          if (settings.isActive && userProfile.teamId) {
            const myTurn = await isTeamsTurnToDraft(userProfile.teamId);
            setIsMyTurn(myTurn);
          } else {
            setIsMyTurn(false);
          }
        }
        
        // Refresh user profile to get updated chefs
        // This would be handled by your auth context refresh
      } catch (err) {
        console.error('Error making draft pick:', err);
        setError(`Draft pick failed: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Original non-draft selection logic
      setSelectedChefs(prev => {
        if (prev.includes(chefId)) {
          return prev.filter(id => id !== chefId);
        }
        
        if (prev.length >= MAX_TEAM_SIZE) {
          setError(`You can only select up to ${MAX_TEAM_SIZE} chefs for your team.`);
          return prev;
        }
        
        setError('');
        return [...prev, chefId];
      });
    }
  };

  const handleSaveTeam = async () => {
    if (!user || !userProfile) return;
    
    setIsSaving(true);
    setMessage('');
    setError('');
    
    try {
      if (userProfile.teamId) {
        // If user is part of a team, update the team's chefs
        await updateTeamChefs(userProfile.teamId, selectedChefs);
        setMessage('Team updated successfully!');
      } else {
        // Legacy: update the user's chefs directly
        await updateUserChefs(user.uid, selectedChefs);
        setMessage('Your fantasy team has been updated!');
      }
    } catch (err) {
      console.error('Error saving team:', err);
      setError('Failed to save your team. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Fantasy Team</h1>
        <p>Please sign in to create your fantasy team.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">Your Fantasy Team</h1>
      <p className="text-gray-600 mb-6">
        Select up to {MAX_TEAM_SIZE} chefs for your fantasy team. You'll earn points based on their performance.
      </p>
      
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
      
      {isDraftMode && (
        <div className={`mb-6 p-4 rounded-md ${isMyTurn ? 'bg-green-100' : 'bg-yellow-100'}`}>
          <h2 className="font-bold text-lg mb-2">
            {isMyTurn ? "It's Your Turn to Draft!" : "Draft in Progress"}
          </h2>
          <p className="mb-2">
            {isMyTurn 
              ? "Select a chef below to draft them to your team." 
              : "Please wait for your turn to make a selection."}
          </p>
          {draftSettings && (
            <div className="text-sm">
              <p>Round: {draftSettings.round} of {draftSettings.totalRounds}</p>
              <p>Picks made: {draftSettings.picks.length}</p>
            </div>
          )}
        </div>
      )}
      
      {!isDraftMode && (
        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <h2 className="font-bold mb-2">Selected Chefs: {selectedChefs.length}/{MAX_TEAM_SIZE}</h2>
          <div className="flex flex-wrap gap-2">
            {selectedChefs.length === 0 ? (
              <p className="text-gray-500">No chefs selected yet</p>
            ) : (
              chefs
                .filter(chef => selectedChefs.includes(chef.id))
                .map(chef => (
                  <div key={chef.id} className="bg-white px-3 py-1 rounded-full text-sm font-medium">
                    {chef.name}
                  </div>
                ))
            )}
          </div>
        </div>
      )}
      
      {!isDraftMode && (
        <div className="mb-6">
          <button
            onClick={handleSaveTeam}
            disabled={isSaving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSaving ? 'Saving...' : 'Save Team'}
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chefs.map((chef) => (
          <div 
            key={chef.id} 
            className={`bg-white shadow-md rounded-lg overflow-hidden cursor-pointer transition-all ${
              selectedChefs.includes(chef.id) ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
            }`}
            onClick={() => handleChefSelection(chef.id)}
          >
            <div className="relative h-48 w-full">
              <Image
                src={chef.photoURL || 'https://via.placeholder.com/300'}
                alt={chef.name}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-gray-900">{chef.name}</h2>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedChefs.includes(chef.id)}
                    onChange={() => {}} // Handled by the div click
                    className="h-5 w-5 text-blue-600"
                  />
                </div>
              </div>
              
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
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 