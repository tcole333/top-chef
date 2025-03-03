'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  getDraftSettings, 
  setDraftSettings, 
  startDraft, 
  endDraft,
  getTeamsForDraft,
  testFirestoreWrite,
  DRAFT_DOC_ID,
  DRAFT_COLLECTION,
  doc,
  updateDoc,
  checkFirestorePermissions,
  updateDraftOrder
} from '@/firebase/draft';
import { db } from '@/firebase/config-simple';
import { Team, DraftSettings, Chef } from '@/types';
import toast from 'react-hot-toast';
import { arrayUnion, collection, getDocs, query, where } from 'firebase/firestore';
import { getDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function AdminDraftPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [draftOrder, setDraftOrder] = useState<string[]>([]);
  const [draftSettings, setDraftSettings] = useState<DraftSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [totalRounds, setTotalRounds] = useState(3);
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminAssignment, setShowAdminAssignment] = useState(false);
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [activeTab, setActiveTab] = useState<'settings' | 'draft'>('settings');
  const [draftView, setDraftView] = useState<'available' | 'drafted'>('available');
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch teams
        const teamsData = await getTeamsForDraft();
        setTeams(teamsData);
        
        // Fetch draft settings
        const settings = await getDraftSettings();
        if (settings) {
          setDraftSettings(settings);
          setDraftOrder(settings.order);
          setTotalRounds(settings.totalRounds);
        }
        
        // Fetch chefs
        await fetchChefs();
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load draft data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().isAdmin) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  // Fetch all users for admin assignment
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;
      
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    
    fetchUsers();
  }, [isAdmin]);

  // Add this useEffect to update currentTeam when draft settings change
  useEffect(() => {
    if (draftSettings && draftSettings.isActive && teams.length > 0) {
      const currentTeamId = draftSettings.order[draftSettings.currentPosition];
      const team = teams.find(t => t.id === currentTeamId);
      setCurrentTeam(team || null);
    } else {
      setCurrentTeam(null);
    }
  }, [draftSettings, teams]);

  const handleAddTeam = (teamId: string) => {
    if (draftOrder.includes(teamId)) {
      setError('Team already in draft order');
      return;
    }
    
    setDraftOrder([...draftOrder, teamId]);
    setError('');
  };

  const handleRemoveTeam = (index: number) => {
    const newOrder = [...draftOrder];
    newOrder.splice(index, 1);
    setDraftOrder(newOrder);
  };

  const handleMoveTeam = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === draftOrder.length - 1)) {
      return;
    }
    
    const newOrder = [...draftOrder];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap positions
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    
    setDraftOrder(newOrder);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSaveDraftOrder = async () => {
    if (draftOrder.length === 0) {
      setError('Please add teams to the draft order');
      return;
    }
    
    setIsSaving(true);
    setMessage('');
    setError('');
    
    try {
      console.log('Preparing to save draft order');
      console.log('Draft order to save:', JSON.stringify(draftOrder));
      
      // Try the direct update approach first
      console.log('Trying direct order update first');
      const directUpdateResult = await updateDraftOrder(draftOrder);
      
      if (directUpdateResult) {
        console.log('Direct order update successful');
        setMessage('Draft order saved successfully with direct update!');
        
        // Update the total rounds
        const docRef = doc(db, DRAFT_COLLECTION, DRAFT_DOC_ID);
        await updateDoc(docRef, { totalRounds });
        console.log('Total rounds updated');
        
        // Refresh draft settings
        const settings = await getDraftSettings();
        if (settings) {
          setDraftSettings(settings);
        }
      } else {
        console.log('Direct order update failed, trying standard approach');
        
        // Create a very simple settings object
        const newSettings = {
          order: draftOrder,
          totalRounds
        };
        
        console.log('Draft settings to save:', JSON.stringify(newSettings));
        
        // Try to save the settings
        const draftId = await setDraftSettings(newSettings);
        console.log('Draft settings saved with ID:', draftId);
        
        if (!draftId) {
          console.error('No draft ID returned, but continuing anyway');
          // Instead of throwing, let's continue and see if we can retrieve the settings
        } else {
          setMessage('Draft order saved successfully!');
        }
        
        // Add a small delay to allow Firestore to update
        await delay(2000);
        
        // Refresh draft settings
        try {
          const settings = await getDraftSettings();
          console.log('Retrieved settings after save:', JSON.stringify(settings));
          
          if (settings) {
            // Verify the order was saved correctly
            if (!settings.order || settings.order.length === 0) {
              console.error('Order was not saved in retrieved settings!');
              
              // Try to update the order directly
              const docRef = doc(db, DRAFT_COLLECTION, DRAFT_DOC_ID);
              await updateDoc(docRef, { order: draftOrder });
              console.log('Directly updated order field');
              
              // Get the settings again
              const updatedSettings = await getDraftSettings();
              console.log('Retrieved updated settings:', JSON.stringify(updatedSettings));
              
              if (updatedSettings && updatedSettings.order && updatedSettings.order.length > 0) {
                setDraftSettings(updatedSettings);
                setMessage('Draft order saved and verified!');
              } else {
                setError('Failed to save draft order. Please try again.');
              }
            } else {
              setDraftSettings(settings);
              setMessage('Draft order saved and retrieved successfully!');
            }
          } else {
            console.warn('No draft settings found after save');
            // Create a local version of the settings
            const localSettings = {
              id: draftId || DRAFT_DOC_ID,
              isActive: false,
              order: draftOrder,
              currentPosition: 0,
              round: 1,
              totalRounds,
              picks: []
            };
            setDraftSettings(localSettings);
            setMessage('Draft order saved but had to use local settings');
          }
        } catch (fetchErr) {
          console.error('Error fetching draft settings after save:', fetchErr);
          // Create a local version of the settings
          const localSettings = {
            id: draftId || DRAFT_DOC_ID,
            isActive: false,
            order: draftOrder,
            currentPosition: 0,
            round: 1,
            totalRounds,
            picks: []
          };
          setDraftSettings(localSettings);
          setMessage('Draft order saved but had to use local settings due to fetch error');
        }
      }
    } catch (err) {
      console.error('Error saving draft order:', err);
      setError(`Failed to save draft order: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartDraft = async () => {
    if (!draftSettings || !draftSettings.id) {
      setError('No draft settings found. Please save the draft order first.');
      return;
    }
    
    setIsSaving(true);
    setMessage('');
    setError('');
    
    try {
      await startDraft(draftSettings.id);
      setMessage('Draft started successfully!');
      
      // Refresh draft settings
      const settings = await getDraftSettings();
      if (settings) {
        setDraftSettings(settings);
      }
    } catch (err) {
      console.error('Error starting draft:', err);
      setError(`Failed to start draft: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEndDraft = async () => {
    if (!draftSettings) {
      setError('No draft settings found');
      return;
    }
    
    setIsSaving(true);
    setMessage('');
    setError('');
    
    try {
      await endDraft(draftSettings.id);
      setMessage('Draft ended successfully!');
      
      // Refresh draft settings
      const settings = await getDraftSettings();
      if (settings) {
        setDraftSettings(settings);
      }
    } catch (err) {
      console.error('Error ending draft:', err);
      setError('Failed to end draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestFirestore = async () => {
    setError('');
    setMessage('');
    
    try {
      const result = await testFirestoreWrite();
      if (result) {
        setMessage('Firestore write test successful!');
      }
    } catch (err) {
      console.error('Firestore test failed:', err);
      setError(`Firestore test failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCheckPermissions = async () => {
    setError('');
    setMessage('');
    
    try {
      const result = await checkFirestorePermissions();
      console.log('Permission check result:', result);
      
      if (result.read && result.write && result.update && result.delete) {
        setMessage('All Firestore permissions are working correctly!');
      } else {
        setError(`Firestore permission issues: ${JSON.stringify(result)}`);
      }
    } catch (err) {
      console.error('Error checking permissions:', err);
      setError(`Failed to check permissions: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name || 'Unnamed Team' : `Team ${teamId}`;
  };

  const handleChefClick = (chef: Chef) => {
    if (chef.draftedBy) return; // Already drafted
    setSelectedChef(chef);
    setShowConfirmation(true);
  };

  const confirmDraftPick = async () => {
    if (!selectedChef || !user) return;
    
    try {
      setIsLoading(true);
      
      // Update the chef document with the user who drafted them
      await updateDoc(doc(db, "chefs", selectedChef.id), {
        draftedBy: user.uid,
        draftedByName: user.displayName || "Unknown User",
      });
      
      // Update the user's drafted chefs
      await updateDoc(doc(db, "users", user.uid), {
        draftedChefs: arrayUnion(selectedChef.id)
      });
      
      toast.success(`Successfully drafted ${selectedChef.name}!`);
      setShowConfirmation(false);
      setSelectedChef(null);
      
      // Refresh chefs data
      fetchChefs();
    } catch (error) {
      console.error("Error drafting chef:", error);
      toast.error("Failed to draft chef. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelDraftPick = () => {
    setShowConfirmation(false);
    setSelectedChef(null);
  };

  const handleAdminAssignment = (chef: Chef) => {
    if (chef.draftedBy) return; // Already drafted
    setSelectedChef(chef);
    setShowAdminAssignment(true);
  };

  const confirmAdminAssignment = async () => {
    if (!selectedChef || !selectedUser) return;
    
    try {
      setIsLoading(true);
      
      // Get user data to include their name
      const userDoc = await getDoc(doc(db, "users", selectedUser));
      const userData = userDoc.data();
      
      // Update the chef document with the assigned user
      await updateDoc(doc(db, "chefs", selectedChef.id), {
        draftedBy: selectedUser,
        draftedByName: userData?.displayName || "Unknown User",
      });
      
      // Update the user's drafted chefs
      await updateDoc(doc(db, "users", selectedUser), {
        draftedChefs: arrayUnion(selectedChef.id)
      });
      
      toast.success(`Successfully assigned ${selectedChef.name} to ${userData?.displayName || "user"}!`);
      setShowAdminAssignment(false);
      setSelectedChef(null);
      setSelectedUser(null);
      
      // Refresh chefs data
      fetchChefs();
    } catch (error) {
      console.error("Error assigning chef:", error);
      toast.error("Failed to assign chef. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAdminAssignment = () => {
    setShowAdminAssignment(false);
    setSelectedChef(null);
    setSelectedUser(null);
  };

  const fetchChefs = async () => {
    try {
      const chefsSnapshot = await getDocs(collection(db, "chefs"));
      const chefsData = chefsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Chef[];
      setChefs(chefsData);
    } catch (error) {
      console.error("Error fetching chefs:", error);
      toast.error("Failed to load chefs");
    }
  };

  // Add this function to make a draft pick for the current team
  const makeDraftPick = async (chef: Chef) => {
    if (!draftSettings || !draftSettings.isActive || !currentTeam) {
      toast.error("Draft is not active or no current team");
      return;
    }
    
    if (chef.draftedBy) {
      toast.error("This chef has already been drafted");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get the current team's user ID
      const teamDoc = await getDoc(doc(db, "teams", currentTeam.id));
      const teamData = teamDoc.data();
      const userId = teamData?.userId;
      
      if (!userId) {
        toast.error("Team has no associated user");
        return;
      }
      
      // Update the chef document
      await updateDoc(doc(db, "chefs", chef.id), {
        draftedBy: userId,
        draftedByName: currentTeam.name || "Unknown Team",
        draftedInRound: draftSettings.round,
        draftedAtPosition: draftSettings.currentPosition
      });
      
      // Update the user's drafted chefs
      await updateDoc(doc(db, "users", userId), {
        draftedChefs: arrayUnion(chef.id)
      });
      
      // Add the pick to the draft settings
      const updatedPicks = [...(draftSettings.picks || []), {
        chefId: chef.id,
        chefName: chef.name,
        teamId: currentTeam.id,
        teamName: currentTeam.name || "Unknown Team",
        round: draftSettings.round,
        position: draftSettings.currentPosition
      }];
      
      // Calculate next position and round
      let nextPosition = draftSettings.currentPosition + 1;
      let nextRound = draftSettings.round;
      
      // If we've reached the end of the order, go to the next round
      if (nextPosition >= draftSettings.order.length) {
        nextPosition = 0;
        nextRound++;
      }
      
      // Check if we've completed all rounds
      const draftComplete = nextRound > draftSettings.totalRounds;
      
      // Update the draft settings
      await updateDoc(doc(db, DRAFT_COLLECTION, draftSettings.id), {
        picks: updatedPicks,
        currentPosition: nextPosition,
        round: nextRound,
        isActive: !draftComplete
      });
      
      toast.success(`${chef.name} drafted by ${currentTeam.name || "Unknown Team"}!`);
      
      // Refresh data
      fetchChefs();
      const settings = await getDraftSettings();
      if (settings) {
        setDraftSettings(settings);
      }
      
      if (draftComplete) {
        toast.success("Draft is complete!");
      }
    } catch (error) {
      console.error("Error making draft pick:", error);
      toast.error("Failed to make draft pick");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add this function to advance to the next pick (skip)
  const advanceDraft = async () => {
    if (!draftSettings || !draftSettings.isActive) {
      toast.error("Draft is not active");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Calculate next position and round
      let nextPosition = draftSettings.currentPosition + 1;
      let nextRound = draftSettings.round;
      
      // If we've reached the end of the order, go to the next round
      if (nextPosition >= draftSettings.order.length) {
        nextPosition = 0;
        nextRound++;
      }
      
      // Check if we've completed all rounds
      const draftComplete = nextRound > draftSettings.totalRounds;
      
      // Update the draft settings
      await updateDoc(doc(db, DRAFT_COLLECTION, draftSettings.id), {
        currentPosition: nextPosition,
        round: nextRound,
        isActive: !draftComplete
      });
      
      toast.success("Advanced to next pick");
      
      // Refresh data
      const settings = await getDraftSettings();
      if (settings) {
        setDraftSettings(settings);
      }
      
      if (draftComplete) {
        toast.success("Draft is complete!");
      }
    } catch (error) {
      console.error("Error advancing draft:", error);
      toast.error("Failed to advance draft");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get drafted chefs
  const draftedChefs = chefs.filter(chef => chef.draftedBy);
  // Get available chefs
  const availableChefs = chefs.filter(chef => !chef.draftedBy);

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Admin: Manage Draft</h1>
      
      <div className="mb-6">
        <a href="/admin" className="text-blue-600 hover:underline">
          &larr; Back to Admin Dashboard
        </a>
      </div>
      
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
      
      {/* Tab Navigation */}
      <div className="mb-6 border-b">
        <div className="flex space-x-4">
          <button
            className={`py-2 px-4 ${activeTab === 'settings' 
              ? 'border-b-2 border-blue-500 font-semibold' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('settings')}
          >
            Draft Settings
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'draft' 
              ? 'border-b-2 border-blue-500 font-semibold' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('draft')}
          >
            Draft Board
          </button>
        </div>
      </div>
      
      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div>
          <div className="mb-6">
            {draftSettings ? (
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Current Draft Status</h2>
                <div className="mb-4">
                  <p className="mb-2">
                    <span className="font-semibold">Status:</span> {draftSettings.isActive ? 'Active' : 'Inactive'}
                  </p>
                  <p className="mb-2">
                    <span className="font-semibold">Round:</span> {draftSettings.round} of {draftSettings.totalRounds}
                  </p>
                  <p className="mb-2">
                    <span className="font-semibold">Current Position:</span> {draftSettings.currentPosition + 1} 
                    ({getTeamName(draftSettings.order[draftSettings.currentPosition] || '')})
                  </p>
                  <p className="mb-2">
                    <span className="font-semibold">Picks Made:</span> {draftSettings.picks?.length || 0}
                  </p>
                </div>
                
                <div className="flex space-x-4">
                  {!draftSettings.isActive ? (
                    <button
                      onClick={handleStartDraft}
                      disabled={isSaving}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-300"
                    >
                      {isSaving ? 'Starting...' : 'Start Draft'}
                    </button>
                  ) : (
                    <button
                      onClick={handleEndDraft}
                      disabled={isSaving}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-red-300"
                    >
                      {isSaving ? 'Ending...' : 'End Draft'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-700">No draft settings found. Create a draft order below.</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Available Teams</h2>
              
              {teams.length === 0 ? (
                <p className="text-gray-700">No teams available</p>
              ) : (
                <div className="space-y-2">
                  {teams.map(team => (
                    <div 
                      key={team.id} 
                      className="p-2 border rounded-md flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAddTeam(team.id)}
                    >
                      <span className="font-medium">{team.name || 'Unnamed Team'}</span>
                      <button 
                        className="text-blue-600 hover:text-blue-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddTeam(team.id);
                        }}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Draft Order</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="totalRounds">
                  Total Rounds
                </label>
                <input
                  type="number"
                  id="totalRounds"
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(parseInt(e.target.value) || 1)}
                  min="1"
                  max="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="space-y-2 min-h-[200px]">
                {draftOrder.length === 0 ? (
                  <p className="text-gray-500">Add teams to set the draft order</p>
                ) : (
                  draftOrder.map((teamId, index) => (
                    <div
                      key={teamId}
                      className="p-2 border rounded-md bg-gray-50 flex justify-between items-center"
                    >
                      <div className="flex items-center">
                        <span className="font-bold mr-2">{index + 1}.</span>
                        <span>{getTeamName(teamId)}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleMoveTeam(index, 'up')}
                          disabled={index === 0}
                          className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveTeam(index, 'down')}
                          disabled={index === draftOrder.length - 1}
                          className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleRemoveTeam(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <button
                onClick={handleSaveDraftOrder}
                disabled={isSaving || draftOrder.length === 0}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isSaving ? 'Saving...' : 'Save Draft Order'}
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex space-x-4">
            <button
              onClick={handleTestFirestore}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Test Firestore Write
            </button>
            
            <button
              onClick={handleCheckPermissions}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              Check Permissions
            </button>
          </div>
        </div>
      )}
      
      {/* Draft Board Tab */}
      {activeTab === 'draft' && (
        <div>
          {/* Current Draft Status */}
          {draftSettings && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Current Draft Status</h2>
              
              {draftSettings.isActive ? (
                <div>
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">
                      Round {draftSettings.round} of {draftSettings.totalRounds}
                    </h3>
                    <p className="text-lg">
                      Current Pick: <span className="font-bold">{getTeamName(draftSettings.order[draftSettings.currentPosition] || '')}</span>
                    </p>
                    {currentTeam && (
                      <div className="mt-2 flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                          {currentTeam.name?.charAt(0) || '?'}
                        </div>
                        <span>{currentTeam.name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={advanceDraft}
                      disabled={isLoading}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 disabled:bg-yellow-300"
                    >
                      {isLoading ? 'Processing...' : 'Skip Turn / Next Pick'}
                    </button>
                    
                    <button
                      onClick={handleEndDraft}
                      disabled={isLoading}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-red-300"
                    >
                      {isLoading ? 'Ending...' : 'End Draft'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-700 mb-4">The draft is not currently active.</p>
                  <button
                    onClick={handleStartDraft}
                    disabled={isSaving}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-300"
                  >
                    {isSaving ? 'Starting...' : 'Start Draft'}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Draft Order Display */}
          {draftSettings && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Draft Order</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {draftSettings.order.map((teamId, index) => {
                  const isCurrentPick = draftSettings.isActive && 
                                       index === draftSettings.currentPosition;
                  return (
                    <div 
                      key={`${teamId}-${index}`}
                      className={`p-3 border rounded-md ${
                        isCurrentPick 
                          ? 'bg-blue-100 border-blue-300' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                          {index + 1}
                        </div>
                        <span className={isCurrentPick ? 'font-bold' : ''}>
                          {getTeamName(teamId)}
                        </span>
                        {isCurrentPick && (
                          <span className="ml-2 text-blue-600 text-sm font-semibold">
                            (Current)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Chefs Selection Tabs */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Chefs</h2>
              
              <div className="flex space-x-2">
                <button
                  className={`px-4 py-2 rounded-md ${
                    draftView === 'available' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => setDraftView('available')}
                >
                  Available ({availableChefs.length})
                </button>
                <button
                  className={`px-4 py-2 rounded-md ${
                    draftView === 'drafted' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => setDraftView('drafted')}
                >
                  Drafted ({draftedChefs.length})
                </button>
              </div>
            </div>
            
            {/* Available Chefs */}
            {draftView === 'available' && (
              <div>
                {availableChefs.length === 0 ? (
                  <p className="text-gray-700">No available chefs</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableChefs.map((chef) => (
                      <div
                        key={chef.id}
                        className={`p-4 border rounded-lg bg-white hover:bg-gray-50 ${
                          draftSettings?.isActive && currentTeam 
                            ? 'cursor-pointer' 
                            : 'cursor-not-allowed opacity-70'
                        }`}
                        onClick={() => {
                          if (draftSettings?.isActive && currentTeam) {
                            setSelectedChef(chef);
                            setShowConfirmation(true);
                          } else {
                            toast.error("Draft is not active or no current team");
                          }
                        }}
                      >
                        <div className="font-bold text-lg">{chef.name}</div>
                        <div className="text-sm text-green-500 mt-1">Available</div>
                        {draftSettings?.isActive && currentTeam && (
                          <div className="mt-2 text-xs text-blue-600">
                            Click to draft for {currentTeam.name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Drafted Chefs */}
            {draftView === 'drafted' && (
              <div>
                {draftedChefs.length === 0 ? (
                  <p className="text-gray-700">No drafted chefs yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {draftedChefs.map((chef) => (
                      <div
                        key={chef.id}
                        className="p-4 border rounded-lg bg-gray-50"
                      >
                        <div className="font-bold text-lg">{chef.name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Drafted by: {chef.draftedByName || "Unknown"}
                        </div>
                        {chef.draftedInRound && (
                          <div className="text-xs text-gray-500 mt-1">
                            Round {chef.draftedInRound}, Pick {chef.draftedAtPosition !== undefined ? chef.draftedAtPosition + 1 : '?'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Admin Assignment Controls */}
          {isAdmin && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Admin Controls</h2>
              <p className="mb-2">As an admin, you can assign chefs directly to users.</p>
              <button
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                onClick={() => setShowAdminAssignment(true)}
              >
                Assign Chefs to Users
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Confirmation Dialog for Draft Pick */}
      {showConfirmation && selectedChef && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Draft Pick</h2>
            <p className="mb-4">
              Are you sure you want to draft <span className="font-semibold">{selectedChef.name}</span>
              {currentTeam ? ` for ${currentTeam.name}` : ''}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => {
                  setShowConfirmation(false);
                  setSelectedChef(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => {
                  setShowConfirmation(false);
                  if (currentTeam) {
                    makeDraftPick(selectedChef);
                  } else {
                    confirmDraftPick();
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Confirm Draft"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Admin Assignment Dialog */}
      {showAdminAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Assign Chef to User</h2>
            
            {/* Chef Selection */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Select Chef</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedChef?.id || ""}
                onChange={(e) => {
                  const chef = chefs.find(c => c.id === e.target.value);
                  setSelectedChef(chef || null);
                }}
              >
                <option value="">Select a chef</option>
                {availableChefs.map(chef => (
                  <option key={chef.id} value={chef.id}>
                    {chef.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* User Selection */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Select User</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedUser || ""}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select a user</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.displayName || user.email || user.id}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={cancelAdminAssignment}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={confirmAdminAssignment}
                disabled={isLoading || !selectedUser || !selectedChef}
              >
                {isLoading ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 