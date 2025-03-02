'use client';

import { useEffect } from 'react';
import { auth } from '@/firebase/config';

export default function FirebaseTestPage() {
  useEffect(() => {
    console.log('Firebase auth object:', auth);
    console.log('Firebase config:', {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Firebase Test Page</h1>
      <p>Check the console for Firebase configuration details.</p>
    </div>
  );
} 