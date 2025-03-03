'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDraftSettings } from '@/firebase/draft';

export default function Home() {
  const [draftActive, setDraftActive] = useState(false);
  
  useEffect(() => {
    console.log('Home page mounted');
    console.log('Environment variables:');
    console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      console.log('Running in browser');
    }
    
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
    <div className="space-y-6">
      <section className="bg-gray-100 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Welcome to Top Chef Fantasy League</h2>
        <p>
          Join our fantasy league for Top Chef enthusiasts! Draft your favorite chefs,
          earn points based on their performance, and compete with friends.
        </p>
        <div className="mt-4 p-4 bg-yellow-100 rounded">
          <p>Debug Info:</p>
          <p>API Key (should be masked): {process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 5)}...</p>
        </div>
      </section>
      
      {/* Rest of your home page content */}
      {draftActive && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Fantasy Draft</h2>
          <Link href="/draft-status" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            View Draft Status
          </Link>
        </div>
      )}
    </div>
  );
} 