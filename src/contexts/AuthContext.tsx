import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '@/firebase/config-simple';
import { createUserProfile, getUserProfile } from '@/firebase/firestore';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Get or create user profile
          let profile = await getUserProfile(user.uid);
          
          if (!profile) {
            // Create new profile if it doesn't exist
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || 'User',
              email: user.email || '',
              photoURL: user.photoURL || '',
              chefs: [],
              points: 0,
              history: []
            };
            
            await createUserProfile(newProfile);
            profile = newProfile;
            console.log('Created new user profile:', profile);
          } else {
            console.log('Found existing user profile:', profile);
          }
          
          setUserProfile(profile);
        } catch (error) {
          console.error('Error getting/creating user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 