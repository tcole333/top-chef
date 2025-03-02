import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function UserProfile() {
  const { user, loading } = useAuth();

  if (loading) {
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
        
        <h2 className="text-xl font-bold mb-2">{user.displayName || 'User'}</h2>
        <p className="text-gray-600 mb-4">{user.email}</p>
        
        <div className="w-full mt-4 p-4 bg-gray-100 rounded-md">
          <h3 className="font-semibold mb-2">Your Fantasy Team</h3>
          <p className="text-gray-600">
            No chefs drafted yet. The draft will begin after the first episode airs.
          </p>
        </div>
      </div>
    </div>
  );
} 