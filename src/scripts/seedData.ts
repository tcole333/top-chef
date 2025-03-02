import { db } from '../firebase/config-simple';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { Chef, UserProfile, Team, Episode } from '../types';
import { generateInviteCode } from '../firebase/firestore';

// Sample chefs data
const sampleChefs: Omit<Chef, 'id'>[] = [
  {
    name: 'Alex Johnson',
    photoURL: 'https://via.placeholder.com/300?text=Alex',
    status: 'active',
    stats: {
      quickfireWins: 2,
      eliminationWins: 1,
      timesInBottom: 0,
      lastChanceKitchenWins: 0
    },
    bio: 'Executive chef from New York with a focus on farm-to-table cuisine.',
    season: 'Season 20'
  },
  {
    name: 'Maria Rodriguez',
    photoURL: 'https://via.placeholder.com/300?text=Maria',
    status: 'active',
    stats: {
      quickfireWins: 1,
      eliminationWins: 2,
      timesInBottom: 1,
      lastChanceKitchenWins: 0
    },
    bio: 'Pastry chef from Miami specializing in fusion desserts.',
    season: 'Season 20'
  },
  {
    name: 'David Kim',
    photoURL: 'https://via.placeholder.com/300?text=David',
    status: 'active',
    stats: {
      quickfireWins: 0,
      eliminationWins: 1,
      timesInBottom: 2,
      lastChanceKitchenWins: 0
    },
    bio: 'Sous chef from Chicago with expertise in Korean-American cuisine.',
    season: 'Season 20'
  },
  {
    name: 'Sarah Thompson',
    photoURL: 'https://via.placeholder.com/300?text=Sarah',
    status: 'active',
    stats: {
      quickfireWins: 1,
      eliminationWins: 0,
      timesInBottom: 1,
      lastChanceKitchenWins: 0
    },
    bio: 'Private chef from Los Angeles focusing on healthy, sustainable cooking.',
    season: 'Season 20'
  },
  {
    name: 'James Wilson',
    photoURL: 'https://via.placeholder.com/300?text=James',
    status: 'eliminated',
    stats: {
      quickfireWins: 0,
      eliminationWins: 0,
      timesInBottom: 3,
      lastChanceKitchenWins: 0
    },
    bio: 'Restaurant owner from Austin specializing in barbecue and Southern cuisine.',
    season: 'Season 20',
    eliminatedEpisode: 2
  },
  {
    name: 'Emily Chen',
    photoURL: 'https://via.placeholder.com/300?text=Emily',
    status: 'last-chance-kitchen',
    stats: {
      quickfireWins: 1,
      eliminationWins: 0,
      timesInBottom: 2,
      lastChanceKitchenWins: 1
    },
    bio: 'Culinary instructor from Seattle with a background in French and Chinese cuisine.',
    season: 'Season 20',
    eliminatedEpisode: 3
  }
];

// Sample teams data
const sampleTeams: Omit<Team, 'id'>[] = [
  {
    name: 'Culinary Crushers',
    memberIds: [],
    chefs: [],
    points: 45,
    history: [
      { season: 'Season 20', episode: 1, points: 15 },
      { season: 'Season 20', episode: 2, points: 30 }
    ],
    createdAt: null,
    updatedAt: null,
    inviteCode: generateInviteCode()
  },
  {
    name: 'Kitchen Commanders',
    memberIds: [],
    chefs: [],
    points: 35,
    history: [
      { season: 'Season 20', episode: 1, points: 10 },
      { season: 'Season 20', episode: 2, points: 25 }
    ],
    createdAt: null,
    updatedAt: null,
    inviteCode: generateInviteCode()
  }
];

