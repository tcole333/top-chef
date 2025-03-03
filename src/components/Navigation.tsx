import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { getDraftSettings } from '@/firebase/draft';

export default function Navigation() {
  const { user, userProfile, logout } = useAuth();
  const [draftActive, setDraftActive] = useState(false);
  
  useEffect(() => {
    // Check if there's an active draft
    const checkDraftStatus = async () => {
      try {
        const draftSettings = await getDraftSettings();
        setDraftActive(draftSettings?.isActive || false);
      } catch (error) {
        console.error('Error checking draft status:', error);
      }
    };
    
    checkDraftStatus();
  }, []);
  
  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-white font-bold text-xl">
                Top Chef Fantasy
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Home
                </Link>
                
                {draftActive && (
                  <Link href="/draft-status" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Draft Status
                  </Link>
                )}
                
                {user && (
                  <Link href="/fantasy-team" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    My Team
                  </Link>
                )}
                
                {userProfile?.isAdmin && (
                  <Link href="/admin" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Admin
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <button
                  onClick={logout}
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              ) : (
                <Link href="/login" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 