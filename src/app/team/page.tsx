'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  createTeam, 
  getTeam, 
  getTeamByInviteCode, 
  joinTeam, 
  leaveTeam,
  generateInviteCode
} from '@/firebase/firestore';
import { Team } from '@/types';
import Image from 'next/image';

export default function TeamPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createTeamName, setCreateTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (userProfile && userProfile.teamId) {
        try {
          const teamData = await getTeam(userProfile.teamId);
          if (teamData) {
            setTeam(teamData);
            
            // Fetch team members (this would be expanded in a real app)
            // For now, we'll just show the current user
            setTeamMembers([{
              uid: user?.uid,
              displayName: user?.displayName,
              photoURL: user?.photoURL
            }]);
          }
        } catch (error) {
          console.error('Error fetching team:', error);
          setError('Failed to load team data');
        }
      }
      setIsLoading(false);
    };

    if (userProfile) {
      fetchTeamData();
    } else if (!loading) {
      setIsLoading(false);
    }
  }, [userProfile, user, loading]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    setMessage('');
    setError('');
    
    try {
      const newTeam = {
        name: createTeamName,
        memberIds: [user.uid],
        chefs: [],
        points: 0,
        history: [],
        inviteCode: generateInviteCode()
      };
      
      const teamId = await createTeam(newTeam);
      
      // Update user profile to reference the new team
      await joinTeam(user.uid, teamId);
      
      setMessage('Team created successfully!');
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error creating team:', error);
      setError(`Failed to create team: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    setMessage('');
    setError('');
    
    try {
      const teamData = await getTeamByInviteCode(inviteCode.toUpperCase());
      
      if (!teamData) {
        setError('Invalid invite code. Please check and try again.');
        setIsSubmitting(false);
        return;
      }
      
      await joinTeam(user.uid, teamData.id);
      
      setMessage('Successfully joined team!');
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error joining team:', error);
      setError(`Failed to join team: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!user || !team) return;
    
    if (!confirm('Are you sure you want to leave this team?')) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await leaveTeam(user.uid, team.id);
      setMessage('You have left the team');
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error leaving team:', error);
      setError(`Failed to leave team: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="text-center p-4">
        Please sign in to manage your team
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Team Management</h1>
      
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
      
      {team ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{team.name}</h2>
            <button
              onClick={handleLeaveTeam}
              disabled={isSubmitting}
              className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 disabled:bg-red-300"
            >
              Leave Team
            </button>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-2 text-gray-900">Invite Code</h3>
            <div className="bg-gray-100 p-3 rounded-md flex justify-between items-center">
              <span className="font-mono text-lg">{team.inviteCode}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(team.inviteCode || '');
                  setMessage('Invite code copied to clipboard!');
                  setTimeout(() => setMessage(''), 3000);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Share this code with friends to invite them to your team
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">Team Members</h3>
            <ul className="space-y-2">
              {teamMembers.map(member => (
                <li key={member.uid} className="flex items-center p-2 bg-gray-50 rounded-md">
                  {member.photoURL ? (
                    <div className="relative w-8 h-8 mr-3 rounded-full overflow-hidden">
                      <Image
                        src={member.photoURL}
                        alt={member.displayName || 'Team member'}
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
                  <span className="text-gray-900">{member.displayName}</span>
                  {member.uid === user.uid && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Create a Team</h2>
            <form onSubmit={handleCreateTeam}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="teamName">
                  Team Name
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={createTeamName}
                  onChange={(e) => setCreateTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isSubmitting ? 'Creating...' : 'Create Team'}
              </button>
            </form>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Join a Team</h2>
            <form onSubmit={handleJoinTeam}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="inviteCode">
                  Invite Code
                </label>
                <input
                  type="text"
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter 6-character code"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-300"
              >
                {isSubmitting ? 'Joining...' : 'Join Team'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 