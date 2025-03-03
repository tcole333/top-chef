'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDraftSettings, getTeamsForDraft } from '@/firebase/draft';
import { getActiveChefs } from '@/firebase/firestore';
import { DraftSettings, Team, Chef, DraftPick } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

export default function DraftStatusPage() {
  const { user, userProfile } = useAuth();
  const [draftSettings, setDraftSettings] = useState<DraftSettings | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch draft settings
        const settings = await getDraftSettings();
        if (settings) {
          setDraftSettings(settings);
        }
        
        // Fetch teams
        const teamsData = await getTeamsForDraft();
        setTeams(teamsData);
        
        // Fetch chefs
        const chefsData = await getActiveChefs();
        setChefs(chefsData);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching draft data:', err);
        setError('Failed to load draft data. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Set up a refresh interval
    const intervalId = setInterval(fetchData, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Get team name by ID
  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name || 'Unnamed Team' : `Team ${teamId}`;
  };
  
  // Get chef name by ID
  const getChefName = (chefId: string) => {
    const chef = chefs.find(c => c.id === chefId);
    return chef ? chef.name : `Chef ${chefId}`;
  };
  
  // Get chef photo by ID
  const getChefPhoto = (chefId: string) => {
    const chef = chefs.find(c => c.id === chefId);
    return chef ? chef.photoURL : '';
  };
  
  // Get remaining chefs (not picked yet)
  const getRemainingChefs = () => {
    if (!draftSettings || !draftSettings.picks) return chefs;
    
    const pickedChefIds = draftSettings.picks
      .filter(pick => pick.chefId)
      .map(pick => pick.chefId);
    
    return chefs.filter(chef => !pickedChefIds.includes(chef.id));
  };
  
  // Get upcoming picks
  const getUpcomingPicks = () => {
    if (!draftSettings || !draftSettings.order || draftSettings.order.length === 0) return [];
    
    const { order, currentPosition, round, totalRounds } = draftSettings;
    
    const upcomingPicks = [];
    let pos = currentPosition;
    let currentRound = round;
    
    // Add the next 5 picks or until the draft ends
    for (let i = 0; i < 5; i++) {
      if (currentRound > totalRounds) break;
      
      // Snake draft logic
      const isEvenRound = currentRound % 2 === 0;
      const teamIndex = isEvenRound ? order.length - 1 - pos : pos;
      
      // Make sure the index is valid
      if (teamIndex >= 0 && teamIndex < order.length) {
        upcomingPicks.push({
          teamId: order[teamIndex],
          position: pos,
          round: currentRound
        });
      }
      
      // Move to next position
      pos++;
      if (pos >= order.length) {
        pos = 0;
        currentRound++;
      }
    }
    
    return upcomingPicks;
  };
  
  // Get previous picks
  const getPreviousPicks = () => {
    if (!draftSettings || !draftSettings.picks) return [];
    
    // Sort picks by position
    return [...draftSettings.picks]
      .filter(pick => pick.chefId) // Only show completed picks
      .sort((a, b) => b.position - a.position); // Most recent first
  };
  
  // Check if it's the user's team's turn
  const isMyTeamsTurn = () => {
    if (!draftSettings || !userProfile || !userProfile.teamId) return false;
    
    const currentTeamId = getCurrentTeamId();
    if (!currentTeamId) return false;
    
    return currentTeamId === userProfile.teamId;
  };
  
  // Update the Current Pick section in the Draft Status page
  const getCurrentTeamId = () => {
    if (!draftSettings || !draftSettings.order || draftSettings.order.length === 0) {
      return null;
    }
    
    // Snake draft logic
    const { order, currentPosition, round } = draftSettings;
    const isEvenRound = round % 2 === 0;
    const teamIndex = isEvenRound ? order.length - 1 - currentPosition : currentPosition;
    
    // Make sure the index is valid
    if (teamIndex < 0 || teamIndex >= order.length) {
      console.error('Invalid team index:', teamIndex, 'Order length:', order.length);
      return null;
    }
    
    return order[teamIndex];
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Draft Status</h1>
      
      {error && (
        <div className="bg-red-100 p-4 rounded-md text-red-700 mb-6">
          {error}
        </div>
      )}
      
      {!draftSettings ? (
        <div className="bg-yellow-100 p-4 rounded-md text-yellow-700 mb-6">
          No active draft found. Please check back later.
        </div>
      ) : !draftSettings.isActive ? (
        <div className="bg-yellow-100 p-4 rounded-md text-yellow-700 mb-6">
          The draft is not currently active. Please check back later.
        </div>
      ) : (
        <>
          {/* Current Pick */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Current Pick</h2>
            
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <p className="text-lg font-semibold">
                  Round {draftSettings.round} of {draftSettings.totalRounds}
                </p>
                {getCurrentTeamId() ? (
                  <p className="text-xl font-bold mt-2">
                    {getTeamName(getCurrentTeamId())}
                    {isMyTeamsTurn() && (
                      <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm">
                        Your Pick!
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-xl font-bold mt-2 text-red-500">
                    No team on the clock (draft order may be empty)
                  </p>
                )}
                <p className="text-gray-600 mt-1">
                  Pick {draftSettings.currentPosition + 1} of {draftSettings.order?.length || 0}
                </p>
              </div>
              
              {isMyTeamsTurn() && (
                <Link href="/fantasy-team" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
                  Make Your Pick
                </Link>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Previous Picks */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Previous Picks</h2>
              
              {getPreviousPicks().length === 0 ? (
                <p className="text-gray-500">No picks have been made yet.</p>
              ) : (
                <div className="space-y-4">
                  {getPreviousPicks().slice(0, 10).map((pick, index) => (
                    <div key={index} className="flex items-center border-b pb-3">
                      <div className="w-12 h-12 relative mr-4">
                        {pick.chefId && (
                          <Image
                            src={getChefPhoto(pick.chefId)}
                            alt={getChefName(pick.chefId)}
                            fill
                            className="object-cover rounded-full"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{pick.chefId && getChefName(pick.chefId)}</p>
                        <p className="text-sm text-gray-600">
                          Picked by {getTeamName(pick.teamId)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Upcoming Picks */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Upcoming Picks</h2>
              
              <div className="space-y-3">
                {getUpcomingPicks().map((pick, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-md ${index === 0 ? 'bg-blue-50 border border-blue-200' : 'border'}`}
                  >
                    <p className="font-semibold">{getTeamName(pick.teamId)}</p>
                    <p className="text-sm text-gray-600">
                      Round {pick.round}, Pick {pick.position + 1}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Available Chefs */}
          <div className="mt-8 bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Available Chefs</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {getRemainingChefs().map(chef => (
                <div key={chef.id} className="border rounded-md p-3 text-center">
                  <div className="w-20 h-20 relative mx-auto mb-2">
                    <Image
                      src={chef.photoURL}
                      alt={chef.name}
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                  <p className="font-semibold text-sm">{chef.name}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {userProfile?.isAdmin && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Debug Information (Admin Only)</h3>
          <pre className="text-xs overflow-auto bg-white p-2 rounded">
            {JSON.stringify({
              draftSettings: {
                ...draftSettings,
                picks: draftSettings?.picks?.length || 0
              },
              teams: teams.map(t => ({ id: t.id, name: t.name })),
              currentTeamId: getCurrentTeamId(),
              upcomingPicks: getUpcomingPicks()
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 