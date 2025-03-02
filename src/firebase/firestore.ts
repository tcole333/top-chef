import { db } from './config-simple';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  updateDoc,
  arrayUnion,
  increment,
  Timestamp,
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { Chef, UserProfile, Episode, Team } from '@/types';

// Chef-related functions
export const addChef = async (chef: Omit<Chef, 'id'>) => {
  console.log('Adding chef:', chef);
  try {
    const chefRef = doc(collection(db, 'chefs'));
    console.log('Chef ref created:', chefRef.id);
    await setDoc(chefRef, {
      ...chef,
      id: chefRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Chef added successfully with ID:', chefRef.id);
    return chefRef.id;
  } catch (error) {
    console.error('Error in addChef:', error);
    throw error;
  }
};

export const getChefs = async () => {
  console.log('Fetching chefs...');
  try {
    const chefsSnapshot = await getDocs(collection(db, 'chefs'));
    console.log('Chefs fetched:', chefsSnapshot.size);
    return chefsSnapshot.docs.map(doc => {
      console.log('Chef data:', doc.data());
      return doc.data() as Chef;
    });
  } catch (error) {
    console.error('Error in getChefs:', error);
    throw error;
  }
};

export const getActiveChefs = async () => {
  const q = query(collection(db, 'chefs'), where('status', '==', 'active'));
  const chefsSnapshot = await getDocs(q);
  return chefsSnapshot.docs.map(doc => doc.data() as Chef);
};

// User-related functions
export const createUserProfile = async (user: UserProfile) => {
  await setDoc(doc(db, 'users', user.uid), {
    ...user,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const getUserProfile = async (uid: string) => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  return userDoc.exists() ? userDoc.data() as UserProfile : null;
};

export const updateUserChefs = async (uid: string, chefIds: string[]) => {
  await updateDoc(doc(db, 'users', uid), {
    chefs: chefIds,
    updatedAt: serverTimestamp()
  });
};

// Episode-related functions
export const addEpisode = async (episode: Omit<Episode, 'id'>) => {
  const episodeRef = doc(collection(db, 'episodes'));
  await setDoc(episodeRef, {
    ...episode,
    id: episodeRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return episodeRef.id;
};

export const getEpisodes = async () => {
  const episodesSnapshot = await getDocs(collection(db, 'episodes'));
  return episodesSnapshot.docs.map(doc => doc.data() as Episode);
};

// Scoring functions
export const updateChefStatus = async (chefId: string, status: Chef['status'], eliminatedEpisode?: number) => {
  const updateData: any = {
    status,
    updatedAt: serverTimestamp()
  };
  
  if (eliminatedEpisode) {
    updateData.eliminatedEpisode = eliminatedEpisode;
  }
  
  await updateDoc(doc(db, 'chefs', chefId), updateData);
};

export const updateChefStats = async (
  chefId: string, 
  stats: Partial<Chef['stats']>
) => {
  const updateData: any = { updatedAt: serverTimestamp() };
  
  if (stats.quickfireWins) {
    updateData['stats.quickfireWins'] = increment(stats.quickfireWins);
  }
  
  if (stats.eliminationWins) {
    updateData['stats.eliminationWins'] = increment(stats.eliminationWins);
  }
  
  if (stats.timesInBottom) {
    updateData['stats.timesInBottom'] = increment(stats.timesInBottom);
  }
  
  if (stats.lastChanceKitchenWins) {
    updateData['stats.lastChanceKitchenWins'] = increment(stats.lastChanceKitchenWins);
  }
  
  await updateDoc(doc(db, 'chefs', chefId), updateData);
};

// Team-related functions
export const createTeam = async (team: Omit<Team, 'id'>) => {
  try {
    console.log('Creating team:', team);
    const teamRef = doc(collection(db, 'teams'));
    await setDoc(teamRef, {
      ...team,
      id: teamRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Team created successfully with ID:', teamRef.id);
    return teamRef.id;
  } catch (error) {
    console.error('Error in createTeam:', error);
    throw error;
  }
};

export const getTeam = async (teamId: string) => {
  try {
    console.log('Fetching team:', teamId);
    const teamDoc = await getDoc(doc(db, 'teams', teamId));
    if (!teamDoc.exists()) {
      console.log('Team not found');
      return null;
    }
    console.log('Team data:', teamDoc.data());
    return teamDoc.data() as Team;
  } catch (error) {
    console.error('Error in getTeam:', error);
    throw error;
  }
};

export const getTeamByInviteCode = async (inviteCode: string) => {
  try {
    console.log('Fetching team by invite code:', inviteCode);
    const q = query(collection(db, 'teams'), where('inviteCode', '==', inviteCode));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No team found with invite code');
      return null;
    }
    
    console.log('Team found with invite code');
    return snapshot.docs[0].data() as Team;
  } catch (error) {
    console.error('Error in getTeamByInviteCode:', error);
    throw error;
  }
};

export const joinTeam = async (userId: string, teamId: string) => {
  try {
    console.log(`User ${userId} joining team ${teamId}`);
    
    // Update the team to include the new member
    await updateDoc(doc(db, 'teams', teamId), {
      memberIds: arrayUnion(userId),
      updatedAt: serverTimestamp()
    });
    
    // Update the user profile to reference the team
    await updateDoc(doc(db, 'users', userId), {
      teamId: teamId,
      updatedAt: serverTimestamp()
    });
    
    console.log('User successfully joined team');
    return true;
  } catch (error) {
    console.error('Error in joinTeam:', error);
    throw error;
  }
};

export const leaveTeam = async (userId: string, teamId: string) => {
  try {
    console.log(`User ${userId} leaving team ${teamId}`);
    
    // Update the team to remove the member
    const teamDoc = await getDoc(doc(db, 'teams', teamId));
    if (!teamDoc.exists()) {
      throw new Error('Team not found');
    }
    
    const team = teamDoc.data() as Team;
    const updatedMembers = team.memberIds.filter(id => id !== userId);
    
    // If this was the last member, delete the team
    if (updatedMembers.length === 0) {
      await deleteDoc(doc(db, 'teams', teamId));
      console.log('Team deleted as it has no more members');
    } else {
      await updateDoc(doc(db, 'teams', teamId), {
        memberIds: updatedMembers,
        updatedAt: serverTimestamp()
      });
      console.log('User removed from team');
    }
    
    // Update the user profile to remove the team reference
    await updateDoc(doc(db, 'users', userId), {
      teamId: deleteField(),
      updatedAt: serverTimestamp()
    });
    
    console.log('User successfully left team');
    return true;
  } catch (error) {
    console.error('Error in leaveTeam:', error);
    throw error;
  }
};

export const updateTeamChefs = async (teamId: string, chefIds: string[]) => {
  try {
    console.log(`Updating chefs for team ${teamId}:`, chefIds);
    await updateDoc(doc(db, 'teams', teamId), {
      chefs: chefIds,
      updatedAt: serverTimestamp()
    });
    console.log('Team chefs updated successfully');
    return true;
  } catch (error) {
    console.error('Error in updateTeamChefs:', error);
    throw error;
  }
};

// Generate a random 6-character invite code
export const generateInviteCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}; 