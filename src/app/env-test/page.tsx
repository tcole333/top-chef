'use client';

import { useEffect } from 'react';

export default function EnvTestPage() {
  useEffect(() => {
    console.log('Environment variables:');
    console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
    console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      <p>Check the console for environment variable values.</p>
      <p className="mt-4">API Key (should be masked): {process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 5)}...</p>
    </div>
  );
} 