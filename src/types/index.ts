export interface Chef {
  id: string;
  name: string;
  photoURL: string;
  status: 'active' | 'eliminated' | 'last-chance-kitchen';
  stats: {
    quickfireWins: number;
    eliminationWins: number;
    timesInBottom: number;
    lastChanceKitchenWins: number;
  };
  bio: string;
  season: string;
  eliminatedEpisode?: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  teamId?: string;
  chefs: string[];
  points: number;
  history: PointsHistory[];
  role?: 'user' | 'admin';
}

export interface Episode {
  id: string;
  number: number;
  season: string;
  title: string;
  airDate: string;
  recap: string;
  quickfireWinner: string; // Chef ID
  eliminationWinner: string; // Chef ID
  eliminatedChef: string; // Chef ID
  lastChanceKitchenWinner?: string; // Chef ID
}

export interface Team {
  id: string;
  name: string;
  createdAt: any;
  updatedAt: any;
  memberIds: string[];
  chefs: string[];
  points: number;
  history: PointsHistory[];
  inviteCode?: string;
} 