// Sample episodes data
const sampleEpisodes: Omit<Episode, 'id'>[] = [
  {
    number: 1,
    season: 'Season 20',
    title: 'First Impressions',
    airDate: '2023-03-01',
    recap: 'Chefs competed in a signature dish challenge to showcase their culinary style.',
    quickfireWinner: '',  // Will be filled with actual chef IDs after creation
    eliminationWinner: '',
    eliminatedChef: '',
    lastChanceKitchenWinner: ''
  },
  {
    number: 2,
    season: 'Season 20',
    title: 'Restaurant Wars',
    airDate: '2023-03-08',
    recap: 'Teams competed to create and run a pop-up restaurant concept.',
    quickfireWinner: '',
    eliminationWinner: '',
    eliminatedChef: '',
    lastChanceKitchenWinner: ''
  },
  {
    number: 3,
    season: 'Season 20',
    title: 'Farm to Table',
    airDate: '2023-03-15',
    recap: 'Chefs visited a local farm and created dishes using fresh, seasonal ingredients.',
    quickfireWinner: '',
    eliminationWinner: '',
    eliminatedChef: '',
    lastChanceKitchenWinner: ''
  }
];

// Function to clear existing data
async function clearCollection(collectionName: string) {
  console.log(`Clearing ${collectionName} collection...`);
  const snapshot = await getDocs(collection(db, collectionName));
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  console.log(`${snapshot.size} documents deleted from ${collectionName}`);
}

// Function to seed chefs
async function seedChefs() {
  console.log('Seeding chefs...');
  const chefIds: string[] = [];
  
  for (const chef of sampleChefs) {
    const chefRef = doc(collection(db, 'chefs'));
    const chefId = chefRef.id;
    chefIds.push(chefId);
    
    await setDoc(chefRef, {
      ...chef,
      id: chefId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`Added chef: ${chef.name} with ID: ${chefId}`);
  }
  
  return chefIds;
}

// Function to seed teams
async function seedTeams(chefIds: string[]) {
  console.log('Seeding teams...');
  const teamIds: string[] = [];
  
  for (const team of sampleTeams) {
    const teamRef = doc(collection(db, 'teams'));
    const teamId = teamRef.id;
    teamIds.push(teamId);
    
    // Assign random chefs to each team
    const teamChefs = chefIds
      .filter(id => Math.random() > 0.5)
      .slice(0, 3);
    
    await setDoc(teamRef, {
      ...team,
      id: teamId,
      chefs: teamChefs,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`Added team: ${team.name} with ID: ${teamId}`);
  }
  
  return teamIds;
}

// Function to seed episodes
async function seedEpisodes(chefIds: string[]) {
  console.log('Seeding episodes...');
  
  for (const episode of sampleEpisodes) {
    const episodeRef = doc(collection(db, 'episodes'));
    
    // Assign random chefs to episode roles
    const activeChefs = chefIds.slice(0, 4); // First 4 chefs are active
    const eliminatedChefs = chefIds.slice(4); // Last 2 chefs are eliminated
    
    const quickfireWinner = activeChefs[Math.floor(Math.random() * activeChefs.length)];
    const eliminationWinner = activeChefs[Math.floor(Math.random() * activeChefs.length)];
    const eliminatedChef = episode.number === 2 ? chefIds[4] : 
                          episode.number === 3 ? chefIds[5] : '';
    const lastChanceKitchenWinner = episode.number === 3 ? chefIds[5] : '';
    
    await setDoc(episodeRef, {
      ...episode,
      id: episodeRef.id,
      quickfireWinner,
      eliminationWinner,
      eliminatedChef,
      lastChanceKitchenWinner,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`Added episode: ${episode.title} with ID: ${episodeRef.id}`);
  }
}

// Main seed function
export async function seedDatabase() {
  try {
    // Clear existing data
    await clearCollection('chefs');
    await clearCollection('teams');
    await clearCollection('episodes');
    
    // Seed data
    const chefIds = await seedChefs();
    const teamIds = await seedTeams(chefIds);
    await seedEpisodes(chefIds);
    
    console.log('Database seeded successfully!');
    return { chefIds, teamIds };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
} 